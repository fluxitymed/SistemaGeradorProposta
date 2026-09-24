import { execFileSync } from 'node:child_process';

// Playwright não inclui o binário do navegador no pacote npm. Instalá-lo no
// ciclo de dependências torna o deploy autossuficiente, inclusive no Render.
const args = process.platform === 'linux'
  ? ['playwright', 'install', '--with-deps', 'chromium']
  : ['playwright', 'install', 'chromium'];

if (process.platform === 'win32') {
  execFileSync('cmd.exe', ['/d', '/s', '/c', `npx ${args.join(' ')}`], { stdio: 'inherit' });
} else {
  execFileSync('npx', args, { stdio: 'inherit' });
}
