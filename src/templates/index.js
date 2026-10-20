import { googleAds } from './google-ads.js';
import { gestaoAquisicaoComercial } from './gestao-aquisicao-comercial.js';
import { metaAds } from './meta-ads.js';
import { trafegoPagoAtendimento } from './trafego-pago-atendimento.js';
import { trafegoPagoAtendimentoCrm } from './trafego-pago-atendimento-crm.js';
import { equipeCompleta } from './equipe-completa.js';

// Registre novos templates aqui. O formulário consulta este catálogo.
export const templates = new Map([googleAds, gestaoAquisicaoComercial, metaAds, trafegoPagoAtendimento, trafegoPagoAtendimentoCrm, equipeCompleta].map(template => [template.id, template]));
export const productOptions = () => [...templates.values()].map(({ id, name }) => ({ id, name }));
