import { validateProposal, parsePrice, formatPrice } from './validation.js';

const $ = id => document.getElementById(id);
const form = $('proposal-form');
const fields = ['productId', 'clientName', 'price', 'paymentTerms'];
let products = [], revision = 0, current = null, busy = false, request, zoomed = false;

function setError(message = '') { $('global-error').textContent = message; $('global-error').hidden = !message; }
function showErrors(errors) {
  for (const name of fields) {
    $(name).setAttribute('aria-invalid', String(Boolean(errors[name])));
    $(`${name}-error`).textContent = errors[name] || '';
  }
}
function setBusy(value) {
  busy = value;
  $('preview-button').disabled = value || !products.length;
  $('preview-label').textContent = value ? 'Gerando proposta…' : 'Visualizar proposta';
  $('preview-button').setAttribute('aria-busy', String(value));
  document.querySelector('.preview-card').setAttribute('aria-busy', String(value));
}
function invalidate() {
  revision++;
  request?.abort(); request = null;
  setBusy(false);
  if (current) URL.revokeObjectURL(current.url);
  current = null;
  $('download-button').disabled = true;
  $('zoom-button').hidden = true;
  $('proposal-preview').removeAttribute('srcdoc');
  $('preview-scroll').hidden = true;
  $('empty-preview').hidden = false;
  $('preview-info').textContent = 'A proposta aparecerá neste espaço.';
  $('form-status').textContent = '';
  setError();
}
for (const name of fields) $(name).addEventListener('input', () => {
  invalidate();
  $(name).setAttribute('aria-invalid', 'false');
  $(`${name}-error`).textContent = '';
});
$('price').addEventListener('blur', () => {
  const cents = parsePrice($('price').value);
  if (cents !== null && cents >= 0) $('price').value = formatPrice(cents);
});

function resizePreview() {
  if (!current) return;
  const scroll = $('preview-scroll');
  const style = getComputedStyle(scroll);
  const availableWidth = scroll.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const scale = zoomed ? 1 : Math.min(1, availableWidth / 794);
  $('preview-stage').style.width = zoomed ? '794px' : '100%';
  const frame = $('proposal-preview');
  frame.style.height = `${Math.ceil(current.height)}px`;
  frame.style.transform = `scale(${scale})`;
  $('preview-stage').style.height = `${Math.ceil(current.height * scale)}px`;
}
new ResizeObserver(resizePreview).observe($('preview-scroll'));
$('zoom-button').addEventListener('click', () => {
  zoomed = !zoomed;
  $('zoom-button').setAttribute('aria-pressed', String(zoomed));
  $('zoom-button').textContent = zoomed ? 'Ajustar' : 'Ampliar';
  resizePreview();
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  const input = Object.fromEntries(new FormData(form));
  const validation = validateProposal(input, products);
  showErrors(validation.errors); setError();
  if (!validation.valid) { $(Object.keys(validation.errors)[0]).focus(); return; }
  invalidate();
  const submittedRevision = revision;
  request = new AbortController();
  const controller = request;
  const timeout = setTimeout(() => controller.abort('timeout'), 60000);
  setBusy(true);
  $('form-status').textContent = 'Preparando as páginas da proposta…';
  try {
    const response = await fetch('/api/proposals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: controller.signal,
    });
    const result = await response.json();
    if (revision !== submittedRevision) return;
    if (!response.ok) { if (result.errors) showErrors(result.errors); throw new Error(result.message || 'Não foi possível gerar a proposta.'); }
    const pdfBytes = Uint8Array.from(atob(result.pdf), char => char.charCodeAt(0));
    current = { ...result, url: URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' })) };
    $('proposal-preview').srcdoc = result.html;
    $('empty-preview').hidden = true;
    $('preview-scroll').hidden = false;
    $('download-button').disabled = false;
    $('zoom-button').hidden = false;
    $('preview-info').textContent = `${result.pageCount} ${result.pageCount === 1 ? 'página' : 'páginas'} · Pronta para baixar`;
    $('form-status').textContent = 'Proposta pronta. Confira a visualização antes de baixar.';
    resizePreview();
  } catch (error) {
    if (revision === submittedRevision) {
      setError(controller.signal.aborted ? 'A geração demorou mais que o esperado. Tente novamente.' : error.message === 'Failed to fetch' ? 'Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.' : error.message);
      $('form-status').textContent = '';
    }
  } finally {
    clearTimeout(timeout);
    if (revision === submittedRevision) { setBusy(false); request = null; }
  }
});
$('download-button').addEventListener('click', () => {
  if (!current) return;
  const link = document.createElement('a');
  link.href = current.url; link.download = current.filename;
  document.body.append(link); link.click(); link.remove();
});
window.addEventListener('pagehide', () => { if (current) URL.revokeObjectURL(current.url); });

async function loadProducts() {
  setError(); $('retry-products').hidden = true;
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Não foi possível carregar os produtos.');
    products = await response.json();
    if (!Array.isArray(products) || !products.length) throw new Error('Nenhum produto está disponível.');
    $('productId').replaceChildren(new Option('Selecione um produto', ''), ...products.map(product => new Option(product.name, product.id)));
    $('productId').disabled = false;
    setBusy(false);
  } catch {
    products = [];
    setError('Não foi possível carregar os produtos. Verifique se o servidor está funcionando e tente novamente.');
    $('retry-products').hidden = false;
  }
}
$('retry-products').addEventListener('click', loadProducts);
loadProducts();
