# Gerador de propostas Fluxity

Aplicação local para selecionar um produto, informar cliente, valor e condição de pagamento, conferir a proposta e baixar um PDF A4 com texto selecionável.

## Executar

Requisitos: Node.js 22 ou superior e Google Chrome ou Microsoft Edge instalado.

```powershell
npm ci
npm start
```

Acesse o endereço exibido no terminal, normalmente **http://localhost:3000/nova-proposta**. Se a porta estiver ocupada, `npm start` tenta automaticamente as próximas portas e informa o endereço usado. Nenhum processo existente é encerrado. Para desenvolvimento com reinício automático: `npm run dev`.

Se estiver usando a porta 3001, pare o processo anterior com **Ctrl+C**, execute os comandos abaixo e acesse **http://localhost:3001/nova-proposta**:

```powershell
$env:PORT = "3001"
npm start
```

Após cadastrar ou alterar um template, reinicie o servidor e atualize a página.

O gerador tenta Chrome, Edge e, por último, o Chromium do Playwright. Caso não tenha um navegador instalado:

```powershell
npx playwright install chromium
```

Também é possível definir `PDF_BROWSER_PATH` com o caminho de um executável Chromium. `PORT` altera a porta. O servidor escuta somente em `127.0.0.1`; esta versão é de uso local, sem autenticação, banco de dados ou armazenamento de propostas. Os dados e o PDF ficam em memória durante a geração e no navegador até editar/recarregar a tela. A aplicação funciona sem internet depois de instalar as dependências e o navegador.

## Estrutura e decisões

A pasta estava vazia quando analisada: nenhum `AGENTS.md`, documentação, repositório Git, componente, banco, autenticação ou stack existente foi encontrado nela ou nos arquivos de instruções dos diretórios ancestrais. Por isso foi criada uma aplicação pequena em JavaScript com módulos ES, HTTP nativo do Node e Playwright, sem etapa de build.

```text
src/
  config/fluxity.js          Identificação institucional única da Fluxity
  server.js                 HTTP, arquivos públicos e validação da API
  pdf.js                    Chromium, geração de PDF e controle de concorrência
  document.js               HTML, escape, nome seguro e paginação medida
  document.css              Layout A4 de impressão e pré-visualização
  templates/
    google-ads.js           Conteúdo comercial original de Google Ads
    gestao-aquisicao-comercial.js  Aquisição e Gestão Comercial, com serviços agrupados
    index.js                Registro de produtos
public/
  index.html                Tela Nova proposta
  app.css                   Interface responsiva, foco e estados visuais
  app.js                    Formulário, prévia, ampliação e download
  validation.js             Validações compartilhadas entre cliente e servidor
  assets/                   Logo, rodapé e fontes locais com licença
tests/proposals.test.js     Testes de validação, segurança e API
tests/acquisition.test.js   Segundo produto e regressão da configuração de Google Ads
tests/fixtures/google-ads.json  Configuração anterior para comparação de regressão
scripts/check.mjs           Verificação de sintaxe de todos os módulos
scripts/verify.mjs          Fluxo real no navegador e PDFs de validação
scripts/verify-acquisition.mjs  Fluxo do segundo produto e alternância entre templates
scripts/inspect-pdfs.py     Renderização e inspeção do texto dos PDFs
artifacts/validation/       PDFs, imagens e resultados dos testes (ignorado pelo Git)
```

