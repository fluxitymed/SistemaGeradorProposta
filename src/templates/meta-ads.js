import { fluxity } from '../config/fluxity.js';

// Conteúdo comercial fornecido para a proposta de Gestão de Meta Ads.
// Vencimento, duração e forma de pagamento pertencem somente a paymentTerms.
export const metaAds = {
  id: 'meta-ads',
  name: 'Gestão de Meta Ads',
  filenameLabel: 'Meta-Ads',
  category: 'Marketing digital',
  reference: 'Gerenciamento do Meta Ads',
  variableFields: ['clientName', 'price', 'paymentTerms'],
  serviceGroups: [{
    title: 'Meta Ads',
    items: [
      'Criação, configuração e manutenção de campanhas no Meta Ads;',
      'Otimização constante das campanhas;',
      'Definição de estratégias e objetivos junto ao cliente;',
      'Definição dos públicos e das segmentações utilizadas nas campanhas;',
      'Configuração das métricas por meio do Pixel da Meta, quando houver site ou Landing Page compatível;',
      'Monitoramento do desempenho dos anúncios;',
      'Análise de comportamento, interações, dados demográficos e performance das campanhas;',
      'Relatórios mensais com os resultados das campanhas.',
    ],
  }],
  supplyLimits: [
    'Não está inclusa a verba destinada às campanhas;',
    'O cliente deverá aprovar as campanhas, os anúncios e a metodologia utilizada;',
    'O pagamento da verba das campanhas será feito diretamente pelo cliente à plataforma Meta;',
    'As campanhas poderão ser pausadas a qualquer momento a pedido do cliente;',
    'Quando uma campanha for pausada a pedido do cliente, a Fluxity somente realizará sua reativação depois de receber a autorização do cliente;',
    'Caso a verba disponível termine, as campanhas poderão ser pausadas até que o cliente realize uma nova recarga ou regularize a forma de pagamento;',
    'A gestão será vinculada a uma única conta de anúncios, perfil, clínica ou unidade previamente definida;',
    'O cliente deverá fornecer e manter os acessos necessários à conta de anúncios, página, perfil do Instagram, site e demais ativos utilizados na operação;',
    'A instalação e o funcionamento do Pixel da Meta dependem da existência de um site ou Landing Page tecnicamente compatível e da concessão dos acessos necessários;',
    'A Fluxity não se responsabiliza por resultados financeiros, volume garantido de leads, quantidade exata de conversões, custo fixo por resultado ou quantidade garantida de agendamentos;',
    'O desempenho das campanhas depende de fatores externos, como mercado, concorrência, região, oferta, investimento, qualidade dos ativos fornecidos, comportamento do público, atendimento comercial e disponibilidade de agenda;',
    'Não estão incluídos serviços que não estejam expressamente descritos na seção “Serviços contratados inclusos”.',
  ],
  serviceStart: 'O início do serviço ocorrerá em até 30 dias após a configuração inicial dos acessos, a definição da estratégia, o recebimento dos materiais necessários, a aprovação das campanhas e a observância de todos os itens do tópico “Limites de fornecimento”.',
  investmentDescription: 'Elaboração, configuração e acompanhamento de campanhas no Meta Ads',
  observations: [
    'A verba destinada às campanhas no Meta Ads não está inclusa no valor da mensalidade;',
    'O pagamento da verba será feito diretamente pelo cliente à plataforma Meta.',
  ],
  company: fluxity,
  labels: {
    document: 'PROPOSTA', reference: 'REFERÊNCIA', representative: 'Representante da Fluxity',
    includedServices: 'Serviços contratados inclusos', supplyLimits: 'Limites de fornecimento',
    serviceStart: 'Início do serviço', investment: 'Investimento', description: 'DESCRIÇÃO',
    price: 'MENSALIDADE', observations: 'Observações importantes:', paymentTerms: 'Condições de pagamento',
  },
  visual: {
    accent: '#002060', heading: '#767171', paper: '#f8f8f8',
    headerAsset: 'fluxity-header.png', footerAsset: 'fluxity-footer.png',
    breakBefore: [], keepWithNext: ['investment'],
  },
  reviewNotes: [],
};
