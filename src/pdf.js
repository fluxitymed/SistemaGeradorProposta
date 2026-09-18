import { chromium } from 'playwright';
import { renderDocument, paginateDocument, safeFilename } from './document.js';

export async function launchBrowser() {
  const options = { headless: true, timeout: 30000 };
  if (process.env.PDF_BROWSER_PATH) return chromium.launch({ ...options, executablePath: process.env.PDF_BROWSER_PATH });
  for (const channel of ['chrome', 'msedge', undefined]) {
    try { return await chromium.launch({ ...options, ...(channel ? { channel } : {}) }); }
    catch { /* Tenta o próximo navegador local ou o Chromium do Playwright. */ }
  }
  throw new Error('Instale o Google Chrome ou execute npx playwright install chromium.');
}

export function createPdfGenerator() {
  let browserPromise;
  let active = 0;
  return {
    async generate(template, data) {
      if (active >= 2) throw Object.assign(new Error('Há propostas sendo geradas. Tente novamente em alguns segundos.'), { status: 429 });
      active++;
      let context;
      try {
        if (!browserPromise) browserPromise = launchBrowser().then(browser => {
          browser.on('disconnected', () => { browserPromise = undefined; }); return browser;
        }).catch(error => { browserPromise = undefined; throw error; });
        const browser = await browserPromise;
        context = await browser.newContext({ viewport: { width: 794, height: 1123 }, offline: true });
        const page = await context.newPage();
        page.setDefaultTimeout(30000);
        await page.setContent(await renderDocument(template, data), { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        const layout = await page.evaluate(paginateDocument);
        const html = await page.content();
        // Chromium imprime HTML/CSS com texto selecionável, sem screenshots.
        const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true, tagged: true, timeout: 30000 });
        return { html, pdf, filename: safeFilename(template, data.clientName), ...layout };
      } finally {
        try { await context?.close(); } finally { active--; }
      }
    },
    async close() { if (browserPromise) await (await browserPromise).close(); },
  };
}