O HTML é paginado no Chromium depois de carregar as fontes. Cada página tem cabeçalho, rodapé e área útil delimitada. Seções são mantidas juntas quando couberem; textos extensos são distribuídos entre páginas sem cortar caracteres. O título acompanha o conteúdo. O PDF é produzido por [`page.pdf()` do Playwright](https://playwright.dev/docs/api/class-page#page-pdf), com CSS A4, impressão das cores e texto real. As imagens são apenas os elementos da marca, nunca páginas inteiras.

`POST /api/proposals` valida os dados e devolve o HTML paginado e o PDF da mesma geração. A prévia mostra esse HTML; “Baixar PDF” baixa exatamente os bytes já gerados. Editar qualquer campo invalida a prévia e o download anteriores e cancela a espera por respostas obsoletas. A prévia tem um botão **Ampliar / Ajustar**, inclusive no mobile.

Validações: produto cadastrado, nome de até 300 caracteres, valor positivo de até R$ 999.999.999,99 e pagamento livre de até 4.000 caracteres. Valores são tratados em centavos inteiros. A formatação BRL é aplicada ao sair do campo; não são aceitos formatos numéricos ambíguos. O servidor repete a validação, limita o corpo JSON e permite até duas gerações simultâneas. Textos inseridos são escapados, a prévia não executa scripts e o contexto de renderização funciona offline.

## Fonte do template e pendências

Referência localizada em:

`C:\Users\Fernando\Desktop\Carlos\fx\Google Ads\Daniela\Proposta Google Ads - Dra. Daniela.pdf`

O DOCX de mesmo nome e diretório forneceu as imagens originais do logo e do rodapé. A fonte Poppins e sua licença foram obtidas do [repositório oficial Google Fonts](https://github.com/google/fonts/tree/main/ofl/poppins). O corpo usa Arial, como no PDF original. As cores, hierarquia e organização visual seguem a referência; “Início de serviço” foi levado com seu parágrafo à segunda página, eliminando o título isolado do original.

Foram aplicadas somente as correções editoriais solicitadas:

- `Google ADS` → `Google Ads`.
- `Planilha para o cliente para o cliente` → `Planilha para o cliente`.
- `Não se responsabiliza resultados` → `Não se responsabiliza por resultados`.

As pendências estão marcadas junto dos textos e em `reviewNotes`, em `src/templates/google-ads.js`:

- A frase **“Definição de estratégias, objetivos e palavras-chaves junto ao cliente para”** está incompleta e foi preservada, sem continuação inventada.
- O significado de **“30 dias”**, em “Início de serviço”, está ambíguo e foi preservado.

Os dados do representante, o limite de R$ 7.000,00, os 15% sobre o excedente, as observações e a regra de congelamento são os do original. As pendências editoriais não acrescentam textos à proposta destinada ao cliente.

## Adicionar outro produto

1. Crie `src/templates/novo-produto.js` exportando um objeto com a mesma estrutura de `google-ads.js`.
2. Use `id` exclusivo e preencha nome, `filenameLabel`, referência, categoria, serviços, limites, início, investimento, observações, rótulos e opções visuais. Importe `fluxity` de `src/config/fluxity.js` e use `company: fluxity`. A regra `latePaymentRule` é opcional; só a inclua quando fizer parte das condições fixas do produto.
3. Mantenha `variableFields: ['clientName', 'price', 'paymentTerms']` para este formulário. Os únicos dados comerciais variáveis desta versão são esses três.
4. Importe o objeto em `src/templates/index.js` e adicione-o ao array que constrói o `Map`.
5. Reinicie o servidor e execute os testes com uma proposta do novo produto.

O produto aparece automaticamente no seletor. O gerador e o formulário são reutilizados. Use `includedServices` para uma lista simples ou `serviceGroups: [{ title, items }]` para grupos com subtítulos. Cada grupo mantém seu título e lista juntos, aproveitando o espaço restante da página. `visual.breakBefore` permite indicar seções que devem iniciar em nova página. `visual.keepWithNext` mantém uma seção com a seguinte quando o conjunto couber em uma página, sem impor essa união a textos maiores. Novos campos de formulário ou tipos de conteúdo diferentes desta estrutura exigirão extensão explícita do modelo.

## Segundo produto: Gestão de Aquisição e Gestão Comercial

Cadastrado como `gestao-aquisicao-comercial`, em `src/templates/gestao-aquisicao-comercial.js`, e registrado no mesmo catálogo de Google Ads (`src/templates/index.js`). Não foi necessário alterar o formulário, a API, as validações ou o download.

Referência visual: `C:\Users\Fernando\Desktop\Carlos\fx\Leonardo Carvalho\Proposta Dr. Leonardo Carvalho.pdf`. Os textos fixos seguem a versão completa fornecida pelo usuário, com Google Ads, Meta Ads, Atendimento Comercial dos Leads e Landing Page. Os dados institucionais vêm da configuração única; o telefone diferente do PDF de Leonardo não foi incorporado.

Somente nome, valor e condição de pagamento variam. Vencimento, forma de pagamento e duração contratual não são fixos, nem aparecem nas observações. Cada linha digitada no pagamento é preservada. A cláusula de congelamento e o percentual de excedente de Google Ads não pertencem ao novo template.

O documento organiza identificação/serviços, limites/início e investimento/pagamento usando o layout A4 existente. Grupos de serviços são indivisíveis; investimento e pagamento ficam juntos quando cabem na mesma página. O conteúdo se redistribui conforme o tamanho do nome e do pagamento. Não há quebras de página fixas no segundo template.

Para testar, selecione **Gestão de Aquisição e Gestão Comercial**, informe **Dr. Leonardo Carvalho - Clínica Carvalho**, **R$ 2.000,00** e:

```text
Pagamento à vista na contratação.
Mensalidade com vencimento no dia 21.
Contrato válido por 3 meses.
```

PDF de validação: `artifacts/validation/Proposta-Gestao-Aquisicao-Comercial-Dr-Leonardo-Carvalho-Clinica-Carvalho.pdf`. Também é gerado `Proposta-Gestao-Aquisicao-Comercial-Nome-Longo.pdf`, com nome de 300 caracteres e pagamento de 35 linhas. As páginas renderizadas ficam em subpastas com o nome de cada PDF. Capturas da interface: `acquisition-desktop.png` e `acquisition-mobile.png`.

Nenhuma nova pendência comercial foi identificada. As duas pendências editoriais do template anterior continuam preservadas exclusivamente em Google Ads.

Validação desta entrega: `npm run check`, os 10 testes de `npm test` e o fluxo completo de `npm run test:e2e` passaram. Os dois PDFs do novo produto têm três páginas cada; todas as seis páginas foram renderizadas e examinadas visualmente, sem cortes, sobreposições ou textos ilegíveis. A proposta padrão de Google Ads permaneceu com duas páginas, texto idêntico e pixels idênticos ao PDF anterior. Os resultados detalhados estão em `artifacts/validation/results.json` e `artifacts/validation/pdf-inspection.json`.

## Verificações

```powershell
npm run check
npm test
npm run test:e2e
```

O teste E2E inicia e encerra seu próprio servidor em uma porta livre e utiliza um navegador invisível. Ele gera os PDFs reais e imagens desktop/mobile em `artifacts/validation/`. Não havia testes anteriores na pasta.

A suíte cobre os dois produtos e sua alternância. O fixture de Google Ads confirma que sua configuração anterior foi preservada integralmente, inclusive após centralizar a identificação da empresa. Quando `artifacts/baseline/google-ads.pdf` está disponível, a inspeção Python compara texto e pixels do PDF de Google Ads anterior com o atual.

Para renderizar todas as páginas e verificar A4, texto selecionável, limites e fidelidade textual ao original:

```powershell
python -m pip install --target .tools/pymupdf pymupdf
python scripts/inspect-pdfs.py "C:\Users\Fernando\Desktop\Carlos\fx\Google Ads\Daniela\Proposta Google Ads - Dra. Daniela.pdf"
```

PyMuPDF só é necessário para essa inspeção, não para executar a aplicação. No ambiente de desenvolvimento, as restrições do sandbox exigiram executar navegador/testes de subprocessos e PyMuPDF com permissão ampliada.

PDF principal de validação: **`artifacts/validation/Proposta-Google-Ads-Dra-Daniela.pdf`**. Os relatórios automáticos ficam em `results.json` e `pdf-inspection.json` nessa pasta. O teste principal usa Dra. Daniela, R$ 1.000,00 e “Pagamento antecipado, no momento de início dos serviços.”.

Não foram implementados contratos, ordens de serviço, assinaturas, envio de mensagens, CRM ou histórico de propostas.
