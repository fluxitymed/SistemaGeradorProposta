import { fluxity } from '../config/fluxity.js';

// Referência visual: “Proposta Dr. Leonardo Carvalho.pdf”.
// Conteúdo comercial: versão explicitamente fornecida pelo usuário.
// Vencimento, duração e forma de pagamento pertencem apenas a paymentTerms.
export const gestaoAquisicaoComercial = {
  id: 'gestao-aquisicao-comercial',
  name: 'Gestão de Aquisição e Gestão Comercial',
  filenameLabel: 'Gestao-Aquisicao-Comercial',
  category: 'Marketing digital',
  reference: 'Gestão de Aquisição e Gestão Comercial',
  variableFields: ['clientName', 'price', 'paymentTerms'],
  serviceGroups: [
    {
      title: 'Google Ads',
      items: [
        'Criação e manutenção de campanhas no Google Ads;',
        'Otimização constante das campanhas;',
        'Definição de estratégias, objetivos e palavras-chave junto ao cliente;',
        'Relatórios mensais com os resultados da campanha;',
        'Acompanhamento dos contatos gerados pelas campanhas, quando vinculados à operação de atendimento da Fluxity.',
      ],
    },
    {
      title: 'Meta Ads',
      items: [
        'Criação, manutenção e otimização de campanhas nas redes sociais;',
        'Definição de estratégias junto ao cliente para alinhamento dos objetivos das campanhas;',
        'Definição de estratégias, objetivos e palavras-chave junto ao cliente;',
        'Configuração de métricas no Google Analytics e Pixel da Meta;',
        'Relatórios mensais com os resultados da campanha;',
        'Análise de comportamento, interações, dados demográficos e performance dos anúncios.',
      ],
    },
    {
      title: 'Atendimento Comercial dos Leads',
      items: [
        'Atendimento inicial dos leads gerados pelas campanhas da clínica;',
        'Qualificação dos contatos conforme critérios definidos junto ao cliente;',
        'Condução dos leads interessados até o agendamento;',
        'Confirmação ativa dos agendamentos realizados;',
        'Organização dos contatos conforme status da jornada comercial;',
        'Acompanhamento dos motivos de perda ou não agendamento;',
        'Relatório com visão dos contatos recebidos, atendidos, qualificados, agendados e perdidos.',
      ],
    },
    {
      title: 'Landing Page',
      items: [
        'Landing Page em HTML nos parâmetros definidos;',
        'Otimização da Landing Page para dispositivos móveis.',
      ],
    },
  ],
  supplyLimits: [
    'Não está inclusa a verba das campanhas;',
    'O cliente deverá aprovar as campanhas e a metodologia utilizada;',
    'O pagamento da verba é feito diretamente pelo cliente às plataformas Google Ads e Meta Ads;',
    'As campanhas poderão ser pausadas a qualquer momento a pedido do cliente. A Fluxity só habilitará novamente as campanhas após autorização registrada do cliente;',
    'Caso a verba das campanhas encerre, automaticamente as campanhas serão pausadas até que o cliente faça uma nova recarga;',
    'A gestão das campanhas é vinculada a um único site, perfil, clínica ou unidade previamente definida;',
    'A Fluxity não se responsabiliza por resultados financeiros, número exato de conversões, volume garantido de leads, posicionamento fixo no Google ou quantidade garantida de agendamentos, uma vez que o desempenho depende de fatores externos, como mercado, concorrência, comportamento do consumidor, oferta, região, verba, atendimento, agenda disponível e demais fatores fora do controle da Fluxity;',
    'A confirmação do agendamento depende da disponibilidade de agenda informada pela clínica;',
    'A clínica deverá fornecer informações atualizadas sobre horários disponíveis, procedimentos atendidos, valores, quando aplicável, regras de convênio ou atendimento particular, localização, formas de pagamento e demais informações necessárias para o atendimento correto dos leads;',
    'Não estão incluídas no pacote manutenções e alterações na Landing Page depois de revisada e aprovada pelo cliente.',
  ],
  serviceStart: 'O início do serviço ocorrerá em até 30 dias após a configuração inicial dos acessos, o alinhamento da operação, a definição dos canais de atendimento, a aprovação das campanhas e a observância de todos os itens do tópico “Limites de fornecimento”.',
  investmentDescription: 'Gerenciamento do Google Ads e Meta Ads + Gestão Comercial',
  observations: [
    'A verba das campanhas no Google Ads e Meta Ads não está inclusa no valor da mensalidade;',
    'O pagamento da verba é feito diretamente pelo cliente às respectivas plataformas.',
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
    // As três partes seguem o fluxo; blocos são medidos, sem páginas rígidas.
    breakBefore: [],
    keepWithNext: ['investment'],
  },
  reviewNotes: [],
};
