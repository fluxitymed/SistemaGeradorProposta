export const limits = { clientName: 300, paymentTerms: 4000, maxPriceCents: 99999999999 };

export function parsePrice(value) {
  if (typeof value !== 'string') return null;
  const text = value.replace(/^R\$\s*/, '').trim();
  if (!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(text)) return null;
  const [whole, decimals = ''] = text.replaceAll('.', '').split(',');
  const cents = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
}

export const formatPrice = cents => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
}).format(cents / 100);

export function validateProposal(input, products) {
  const errors = {};
  const productId = typeof input?.productId === 'string' ? input.productId : '';
  const clientName = typeof input?.clientName === 'string' ? input.clientName.trim() : '';
  const paymentTerms = typeof input?.paymentTerms === 'string' ? input.paymentTerms.trim() : '';
  const priceCents = parsePrice(input?.price);
  if (!products.some(product => product.id === productId)) errors.productId = 'Selecione um produto válido.';
  if (!clientName) errors.clientName = 'Informe o nome do cliente.';
  else if (clientName.length > limits.clientName) errors.clientName = `Use até ${limits.clientName} caracteres no nome.`;
  if (priceCents === null || priceCents <= 0) errors.price = 'Informe um valor em reais maior que zero (ex.: 1.000,00).';
  else if (priceCents > limits.maxPriceCents) errors.price = 'Informe um valor de até R$ 999.999.999,99.';
  if (!paymentTerms) errors.paymentTerms = 'Informe a condição de pagamento.';
  else if (paymentTerms.length > limits.paymentTerms) errors.paymentTerms = `Use até ${limits.paymentTerms} caracteres na condição de pagamento.`;
  for (const [field, text] of Object.entries({ clientName, paymentTerms })) {
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) errors[field] = 'Remova os caracteres de controle do texto.';
  }
  return { errors, valid: Object.keys(errors).length === 0, data: { productId, clientName, priceCents, paymentTerms } };
}
