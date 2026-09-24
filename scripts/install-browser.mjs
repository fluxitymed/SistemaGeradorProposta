import { execFileSync } from 'node:child_process';

// Playwright não inclui o binário do navegador no pacote npm. Instalá-lo no
// ciclo de dependências torna o deploy autossuficiente, inclusive no Render.
// O caminho "0" mantém o binário dentro de node_modules, que é preservado do
// build para a execução do serviço em vez de depender do cache do usuário.
process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
const args = process.platform === 'linux'
  ? ['playwright', 'install', '--with-deps', 'chromium']
  : ['playwright', 'install', 'chromium'];

if (process.platform === 'win32') {
  execFileSync('cmd.exe', ['/d', '/s', '/c', `npx ${args.join(' ')}`], { stdio: 'inherit' });
} else {
  execFileSync('npx', args, { stdio: 'inherit' });
}
