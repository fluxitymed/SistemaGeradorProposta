import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { templates } from '../src/templates/index.js';
import { createPdfGenerator } from '../src/pdf.js';
import { chromium } from 'playwright';

const generator = createPdfGenerator();
const dir = 'artifacts/validation';
await mkdir(dir, { recursive: true });
const paymentTerms = 'Pagamento antecipado no início dos serviços.\nMensalidades seguintes com vencimento a cada 30 dias.\nContrato inicial de 3 meses.';
try {
  for (const template of templates.values()) {
    const isCrm = template.id === 'trafego-pago-atendimento-crm-gestao-comercial';
    const terms = isCrm ? 'Pagamento antecipado no início dos serviços. Contrato inicial de 3 meses.' : paymentTerms;
    const result = await generator.generate(template, { clientName: 'Clínica Fluxity Saúde', priceCents: isCrm ? 550000 : 450000, paymentTerms: terms });
    await writeFile(`${dir}/${result.filename}`, result.pdf);
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(result.html);
      const check = await page.evaluate(() => [...document.querySelectorAll('.sheet')].map(sheet => {
        const content = sheet.querySelector('.content'), footer = sheet.querySelector('footer'), signature = sheet.querySelector('[data-key="signature"]');
        return { overflow: content.scrollHeight > content.clientHeight, signature: !!signature, overlap: signature && signature.getBoundingClientRect().bottom > footer.getBoundingClientRect().top, text: content.innerText };
      }));
      assert.ok(check.every(p => !p.overflow && !p.overlap));
      assert.equal(check.filter(p => p.signature).length, 1);
      const text = check.map(p => p.text).join('\n');
      assert.ok(text.indexOf('Condições de pagamento') < text.indexOf('ACEITE DA PROPOSTA'));
      assert.match(text, isCrm ? /Assinatura do cliente ou responsável\s+Clínica Fluxity Saúde\s+Data:/ : /Assinatura do cliente ou responsável\s+Data:/);
      assert.ok(text.includes('Data: ______ / ______ / __________'));
      assert.ok(text.includes(terms));
      if (template.id === 'trafego-pago-atendimento') {
        for (const value of ['Google Ads', 'Meta Ads', 'Atendimento Comercial dos Leads', '4.500,00', 'Follow-up', 'histórico dos atendimentos']) assert.ok(text.includes(value), value);
        for (const value of ['Landing Page', 'inteligência artificial', 'palavras-chave junto ao cliente para alinhamento']) assert.ok(!text.includes(value), value);
      }
      if (isCrm) {
        for (const value of ['Google Ads', 'Meta Ads', 'Atendimento Comercial dos Leads', 'CRM e Gestão dos Contatos', 'Gestão Comercial', '5.500,00', 'Indicadores acompanhados', 'Não existe garantia de volume de vendas ou faturamento', 'gestão exclusiva da equipe']) assert.ok(text.includes(value), value);
        for (const value of ['Landing Page', 'inteligência artificial']) assert.ok(!text.toLowerCase().includes(value.toLowerCase()), value);
      }
      console.log(`${result.filename}: ${result.pageCount} páginas; assinatura na página ${check.findIndex(p => p.signature) + 1}`);
    } finally { await browser.close(); }
  }
} finally { await generator.close(); }
