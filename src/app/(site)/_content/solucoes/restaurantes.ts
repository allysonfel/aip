import { ENCERRAMENTO_PRIVADO, passosPadrao, TEXTO_PRATICA, type Segmento } from "./tipos";

const segmento: Segmento = {
  slug: "restaurantes",
  nome: "Restaurantes",
  tipo: "empresa",
  descricaoMenu: "Inteligência para gestão de restaurantes.",
  linhaCartao: "Entenda o fluxo e a ocupação do salão.",
  hero: {
    titulo: "Entenda o movimento do seu restaurante.",
    texto: "Acompanhe a ocupação do salão, identifique horários de pico e transforme imagens em informações para sua operação.",
    foto: "restaurante-salao.jpg",
    alt: "Salão de restaurante com mesas postas e iluminação quente",
  },
  cartao: { foto: "restaurante-mesas.jpg", alt: "Mesas e cadeiras de madeira de um restaurante vistas do alto" },
  usos: [
    { titulo: "Ocupação do salão", texto: "Acompanhe quais áreas estão ocupadas e como o espaço é utilizado." },
    { titulo: "Fluxo de pessoas", texto: "Identifique o movimento de entrada e saída por horário." },
    { titulo: "Mapas de calor", texto: "Visualize as áreas de maior circulação e os espaços pouco utilizados." },
    { titulo: "Horários de pico", texto: "Compare períodos e identifique padrões de movimento ao longo do dia." },
    { titulo: "Busca visual", texto: "Localize registros por características de roupas e aparência, com confirmação humana." },
  ],
  pratica: {
    texto: TEXTO_PRATICA,
    passos: passosPadrao({ titulo: "Análise", texto: "Consulte indicadores e compare períodos para orientar decisões sobre a operação." }),
  },
  faq: [
    { p: "Preciso trocar as câmeras do restaurante?", r: "Não. A IA é aplicada em qualquer câmera, inclusive nas que o restaurante já tem." },
    { p: "É possível identificar pessoas por reconhecimento facial?", r: "Sim, como recurso sob projeto, mediante definição de finalidade, avaliação de necessidade e atendimento aos requisitos legais de proteção de dados." },
    { p: "Consigo identificar os horários de maior movimento?", r: "Sim. A plataforma acompanha o fluxo por horário e permite comparar períodos para identificar padrões de movimento." },
    { p: "Como acesso as informações do restaurante?", r: "Os indicadores ficam disponíveis em um painel pelo navegador, com acesso controlado por perfil de usuário." },
  ],
  encerramento: ENCERRAMENTO_PRIVADO,
};

export default segmento;
