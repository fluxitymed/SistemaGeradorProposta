import { fluxity } from '../config/fluxity.js';
import { gestaoAquisicaoComercial } from './gestao-aquisicao-comercial.js';
import { metaAds } from './meta-ads.js';

const [google, , atendimento] = gestaoAquisicaoComercial.serviceGroups;
const meta = metaAds.serviceGroups[0];

export const trafegoPagoAtendimento = {
  id: 'trafego-pago-atendimento', name: 'Tráfego Pago + Atendimento',
  filenameLabel: 'Trafego-Pago-Atendimento', category: 'Marketing e operação comercial',
  reference: 'Tráfego Pago + Atendimento', variableFields: ['clientName', 'price', 'paymentTerms'],
  serviceGroups: [
    { ...google, items: [...google.items, 'Monitoramento do desempenho das campanhas.'] },
    { ...meta, items: meta.items.map(item => item.includes('site ou Landing Page compatível') ? item.replace('site ou Landing Page compatível', 'estrutura compatível') : item) },
    { ...atendimento, items: [...atendimento.items, 'Follow-up dos contatos que não avançarem no primeiro atendimento;', 'Registro do histórico dos atendimentos.'] },
  ],
  supplyLimits: [
    'Não está inclusa a verba destinada às campanhas;',
    'O cliente deverá aprovar as campanhas, os anúncios, os materiais e a metodologia utilizada;',
    'O pagamento da verba será feito diretamente pelo cliente às plataformas Google Ads e Meta;',
    'A Fluxity não atuará como intermediadora do pagamento da verba;',
    'As campanhas poderão ser pausadas a qualquer momento a pedido do cliente;',
    'A Fluxity somente habilitará novamente as campanhas depois de receber autorização do cliente;',
    'Caso a verba termine, as campanhas poderão ser pausadas até que o cliente realize uma nova recarga ou regularize a forma de pagamento;',
    'A gestão das campanhas será vinculada a um único site, perfil, clínica ou unidade previamente definida;',
    'O cliente deverá fornecer e manter os acessos necessários às contas de anúncios, página, Instagram, site e demais ativos utilizados;',
    'A Fluxity não garante resultados financeiros, volume exato de leads, quantidade de conversões, custo fixo por resultado, posicionamento fixo no Google ou quantidade garantida de agendamentos;',
    'O desempenho depende de fatores externos, como mercado, concorrência, região, oferta, investimento, qualidade dos materiais, comportamento do público, disponibilidade de agenda e capacidade operacional da clínica;',
    'A confirmação do agendamento depende da disponibilidade informada pela clínica;',
    'A clínica deverá manter atualizadas as informações sobre horários, procedimentos, valores, regras de convênio ou particular, localização, formas de pagamento e demais dados necessários para o atendimento;',
    'Informações incorretas ou desatualizadas fornecidas pela clínica podem prejudicar a condução dos contatos;',
    'Não estão incluídos atendimentos clínicos, diagnósticos, prescrições ou orientações médicas ou odontológicas;',
    'Situações que dependam de decisão técnica deverão ser encaminhadas ao responsável indicado pelo cliente;',
    'Serviços não descritos expressamente em “Serviços contratados inclusos” não fazem parte da proposta.',
  ],
  serviceStart: 'O início do serviço ocorrerá em até 30 dias após a configuração dos acessos, o alinhamento da operação, a definição dos canais de atendimento, o recebimento das informações necessárias, a aprovação das campanhas e a observância de todos os itens do tópico “Limites de fornecimento”.',
  investmentDescription: 'Gestão de Google Ads e Meta Ads + Atendimento Comercial',
  observations: [
    'A verba destinada às campanhas no Google Ads e Meta Ads não está inclusa no valor da mensalidade;',
    'O pagamento da verba será feito diretamente pelo cliente às respectivas plataformas;',
    'A execução do atendimento depende do fornecimento e da atualização das informações necessárias pela clínica;',
    'Ampliações de escopo deverão ser contratadas separadamente.',
  ],
  company: fluxity, labels: metaAds.labels,
  visual: { ...metaAds.visual, accent: '#100d30', paper: '#fff', splitAcrossPages: ['supplyLimits', 'serviceStart'] },
  reviewNotes: [],
};
