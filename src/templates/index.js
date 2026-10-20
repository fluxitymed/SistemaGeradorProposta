import { googleAds } from './google-ads.js';
import { gestaoAquisicaoComercial } from './gestao-aquisicao-comercial.js';
import { metaAds } from './meta-ads.js';
import { trafegoPagoAtendimento } from './trafego-pago-atendimento.js';

// Registre novos templates aqui. O formulário consulta este catálogo.
export const templates = new Map([googleAds, gestaoAquisicaoComercial, metaAds, trafegoPagoAtendimento].map(template => [template.id, template]));
export const productOptions = () => [...templates.values()].map(({ id, name }) => ({ id, name }));
