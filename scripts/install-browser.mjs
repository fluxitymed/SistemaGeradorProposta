import { execFileSync } from 'node:child_process';

// Playwright não inclui o binário do navegador no pacote npm. Instalá-lo no
// ciclo de dependências torna o deploy autossuficiente, inclusive no Render.
// O caminho "0" mantém o binário dentro de node_modules, que é preservado do
// build para a execução do serviço em vez de depender do cache do usuário.
process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
// Não use --with-deps aqui: provedores de PaaS executam o build sem privilégios
// para alterar pacotes do sistema. O Chromium é a única dependência que precisa
// ser provisionada pelo projeto e fica no diretório local definido acima.
const args = ['playwright', 'install', 'chromium'];

if (process.platform === 'win32') {
  execFileSync('cmd.exe', ['/d', '/s', '/c', `npx ${args.join(' ')}`], { stdio: 'inherit' });
} else {
  execFileSync('npx', args, { stdio: 'inherit' });
}
