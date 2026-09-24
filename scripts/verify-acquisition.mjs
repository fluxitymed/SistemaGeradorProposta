import assert from 'node:assert/strict';
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gestaoAquisicaoComercial as template } from '../src/templates/gestao-aquisicao-comercial.js';

export async function verifyAcquisition({ page, artifacts, record }) {
  const frame = page.frameLocator('#proposal-preview');
  const terms = 'Pagamento à vista na contratação.\nMensalidade com vencimento no dia 21.\nContrato válido por 3 meses.';
  const client = 'Dr. Leonardo Carvalho - Clínica Carvalho';
  await page.unroute('**/api/proposals');
  await page.setViewportSize({ width: 1440, height: 1100 });
  assert.deepEqual(await page.locator('#productId option').evaluateAll(options => options.filter(el => el.value).map(el => el.textContent)), ['Gestão de Google Ads', template.name, 'Gestão de Meta Ads']);
  await page.locator('#productId').selectOption(template.id);
  assert.equal(await page.locator('#download-button').isDisabled(), true);
  await page.locator('#clientName').fill(client);
  await page.locator('#price').fill('2000');
  await page.locator('#paymentTerms').fill(terms);
  async function generate() {
    const pending = page.waitForResponse(response => response.url().endsWith('/api/proposals'));
    await page.getByRole('button', { name: 'Visualizar proposta' }).click();
    const response = await pending;
    const data = await response.json();
    assert.equal(response.status(), 200, data.message);
    await page.waitForFunction(() => !document.querySelector('#download-button').disabled);
    // srcdoc pode terminar de carregar depois de o download ficar disponível.
    await frame.locator('.client-name').waitFor();
    return data;
  }
  async function checkLayout() {
    const errors = await frame.locator('.sheet').evaluateAll(sheets => sheets.flatMap((sheet, i) => {
      const content = sheet.querySelector('.content');
      const bounds = content.getBoundingClientRect();
      const footer = sheet.querySelector('footer').getBoundingClientRect();
      const issues = [];
      if (content.scrollHeight > content.clientHeight || content.scrollWidth > content.clientWidth + 1) issues.push(`Overflow na página ${i + 1}`);
      for (const node of content.querySelectorAll('h2, h3, li, p, table')) {
        const box = node.getBoundingClientRect();
        if (box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.bottom > bounds.bottom + 1 || box.bottom >= footer.top) issues.push(`Bloco fora das margens: ${node.textContent}`);
        if (/H[23]/.test(node.tagName) && !node.nextElementSibling) issues.push(`Título isolado: ${node.textContent}`);
      }
      return issues;
    }));
    assert.deepEqual(errors, []);
  }
  const standard = await generate();
  await checkLayout();
  assert.equal(await frame.locator('.client-name').textContent(), client);
  assert.equal(await frame.locator('.reference').textContent(), `REFERÊNCIA: ${template.reference}`);
  assert.equal((await frame.locator('.price').textContent()).replace(/\s/g, ' '), 'R$ 2.000,00');
  assert.equal(await frame.locator('.payment-terms').textContent(), terms);
  assert.equal(await frame.locator('.payment-terms').evaluate(el => getComputedStyle(el).whiteSpace), 'pre-wrap');
  assert.equal(await frame.locator('[data-key="investment"]').evaluate(el => el.closest('.sheet').contains(document.querySelector('.payment-terms'))), true);
  assert.deepEqual(await frame.locator('.service-group h3').allTextContents(), template.serviceGroups.map(group => group.title));
  const content = await frame.locator('#pages').textContent();
  for (const text of [...template.serviceGroups.flatMap(group => group.items), ...template.supplyLimits, template.serviceStart, ...template.observations]) assert.ok(content.includes(text), `Texto ausente: ${text}`);
  assert.ok(!content.includes('21 de setembro'));
  assert.ok(!content.includes('(71) 8215 0425'));
  assert.ok(content.includes('(71) 99739 8412'));
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar PDF' }).click();
  const download = await downloadEvent;
  const filename = 'Proposta-Gestao-Aquisicao-Comercial-Dr-Leonardo-Carvalho-Clinica-Carvalho.pdf';
  assert.equal(download.suggestedFilename(), filename);
  const file = new URL(filename, artifacts);
  await download.saveAs(fileURLToPath(file));
  assert.deepEqual(await readFile(file), Buffer.from(standard.pdf, 'base64'));
  await writeFile(new URL('acquisition-preview.html', artifacts), standard.html);
  await page.screenshot({ path: fileURLToPath(new URL('acquisition-desktop.png', artifacts)), fullPage: true });
  record('Aquisição e Gestão Comercial: conteúdo completo, identificação única, três linhas de pagamento e download real conferidos.');

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: fileURLToPath(new URL('acquisition-mobile.png', artifacts)), fullPage: true });
  record('Segundo produto conferido em desktop e mobile de 390 px.');

  const longClient = 'Dr. Leonardo Carvalho — Clínica Integrada de Especialidades Médicas e Atendimento Multidisciplinar '.repeat(4).slice(0, 300);
  const multiline = Array.from({ length: 35 }, (_, i) => `Parcela ${i + 1}: pagamento conforme condição acordada com o cliente.`).join('\n');
  await page.locator('#clientName').fill(longClient);
  await page.locator('#paymentTerms').fill(multiline);
  const long = await generate();
  await checkLayout();
  assert.equal(await frame.locator('.client-name').textContent(), longClient);
  assert.equal((await frame.locator('.payment-terms').allTextContents()).join(''), multiline);
  assert.deepEqual(await frame.locator('.service-group h3').allTextContents(), template.serviceGroups.map(group => group.title));
  await writeFile(new URL('Proposta-Gestao-Aquisicao-Comercial-Nome-Longo.pdf', artifacts), Buffer.from(long.pdf, 'base64'));
  await writeFile(new URL('acquisition-long-preview.html', artifacts), long.html);
  await writeFile(new URL('acquisition-expected.json', artifacts), JSON.stringify({ template, client, terms, longClient, multiline }, null, 2));
  record('Segundo produto: nome de 300 caracteres e pagamento com 35 linhas preservados sem cortes.');

  await page.locator('#productId').selectOption('google-ads');
  assert.equal(await page.locator('#download-button').isDisabled(), true);
  await page.locator('#clientName').fill('Dra. Daniela');
  await page.locator('#price').fill('1000');
  await page.locator('#paymentTerms').fill('Pagamento antecipado, no momento de início dos serviços.');
  await generate();
  assert.equal(await frame.locator('.service-group').count(), 0);
  assert.ok((await frame.locator('.reference').textContent()).includes('Gerenciamento do Google Ads'));
  assert.ok((await frame.locator('#pages').textContent()).includes('15% sobre o valor excedente.'));
  await page.locator('#productId').selectOption(template.id);
  assert.equal(await page.locator('#download-button').isDisabled(), true);
  assert.equal(await page.locator('#empty-preview').isVisible(), true);
  record('Alternância entre os dois produtos invalida a prévia anterior; Google Ads continua correto após a troca.');
  return { standardPages: standard.pageCount, longPages: long.pageCount };
}
