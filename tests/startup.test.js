import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { listenAvailable } from '../src/startup.js';

test('porta ocupada: CLI inicia em outra porta e mantém o serviço existente', { timeout: 15000 }, async t => {
  const existing = http.createServer((req, res) => res.end('serviço existente'));
  const occupied = await listenAvailable(existing, 0, '0.0.0.0');
  t.after(() => new Promise(resolve => existing.close(resolve)));
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, PORT: String(occupied) }, windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => { if (child.exitCode === null && !child.killed) { const exited = once(child, 'exit'); child.kill(); await exited; } });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  const url = await new Promise((resolve, reject) => {
    let output = '';
    child.on('error', reject);
    child.on('exit', code => reject(new Error(`Servidor encerrou com código ${code}: ${stderr}`)));
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/servidor escutando em 0\.0\.0\.0:(\d+)/);
      if (match) resolve(new URL(`http://localhost:${match[1]}/nova-proposta`));
    });
  });
  assert.notEqual(Number(url.port), occupied);
  assert.equal((await fetch(url)).status, 200);
  assert.equal((await (await fetch(new URL('/api/products', url))).json()).length, 3);
  assert.equal(await (await fetch(`http://127.0.0.1:${occupied}`)).text(), 'serviço existente');
  assert.equal(stderr, '');
});

test('configuração de porta inválida é rejeitada com mensagem clara', async () => {
  const server = http.createServer();
  for (const port of [NaN, -1, 65536, 3000.5]) {
    await assert.rejects(listenAvailable(server, port), /PORT deve ser um número inteiro/);
    assert.equal(server.listening, false);
  }
});

test('servidor pode escutar em todas as interfaces para produção', async t => {
  const server = http.createServer();
  const port = await listenAvailable(server, 0, '0.0.0.0');
  t.after(() => new Promise(resolve => server.close(resolve)));
  assert.equal(server.address().address, '0.0.0.0');
  assert.ok(port > 0);
});
