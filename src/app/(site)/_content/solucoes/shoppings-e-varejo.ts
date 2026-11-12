import { ENCERRAMENTO_PRIVADO, passosPadrao, TEXTO_PRATICA, type Segmento } from "./tipos";

const segmento: Segmento = {
  slug: "shoppings-e-varejo",
  nome: "Shoppings e varejo",
  tipo: "empresa",
  descricaoMenu: "Fluxo, mapas de calor e áreas pouco movimentadas.",
  linhaCartao: "Fluxo de pessoas, ocupação e circulação.",
  hero: {
    titulo: "Inteligência artificial para entender a circulação.",
    texto: "Saiba quantas pessoas entram, por onde circulam e onde o movimento diminui, usando as câmeras que já existem.",
    foto: "shopping-escadas.jpg",
    alt: "Átrio de um shopping com curvas e escadas rolantes, visto de cima",
  },
  cartao: { foto: "shopping-escadas.jpg", alt: "Átrio de um shopping com curvas e escadas rolantes, visto de cima" },
  usos: [
    { titulo: "Fluxo por entrada e corredor", texto: "Contagem de pessoas hora a hora, em cada acesso.", visual: "V1", exemplo: "1.248 entradas/dia" },
    { titulo: "Mapas de calor e rotas", texto: "Onde o público circula, onde para e quais caminhos usa.", visual: "V2", exemplo: "Corredor B: 42% do fluxo" },
    { titulo: "Áreas pouco movimentadas", texto: "Identificação das zonas abaixo da média e acompanhamento das ações para ativá-las.", visual: "V3", exemplo: "Ala sul: -38%" },
    { titulo: "Picos e comparativos", texto: "Horários de maior movimento e comparação entre períodos e datas comerciais.", visual: "V4", exemplo: "Pico: 18h" },
    { titulo: "Busca visual", texto: "Localização de pessoas nas imagens pela descrição de roupas e características, com confirmação humana.", visual: "V5", exemplo: "3 registros encontrados" },
    { titulo: "Aglomerações", texto: "Identificação de aglomerações em praças de evento e corredores, com aviso às equipes.", visual: "V17", exemplo: "Praça de eventos: aviso", sobProjeto: true },
  ],
  pratica: {
    texto: TEXTO_PRATICA,
    passos: passosPadrao({ titulo: "Decisão", texto: "A gestão usa os dados para organizar equipes, espaços e ações comerciais." }),
  },
  faq: [
    { p: "Preciso trocar minhas câmeras?", r: "Não. A IA é aplicada em qualquer câmera, inclusive nas que você já tem." },
    { p: "A contagem diferencia entrada e saída?", r: "Sim. As linhas de contagem registram a direção da passagem." },
    { p: "A AIP faz reconhecimento facial?", r: "Sim, sob projeto. A AIP pode identificar pessoas pelo rosto, mediante avaliação técnica e jurídica, conforme a finalidade e a legislação aplicável. Também é possível localizar pessoas por características como roupas e cores." },
    { p: "Quem acessa os dados?", r: "Apenas usuários cadastrados, com permissões definidas por perfil." },
  ],
  encerramento: ENCERRAMENTO_PRIVADO,
};

export default segmento;
