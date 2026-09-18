import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { googleAds } from '../src/templates/google-ads.js';
import { gestaoAquisicaoComercial as template } from '../src/templates/gestao-aquisicao-comercial.js';
import { fluxity } from '../src/config/fluxity.js';
import { productOptions } from '../src/templates/index.js';
import { renderDocument, safeFilename } from '../src/document.js';
import { validateProposal } from '../public/validation.js';

test('Google Ads conserva integralmente a configuração anterior', async () => {
  const previous = JSON.parse(await readFile(new URL('./fixtures/google-ads.json', import.meta.url), 'utf8'));
  assert.deepEqual(googleAds, previous);
  assert.equal(googleAds.company, fluxity);
  assert.equal(template.company, fluxity);
});
test('catálogo possui os dois produtos com os mesmos campos variáveis', () => {
  assert.deepEqual(productOptions().map(item => item.id), ['google-ads', 'gestao-aquisicao-comercial']);
  assert.deepEqual(template.variableFields, googleAds.variableFields);
  assert.deepEqual(template.serviceGroups.map(group => group.items.length), [5, 6, 7, 2]);
  assert.equal(template.supplyLimits.length, 10);
  for (const text of [...template.serviceGroups.flatMap(group => group.items), ...template.supplyLimits]) assert.match(text, /[.;]$/);
});
test('novo template não herda condições particulares nem cláusulas do Google Ads', async () => {
  const input = { productId: template.id, clientName: 'Cliente de teste', price: '2.000,00', paymentTerms: 'Condição livre.\nOutra linha.' };
  const result = validateProposal(input, productOptions());
  assert.ok(result.valid);
  const html = await renderDocument(template, result.data);
  for (const forbidden of ['Leonardo', '21 de setembro', '3 meses', 'vista na contratação', '15% sobre', 'congelamento', 'undefined']) assert.ok(!html.includes(forbidden), forbidden);
  assert.ok(html.includes('Condição livre.\nOutra linha.'));
  assert.ok(html.includes('R$&nbsp;') || html.includes('R$\u00a02.000,00'));
  assert.equal(safeFilename(template, 'Dr. Leonardo Carvalho - Clínica Carvalho'), 'Proposta-Gestao-Aquisicao-Comercial-Dr-Leonardo-Carvalho-Clinica-Carvalho.pdf');
});
test('novo template escapa nome e pagamento com várias linhas', async () => {
  const html = await renderDocument(template, { clientName: '<script>alert(1)</script>', priceCents: 200000, paymentTerms: 'Linha 1\n<img src=x onerror=alert(1)>' });
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('Linha 1\n&lt;img src=x onerror=alert(1)&gt;'));
});
