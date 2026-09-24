import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
import { templates, productOptions } from './templates/index.js';
import { validateProposal } from '../public/validation.js';
import { createPdfGenerator } from './pdf.js';
import { listenAvailable } from './startup.js';

const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf' };
const csp = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-src 'self' about:; base-uri 'none'; form-action 'self'; frame-ancestors 'self'";
const loopbackHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

// O navegador pode abrir a interface em localhost e enviar a API para
// 127.0.0.1 (ou o inverso). Ambos representam o mesmo servidor local.
// Origens externas continuam bloqueadas.
export function isAllowedLocalOrigin(origin) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return url.protocol === 'http:' && loopbackHosts.has(url.hostname.toLowerCase()) && !url.username && !url.password;
  } catch { return false; }
}

export function createApp({ generator = createPdfGenerator() } = {}) {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/products') return json(200, productOptions());
      if (req.method === 'POST' && url.pathname === '/api/proposals') {
        if (!isAllowedLocalOrigin(req.headers.origin) || (!req.headers.origin && req.headers['sec-fetch-site'] === 'cross-site')) return json(403, { message: 'Origem da solicitação não permitida.' });
        if (!req.headers['content-type']?.startsWith('application/json')) return json(415, { message: 'Envie os dados em JSON.' });
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 32768) { json(413, { message: 'Os dados enviados são muito extensos.' }); req.resume(); return; }
          chunks.push(chunk);
        }
        let input;
        try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return json(400, { message: 'Os dados enviados são inválidos.' }); }
        const validation = validateProposal(input, productOptions());
        if (!validation.valid) return json(422, { message: 'Revise os campos indicados.', errors: validation.errors });
        try {
          const result = await generator.generate(templates.get(validation.data.productId), validation.data);
          return json(200, { ...result, pdf: result.pdf.toString('base64') });
        } catch (error) {
          console.error('Falha no gerador de PDF:', error.message);
          return json(error.status || 500, { message: error.status === 429 ? error.message : 'Não foi possível gerar o PDF. Tente novamente. Se o erro continuar, verifique se o navegador está instalado no servidor.' });
        }
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(405, { message: 'Método não permitido.' });
      const path = resolve(publicRoot, '.' + decodeURIComponent(url.pathname === '/' || url.pathname === '/nova-proposta' ? '/index.html' : url.pathname));
      if (!path.startsWith(publicRoot.endsWith(sep) ? publicRoot : publicRoot + sep) || !mime[extname(path)]) return json(404, { message: 'Página não encontrada.' });
      try {
        const file = await readFile(path);
        res.writeHead(200, { 'Content-Type': `${mime[extname(path)]}; charset=utf-8` });
        res.end(req.method === 'HEAD' ? undefined : file);
      } catch { json(404, { message: 'Página não encontrada.' }); }
    } catch { if (!res.headersSent) json(400, { message: 'Não foi possível processar a solicitação.' }); }
  });
  server.requestTimeout = 60000;
  return { server, close: async () => { await new Promise(resolve => server.close(resolve)); await generator.close(); } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = createApp();
  try {
    const preferredPort = Number(process.env.PORT) || 10000;
    const port = await listenAvailable(app.server, preferredPort, '0.0.0.0');
    if (port !== preferredPort) console.log(`A porta ${preferredPort} está ocupada. O sistema foi iniciado na porta ${port}.`);
    console.log(`Fluxity — servidor escutando em 0.0.0.0:${port}.`);
    console.log(`Acesse localmente: http://localhost:${port}/nova-proposta`);
    console.log('Para encerrar o sistema neste terminal, pressione Ctrl+C.');
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await app.close(); process.exit(0); });
  } catch (error) {
    console.error(`Não foi possível iniciar o sistema: ${error.message}`);
    process.exitCode = 1;
  }
}
