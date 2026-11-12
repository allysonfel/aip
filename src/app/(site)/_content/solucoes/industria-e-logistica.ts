import { ENCERRAMENTO_PRIVADO, passosPadrao, TEXTO_PRATICA, type Segmento } from "./tipos";

const segmento: Segmento = {
  slug: "industria-e-logistica",
  nome: "Indústria e logística",
  tipo: "empresa",
  descricaoMenu: "Circulação, perímetro e ocupação das áreas.",
  linhaCartao: "Monitoramento de áreas e movimentações.",
  hero: {
    titulo: "Inteligência artificial para áreas operacionais.",
    texto: "Acompanhe a circulação de pessoas, proteja perímetros e entenda a rotina da operação a partir das imagens.",
    foto: "industria-fabrica.jpg",
    alt: "Área operacional de uma fábrica moderna, com corredores sinalizados e estantes",
  },
  cartao: { foto: "industria-fabrica.jpg", alt: "Área operacional de uma fábrica moderna, com corredores sinalizados e estantes" },
  usos: [
    { titulo: "Controle de EPI", texto: "Identificação de pessoas sem capacete, colete ou outros equipamentos de proteção, com aviso ao responsável pela área.", visual: "V21", exemplo: "Setor de carga: 2 sem capacete" },
    { titulo: "Circulação em áreas operacionais", texto: "Contagem e acompanhamento de pessoas por área e período.", visual: "V20", exemplo: "86 pessoas no turno" },
    { titulo: "Áreas restritas", texto: "Aviso de presença em locais e horários definidos.", visual: "V7", exemplo: "Fora do horário: 1 aviso" },
    { titulo: "Controle de veículos", texto: "Leitura de placas em portarias e docas.", visual: "V8", exemplo: "Doca 2: 14 entradas" },
    { titulo: "Indicadores de ocupação", texto: "Quantas pessoas estão em cada área ao longo do turno.", visual: "V9", exemplo: "Ocupação: 64%" },
    { titulo: "Ocorrências", texto: "Trechos de vídeo exportados com as marcações da IA para análise.", visual: "V11", exemplo: "Trecho exportado: 00:42" },
    { titulo: "Perímetro", texto: "Aviso quando alguém cruza cercas e limites do pátio fora do horário.", visual: "V18", exemplo: "Pátio norte: 1 aviso" },
  ],
  pratica: {
    texto: TEXTO_PRATICA,
    passos: passosPadrao({ titulo: "Operação", texto: "Segurança e gestão acompanham perímetro e circulação no mesmo painel." }),
  },
  faq: [
    { p: "Funciona em galpões com pouca iluminação?", r: "O desempenho depende da câmera e da iluminação. Avaliamos cada ponto antes da implantação." },
    { p: "A leitura de placas já está disponível?", r: "Sim. A leitura de placas está disponível e é configurada conforme a necessidade de cada operação." },
    { p: "Dá para integrar com o sistema de câmeras atual?", r: "Sim. A IA é aplicada em qualquer câmera, inclusive nas que a operação já tem." },
    { p: "Os dados ficam disponíveis para quem?", r: "Apenas para os perfis autorizados pela empresa." },
  ],
  encerramento: ENCERRAMENTO_PRIVADO,
};

export default segmento;
