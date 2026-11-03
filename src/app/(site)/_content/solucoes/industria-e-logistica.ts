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
    foto: "armazem.jpg",
    alt: "Corredor de prateleiras em um armazém",
  },
  cartao: { foto: "industria-patio.jpg", alt: "Empilhadeiras em um pátio operacional vistas do alto" },
  usos: [
    { titulo: "Circulação em áreas operacionais", texto: "Contagem e acompanhamento de pessoas por área e período." },
    { titulo: "Áreas restritas", texto: "Aviso de presença em locais e horários definidos.", sobProjeto: true },
    { titulo: "Controle de veículos", texto: "Leitura de placas em portarias e docas.", sobProjeto: true },
    { titulo: "Indicadores de ocupação", texto: "Quantas pessoas estão em cada área ao longo do turno." },
    { titulo: "Ocorrências", texto: "Trechos de vídeo exportados com as marcações da IA para análise." },
  ],
  pratica: {
    texto: TEXTO_PRATICA,
    passos: passosPadrao({ titulo: "Operação", texto: "Segurança e gestão acompanham perímetro e circulação no mesmo painel." }),
  },
  faq: [
    { p: "Funciona em galpões com pouca iluminação?", r: "O desempenho depende da câmera e da iluminação. Avaliamos cada ponto antes da implantação." },
    { p: "A leitura de placas já está disponível?", r: "É um recurso sob projeto, definido conforme a necessidade de cada operação." },
    { p: "Dá para integrar com o sistema de câmeras atual?", r: "Sim, quando as câmeras ou o gravador são compatíveis com RTSP." },
    { p: "Os dados ficam disponíveis para quem?", r: "Apenas para os perfis autorizados pela empresa." },
  ],
  encerramento: ENCERRAMENTO_PRIVADO,
};

export default segmento;
