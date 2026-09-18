import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProposal, parsePrice, formatPrice } from '../public/validation.js';
import { safeFilename, renderDocument } from '../src/document.js';
import { googleAds } from '../src/templates/google-ads.js';
import { productOptions } from '../src/templates/index.js';
import { createApp } from '../src/server.js';

const input = { productId: 'google-ads', clientName: 'Dra. Daniela', price: 'R$ 1.000,00', paymentTerms: 'Pagamento antecipado, no momento de início dos serviços.' };
test('converte BRL em centavos sem aceitar formatos ambíguos', () => {
  for (const value of ['R$ 1.000,00', '1.000,00', '1000', '1000,0']) assert.equal(parsePrice(value), 100000);
  for (const value of ['', '-1', '1.00', '1,234', '1e3', 'Infinity', null, 100, 'abc']) assert.equal(parsePrice(value), null);
  assert.equal(formatPrice(100000).replace(/\s/g, ' '), 'R$ 1.000,00');
});
test('campos obrigatórios e valor positivo', () => {
  assert.equal(validateProposal(input, productOptions()).valid, true);
  assert.equal(Object.keys(validateProposal({}, productOptions()).errors).length, 4);
  for (const price of ['0', '-1', '1000000000', 'NaN']) assert.ok(validateProposal({ ...input, price }, productOptions()).errors.price);
  assert.ok(validateProposal({ ...input, productId: '__proto__' }, productOptions()).errors.productId);
});
test('limites explícitos e textos em branco', () => {
  assert.ok(validateProposal({ ...input, clientName: ' ' }, productOptions()).errors.clientName);
  assert.ok(validateProposal({ ...input, paymentTerms: '\n ' }, productOptions()).errors.paymentTerms);
  assert.ok(validateProposal({ ...input, clientName: 'x'.repeat(301) }, productOptions()).errors.clientName);
  assert.ok(validateProposal({ ...input, paymentTerms: 'x'.repeat(4001) }, productOptions()).errors.paymentTerms);
  assert.equal(validateProposal({ ...input, clientName: 'x'.repeat(300), paymentTerms: 'x'.repeat(4000) }, productOptions()).valid, true);
});
test('nome do arquivo seguro, previsível e limitado', () => {
  assert.equal(safeFilename(googleAds, input.clientName), 'Proposta-Google-Ads-Dra-Daniela.pdf');
  assert.match(safeFilename(googleAds, '../../João "<teste>\r\n'), /^Proposta-Google-Ads-Joao-teste.pdf$/);
  assert.equal(safeFilename(googleAds, '中文'), 'Proposta-Google-Ads-Cliente.pdf');
  assert.ok(safeFilename(googleAds, 'a'.repeat(300)).length < 150);
});
test('template escapa HTML e preserva as cláusulas comerciais', async () => {
  const html = await renderDocument(googleAds, { clientName: '<script>alert(1)</script>', priceCents: 100000, paymentTerms: '<img src=x onerror=alert(1)>' });
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(html.includes('R$ 7.000,00'));
  assert.ok(html.includes('15% sobre o valor excedente'));
  assert.ok(html.includes('30 dias, após a configuração inicial'));
  assert.ok(html.includes('Não se responsabiliza por resultados'));
  assert.ok(!html.includes('cliente para o cliente'));
  assert.ok(!html.includes('Google ADS'));
});
test('API valida antes de gerar, trata falhas e bloqueia acessos indevidos', async t => {
  let called = 0;
  const app = createApp({ generator: { generate: async () => { called++; throw new Error('falha simulada'); }, close: async () => {} } });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const post = (body, headers = {}) => fetch(base + '/api/proposals', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body });
  assert.equal((await post('{}')).status, 422);
  assert.equal((await post('no json')).status, 400);
  assert.equal((await post('null')).status, 422);
  assert.equal((await post(JSON.stringify(input), { Origin: 'https://example.com' })).status, 403);
  assert.equal((await post(JSON.stringify(input), { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await post(JSON.stringify({ ...input, paymentTerms: 'a'.repeat(40000) }))).status, 413);
  assert.equal(called, 0);
  const failed = await post(JSON.stringify(input));
  assert.equal(failed.status, 500);
  assert.match((await failed.json()).message, /Não foi possível gerar o PDF/);
  assert.equal(called, 1);
  assert.equal((await fetch(base + '/src/templates/google-ads.js')).status, 404);
  assert.equal((await fetch(base + '/%2e%2e%2fpackage.json')).status, 404);
});
