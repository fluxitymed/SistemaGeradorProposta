import { googleAds } from './google-ads.js';
import { gestaoAquisicaoComercial } from './gestao-aquisicao-comercial.js';

// Registre novos templates aqui. O formulário consulta este catálogo.
export const templates = new Map([googleAds, gestaoAquisicaoComercial].map(template => [template.id, template]));
export const productOptions = () => [...templates.values()].map(({ id, name }) => ({ id, name }));
