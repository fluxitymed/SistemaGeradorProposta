import { readFile } from 'node:fs/promises';
import { formatPrice } from '../public/validation.js';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export function safeFilename(template, clientName) {
  const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100).replace(/-$/g, '');
  return `Proposta-${slug(template.filenameLabel) || 'Produto'}-${slug(clientName) || 'Cliente'}.pdf`;
}

const assetCache = new Map();
async function asset(name, mime) {
  if (!assetCache.has(name)) {
    const bytes = await readFile(new URL(`../public/assets/${name}`, import.meta.url));
    assetCache.set(name, `data:${mime};base64,${bytes.toString('base64')}`);
  }
  return assetCache.get(name);
}

export async function renderDocument(template, data) {
  const [logo, footer, regular, bold, css] = await Promise.all([
    asset(template.visual.headerAsset, 'image/png'), asset(template.visual.footerAsset, 'image/png'),
    asset('fonts/Poppins-Regular.ttf', 'font/ttf'), asset('fonts/Poppins-Bold.ttf', 'font/ttf'),
    readFile(new URL('./document.css', import.meta.url), 'utf8'),
  ]);
  const e = escapeHtml;
  const l = template.labels;
  const section = (key, title, body) => `<section data-key="${e(key)}"${template.visual.breakBefore.includes(key) ? ' data-break-before="true"' : ''}${template.visual.keepWithNext?.includes(key) ? ' data-keep-with-next="true"' : ''}><h2>${e(title)}</h2>${body}</section>`;
  const list = items => `<ul>${items.map(text => `<li>${e(text)}</li>`).join('')}</ul>`;
  const services = template.serviceGroups
    ? template.serviceGroups.map(group => `<div class="service-group"><h3>${e(group.title)}</h3>${list(group.items)}</div>`).join('')
    : list(template.includedServices);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${e(l.document)} — ${e(data.clientName)}</title>
  <style>@font-face{font-family:Poppins;src:url('${regular}')}@font-face{font-family:Poppins;src:url('${bold}');font-weight:700}
  :root{--accent:${template.visual.accent};--heading:${template.visual.heading};--paper:${template.visual.paper}}${css}</style></head><body>
  <template id="sheet-template"><article class="sheet" aria-label="Página da proposta">
  <header><span>${e(l.document)}</span><div class="brand-symbol"><img src="${logo}" alt="${e(template.company.name)}"></div></header>
  <div class="content"></div><footer><strong>${e(template.company.website)}</strong><img src="${footer}" alt="${e(template.company.name)}"></footer></article></template>
  <main id="pages"></main><div id="source">
  ${section('client', template.category, `<p class="client-name">${e(data.clientName)}</p><p class="reference"><strong>${e(l.reference)}:</strong> ${e(template.reference)}</p>`)}
  ${section('representative', l.representative, `<p class="representative"><strong>${e(template.company.representative)}</strong><br>${e(template.company.phone)}<br>${e(template.company.email)}</p>`)}
  ${section('includedServices', l.includedServices, services)}
  ${section('supplyLimits', l.supplyLimits, list(template.supplyLimits))}
  ${section('serviceStart', l.serviceStart, `<p>${e(template.serviceStart)}</p>`)}
  ${section('investment', l.investment, `<table><thead><tr><th>${e(l.description)}</th><th>${e(l.price)}</th></tr></thead><tbody><tr><td>${e(template.investmentDescription)}</td><td class="price">${e(formatPrice(data.priceCents))}</td></tr></tbody></table><p class="observations">${e(l.observations)}<br>${template.observations.map(text => `-${e(text)}`).join('<br>')}</p>`)}
  ${section('paymentTerms', l.paymentTerms, `<p class="payment-terms">${e(data.paymentTerms)}</p>${template.latePaymentRule ? `<p>${e(template.latePaymentRule)}</p>` : ''}`)}
  </div></body></html>`;
}

// Executada no Chromium, após as fontes carregarem. Mede os blocos reais e
// mantém seções inteiras sempre que couberem em uma página.
export function paginateDocument() {
  const pages = document.querySelector('#pages');
  const source = document.querySelector('#source');
  const sheet = document.querySelector('#sheet-template');
  let content;
  const newPage = () => {
    pages.append(sheet.content.cloneNode(true));
    content = pages.lastElementChild.querySelector('.content');
  };
  const fits = () => content.scrollHeight <= content.clientHeight;
  newPage();
  for (const original of [...source.children]) {
    if (original.dataset.breakBefore && content.children.length) newPage();
    if (original.dataset.keepWithNext && original.nextElementSibling && content.children.length) {
      // Junta investimento e pagamento se o conjunto couber em uma página.
      // A medição evita uma quebra rígida para condições extensas.
      const first = original.cloneNode(true);
      const next = original.nextElementSibling.cloneNode(true);
      content.append(first, next);
      const fitsHere = fits();
      first.remove(); next.remove();
      if (!fitsHere) {
        const probe = content.cloneNode(false);
        probe.style.left = '-20000px';
        probe.append(first, next);
        document.body.append(probe);
        const fitsTogether = probe.scrollHeight <= probe.clientHeight;
        probe.remove();
        if (fitsTogether) newPage();
      }
    }
    let section = original.cloneNode(true);
    content.append(section);
    if (fits()) continue;
    section.remove();
    // Grupos de serviços podem aproveitar o espaço restante, mantendo cada
    // subtítulo com sua lista. O caminho do template simples permanece igual.
    if (!original.querySelector('.service-group')) {
      if (content.children.length) newPage();
      content.append(section);
      if (fits()) continue;
      section.remove();
    }
    // Seção extensa: distribui parágrafos/itens sem deixar um título sozinho.
    const title = original.querySelector('h2');
    const startSection = () => {
      section = original.cloneNode(false);
      section.append(title.cloneNode(true));
      content.append(section);
    };
    startSection();
    const blocks = [...original.children].filter(el => el.tagName !== 'H2').flatMap(el =>
      el.tagName === 'UL' ? [...el.children].map(li => { const ul = document.createElement('ul'); ul.append(li.cloneNode(true)); return ul; }) : [el.cloneNode(true)]);
    for (let block of blocks) {
      section.append(block);
      if (fits()) continue;
      block.remove();
      if (section.children.length > 1) { newPage(); startSection(); }
      else if (content.children.length > 1) { section.remove(); newPage(); startSection(); }
      section.append(block);
      if (fits()) continue;
      // Textos livres muito extensos, inclusive sem espaços ou com muitas linhas.
      if (block.tagName !== 'P') throw new Error('Um bloco do template excede a área de uma página.');
      let remaining = block.textContent;
      block.remove();
      while (remaining.length) {
        const part = block.cloneNode(false);
        section.append(part);
        let low = 0, high = remaining.length;
        while (low < high) {
          const mid = Math.ceil((low + high) / 2);
          part.textContent = remaining.slice(0, mid);
          if (fits()) low = mid; else high = mid - 1;
        }
        if (!low) throw new Error('Não foi possível acomodar o texto na página.');
        let split = low;
        if (low < remaining.length) {
          const line = remaining.lastIndexOf('\n', low - 1);
          const word = remaining.lastIndexOf(' ', low - 1);
          if (line > low * 0.75) split = line + 1;
          else if (word > low * 0.75) split = word + 1;
          if (/[\uD800-\uDBFF]/.test(remaining[split - 1])) split--;
        }
        part.textContent = remaining.slice(0, split);
        remaining = remaining.slice(split);
        if (remaining) { newPage(); startSection(); }
      }
    }
  }
  source.remove(); sheet.remove();
  return { pageCount: pages.children.length, height: pages.getBoundingClientRect().height };
}
