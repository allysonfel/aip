import type { Segmento } from "./tipos";

const segmento: Segmento = {
  slug: "setor-publico",
  nome: "Setor público",
  tipo: "publico",
  descricaoMenu: "Espaços urbanos, prédios e serviços públicos.",
  linhaCartao: "Monitoramento e inteligência para gestão urbana.",
  hero: {
    titulo: "Inteligência visual para a gestão pública.",
    texto: "Visão computacional para apoiar o monitoramento, a segurança e a gestão de espaços urbanos.",
    foto: "praca-aerea.jpg",
    alt: "Parque urbano e rotatória vistos do alto",
  },
  cartao: { foto: "praca-aerea.jpg", alt: "Parque urbano e rotatória vistos do alto" },
  usos: [
    { titulo: "Identificação de pessoas procuradas", texto: "Reconhecimento facial integrado às bases das forças de segurança, mediante convênio e avaliação jurídica.", visual: "V15", exemplo: "Integração com a central de segurança", sobProjeto: true },
    { titulo: "Aglomerações e tumultos", texto: "Identificação de aglomerações e situações anormais em praças, eventos e vias, com aviso às equipes.", visual: "V17", exemplo: "Praça central: aviso às 22h10", sobProjeto: true },
    { titulo: "Perímetro", texto: "Aviso quando alguém cruza limites definidos em prédios e áreas públicas.", visual: "V18", exemplo: "Escola municipal: 1 aviso" },
    { titulo: "Espaços públicos", texto: "Contagem de pessoas e ocupação de praças, parques e eventos.", visual: "V16", exemplo: "Praça central: 1.540 pessoas" },
    { titulo: "Vias e acessos", texto: "Leitura de placas em entradas e pontos estratégicos.", visual: "V8", exemplo: "Acesso norte: 3.200 veículos/dia" },
    { titulo: "Prédios e serviços públicos", texto: "Acompanhamento de escolas, unidades de saúde e prédios municipais.", visual: "V14", exemplo: "12 unidades" },
    { titulo: "Apoio às equipes", texto: "Imagens em tempo real e trechos marcados para as equipes responsáveis.", visual: "V11", exemplo: "Trecho enviado: 00:35" },
    { titulo: "Planejamento urbano", texto: "Comparação de movimentação entre períodos para avaliar obras e ações.", visual: "V4", exemplo: "Antes/depois da obra: +22%" },
  ],
  pratica: {
    texto: "Cada projeto é avaliado conforme a infraestrutura, os objetivos e os requisitos técnicos e administrativos da instituição.",
    passos: [
      { titulo: "Avaliação", texto: "Análise da infraestrutura de câmeras e centrais existentes." },
      { titulo: "Integração", texto: "Conexão das câmeras compatíveis e, onde não há estrutura, avaliação do Totem IA." },
      { titulo: "Configuração", texto: "Perfis de acesso, auditoria e prazos de retenção definidos pelo órgão." },
      { titulo: "Operação", texto: "Equipes acompanham indicadores e imagens num único painel." },
    ],
  },
  governanca: {
    texto: "O tratamento das informações deve respeitar a finalidade pública, os requisitos legais e as condições estabelecidas contratualmente.",
    itens: ["Perfis e permissões de usuários", "Registros de atividades e auditoria", "Identificação de autor e data das ações registradas", "Definição de períodos de retenção e exclusão", "Identificação de pessoas pelo rosto sob projeto, mediante avaliação técnica e jurídica, conforme a finalidade pública e a legislação aplicável"],
  },
  faq: [
    { p: "Como o órgão contrata a AIP?", r: "As modalidades são definidas com as equipes técnicas e jurídicas do órgão, conforme a legislação aplicável." },
    { p: "É possível aproveitar as câmeras que a cidade já tem?", r: "Sim. A IA é aplicada em qualquer câmera, inclusive nas que a cidade já tem." },
    { p: "A AIP faz reconhecimento facial?", r: "Sim, sob projeto. A AIP pode identificar pessoas pelo rosto, mediante avaliação técnica e jurídica, conforme a finalidade pública e a legislação aplicável." },
    { p: "Quem acessa as informações?", r: "Servidores autorizados, com acesso por perfil e registro em auditoria." },
  ],
  encerramento: { titulo: "Mais inteligência para os espaços públicos.", texto: "Conte um pouco sobre sua necessidade e nossa equipe entrará em contato.", cta: "Fale com a equipe AIP" },
};

export default segmento;
