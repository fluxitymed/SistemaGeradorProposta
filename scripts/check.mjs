import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
async function check(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) { if (entry.name !== 'assets') await check(path); }
    else if (/\.m?js$/.test(entry.name)) {
      const result = spawnSync(process.execPath, ['--check', path], { stdio: 'inherit' });
      if (result.error) throw result.error;
      if (result.status) process.exit(result.status);
    }
  }
}
for (const dir of ['src', 'public', 'tests', 'scripts']) await check(dir);
console.log('Sintaxe de todos os arquivos JavaScript validada.');
