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
    foto: "restaurante-salao-premium.jpg",
    alt: "Salão de restaurante elegante com mesas postas, flores e iluminação suave",
  },
  cartao: { foto: "restaurante-salao-premium.jpg", alt: "Salão de restaurante elegante com mesas postas, flores e iluminação suave" },
  usos: [
    { titulo: "Ocupação do salão", texto: "Acompanhe quais áreas estão ocupadas e como o espaço é utilizado.", visual: "V13", exemplo: "Salão: 18 de 24 mesas" },
    { titulo: "Fluxo de pessoas", texto: "Identifique o movimento de entrada e saída por horário.", visual: "V1", exemplo: "Pico de entrada: 20h" },
    { titulo: "Mapas de calor", texto: "Visualize as áreas de maior circulação e os espaços pouco utilizados.", visual: "V2", exemplo: "Varanda: área mais usada" },
    { titulo: "Horários de pico", texto: "Compare períodos e identifique padrões de movimento ao longo do dia.", visual: "V4", exemplo: "Sábado: +46%" },
    { titulo: "Busca visual", texto: "Localize registros por características de roupas e aparência, com confirmação humana.", visual: "V5", exemplo: "1 registro encontrado" },
  ],
  pratica: {
    texto: TEXTO_PRATICA,
    passos: passosPadrao({ titulo: "Análise", texto: "Consulte indicadores e compare períodos para orientar decisões sobre a operação." }),
  },
  faq: [
    { p: "Preciso trocar as câmeras do restaurante?", r: "Não. A IA é aplicada em qualquer câmera, inclusive nas que o restaurante já tem." },
    { p: "É possível identificar pessoas por reconhecimento facial?", r: "Sim. A AIP identifica pessoas pelo rosto, com avaliação técnica e jurídica de cada aplicação, conforme a finalidade e a legislação aplicável. Também é possível localizar pessoas por características como roupas e cores." },
    { p: "Consigo identificar os horários de maior movimento?", r: "Sim. A plataforma acompanha o fluxo por horário e permite comparar períodos para identificar padrões de movimento." },
    { p: "Como acesso as informações do restaurante?", r: "Os indicadores ficam disponíveis em um painel pelo navegador, com acesso controlado por perfil de usuário." },
  ],
  encerramento: ENCERRAMENTO_PRIVADO,
};

export default segmento;
