import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { metaAds as template } from '../src/templates/meta-ads.js';

export async function verifyMetaAds({ page, artifacts, record }) {
  const frame = page.frameLocator('#proposal-preview');
  const client = 'Clínica Fluxity Saúde';
  const terms = 'Pagamento antecipado no início dos serviços.\nMensalidades seguintes com vencimento a cada 30 dias.';
  await page.unroute('**/api/proposals');
  await page.setViewportSize({ width: 1440, height: 1100 });
  assert.deepEqual(await page.locator('#productId option').evaluateAll(options => options.filter(el => el.value).map(el => el.textContent)), ['Gestão de Google Ads', 'Gestão de Aquisição e Gestão Comercial', template.name]);
  await page.locator('#productId').selectOption(template.id);
  assert.equal(await page.locator('#download-button').isDisabled(), true);
  await page.locator('#clientName').fill(client);
  await page.locator('#price').fill('1500');
  await page.locator('#paymentTerms').fill(terms);
  const generate = async () => {
    const pending = page.waitForResponse(response => response.url().endsWith('/api/proposals'));
    await page.getByRole('button', { name: 'Visualizar proposta' }).click();
    const response = await pending;
    const data = await response.json();
    assert.equal(response.status(), 200, data.message);
    await page.waitForFunction(() => !document.querySelector('#download-button').disabled);
    await frame.locator('.client-name').waitFor();
    return data;
  };
  const checkLayout = async () => {
    const issues = await frame.locator('.sheet').evaluateAll(sheets => sheets.flatMap((sheet, index) => {
      const content = sheet.querySelector('.content');
      const footer = sheet.querySelector('footer').getBoundingClientRect();
      const bounds = content.getBoundingClientRect();
      return [...content.querySelectorAll('h2, h3, li, p, table')].flatMap(node => {
        const box = node.getBoundingClientRect();
        return content.scrollHeight > content.clientHeight || content.scrollWidth > content.clientWidth + 1 || box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.bottom > bounds.bottom + 1 || box.bottom >= footer.top || (/H[23]/.test(node.tagName) && !node.nextElementSibling) ? [`Layout inválido na página ${index + 1}: ${node.textContent}`] : [];
      });
    }));
    assert.deepEqual(issues, []);
  };
  const standard = await generate();
  await checkLayout();
  assert.equal(await frame.locator('.client-name').textContent(), client);
  assert.equal(await frame.locator('.reference').textContent(), 'REFERÊNCIA: Gerenciamento do Meta Ads');
  assert.equal((await frame.locator('.price').textContent()).replace(/\s/g, ' '), 'R$ 1.500,00');
  assert.equal(await frame.locator('.payment-terms').textContent(), terms);
  assert.equal(await frame.locator('.payment-terms').evaluate(el => getComputedStyle(el).whiteSpace), 'pre-wrap');
  assert.deepEqual(await frame.locator('.service-group h3').allTextContents(), ['Meta Ads']);
  const content = await frame.locator('#pages').textContent();
  for (const text of [...template.serviceGroups.flatMap(group => group.items), ...template.supplyLimits, template.serviceStart, ...template.observations]) assert.ok(content.includes(text), `Texto ausente: ${text}`);
  for (const forbidden of ['palavras-chave', 'Facebook Ads', 'Meta ADS', 'produção de vídeos', 'sessões de fotos', 'gestão de redes sociais', 'atendimento dos leads', '15% sobre', 'congelamento']) assert.ok(!content.includes(forbidden), forbidden);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar PDF' }).click();
  const download = await downloadEvent;
  const filename = 'Proposta-Meta-Ads-Clinica-Fluxity-Saude.pdf';
  assert.equal(download.suggestedFilename(), filename);
  const file = new URL(filename, artifacts);
  await download.saveAs(fileURLToPath(file));
  assert.deepEqual(await readFile(file), Buffer.from(standard.pdf, 'base64'));
  await writeFile(new URL('meta-ads-preview.html', artifacts), standard.html);
  await page.screenshot({ path: fileURLToPath(new URL('meta-ads-desktop.png', artifacts)), fullPage: true });
  record('Meta Ads: conteúdo, pagamento em múltiplas linhas e download real conferidos.');

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: fileURLToPath(new URL('meta-ads-mobile.png', artifacts)), fullPage: true });
  const longClient = 'Clínica Fluxity Saúde — Centro Integrado de Especialidades, Bem-Estar e Atendimento Multidisciplinar '.repeat(4).slice(0, 300);
  const multiline = Array.from({ length: 35 }, (_, i) => `Condição ${i + 1}: pagamento conforme acordo comercial entre as partes.`).join('\n');
  await page.locator('#clientName').fill(longClient);
  await page.locator('#paymentTerms').fill(multiline);
  const long = await generate();
  await checkLayout();
  assert.equal(await frame.locator('.client-name').textContent(), longClient);
  assert.equal((await frame.locator('.payment-terms').allTextContents()).join(''), multiline);
  await writeFile(new URL('Proposta-Meta-Ads-Nome-Longo.pdf', artifacts), Buffer.from(long.pdf, 'base64'));
  await writeFile(new URL('meta-ads-expected.json', artifacts), JSON.stringify({ template, client, terms, longClient, multiline }, null, 2));
  record('Meta Ads em desktop e mobile: nome extenso e 35 linhas de pagamento sem cortes.');
  return { standardPages: standard.pageCount, longPages: long.pageCount };
}
