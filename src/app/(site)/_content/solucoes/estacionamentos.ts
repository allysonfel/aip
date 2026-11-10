import { ENCERRAMENTO_PRIVADO, passosPadrao, TEXTO_PRATICA, type Segmento } from "./tipos";

const segmento: Segmento = {
  slug: "estacionamentos",
  nome: "Estacionamentos",
  tipo: "empresa",
  descricaoMenu: "Entradas, saídas e uso das vagas.",
  linhaCartao: "Fluxo de veículos e ocupação.",
  hero: {
    titulo: "Fluxo e ocupação do estacionamento em tempo real.",
    texto: "Acompanhe entradas, saídas e uso das vagas com inteligência artificial.",
    foto: "estacionamento-aereo.jpg",
    alt: "Estacionamento com carros nas vagas, visto do alto",
  },
  cartao: { foto: "estacionamento.jpg", alt: "Estacionamento subterrâneo vazio" },
  usos: [
    { titulo: "Fluxo de entrada e saída", texto: "Contagem de passagens por horário." },
    { titulo: "Ocupação por área", texto: "Acompanhamento do uso dos setores ao longo do dia." },
    { titulo: "Análise por período", texto: "Comparação entre dias, semanas e datas de pico." },
    { titulo: "Leitura de placas", texto: "Registro de veículos na entrada e na saída.", sobProjeto: true },
  ],
  pratica: {
    texto: TEXTO_PRATICA,
    passos: passosPadrao({ titulo: "Gestão", texto: "Dados para dimensionar equipe, sinalização e operação de pico." }),
  },
  faq: [
    { p: "A leitura de placas já está disponível?", r: "É um recurso sob projeto, configurado conforme cada estacionamento." },
    { p: "Funciona à noite?", r: "Depende da câmera e da iluminação de cada ponto." },
    { p: "Preciso de câmeras novas?", r: "Não. A IA é aplicada em qualquer câmera, inclusive nas que o estacionamento já tem." },
  ],
  encerramento: ENCERRAMENTO_PRIVADO,
};

export default segmento;
