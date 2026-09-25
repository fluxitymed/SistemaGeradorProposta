import assert from 'node:assert/strict';
import { rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { browserRuntime, launchBrowser } from '../src/pdf.js';

const pdfPath = join('/tmp', `playwright-smoke-${process.pid}.pdf`);
const runtime = browserRuntime();
assert.ok(runtime.executablePath, 'Playwright não resolveu o executável do Chromium.');

let browser;
try {
  browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body><h1>PDF smoke test</h1></body></html>');
  await page.pdf({ path: pdfPath, format: 'A4' });
  const file = await stat(pdfPath);
  assert.ok(file.size > 0, 'O PDF gerado está vazio.');
  console.log(`Chromium do Playwright ${runtime.playwrightVersion} gerou PDF de ${file.size} bytes.`);
} finally {
  await browser?.close();
  await rm(pdfPath, { force: true });
}
