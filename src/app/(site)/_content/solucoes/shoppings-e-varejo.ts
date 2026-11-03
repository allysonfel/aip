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
    foto: "shopping-alto.jpg",
    alt: "Escadas rolantes e lojas de um shopping vistas do alto",
  },
  cartao: { foto: "shopping.jpg", alt: "Escada rolante no interior de um shopping" },
  usos: [
    { titulo: "Fluxo por entrada e corredor", texto: "Contagem de pessoas hora a hora, em cada acesso." },
    { titulo: "Mapas de calor e rotas", texto: "Onde o público circula, onde para e quais caminhos usa." },
    { titulo: "Áreas pouco movimentadas", texto: "Identificação das zonas abaixo da média e acompanhamento das ações para ativá-las." },
    { titulo: "Picos e comparativos", texto: "Horários de maior movimento e comparação entre períodos e datas comerciais." },
    { titulo: "Busca visual", texto: "Localização de pessoas nas imagens pela descrição de roupas e características, com confirmação humana." },
  ],
  pratica: {
    texto: TEXTO_PRATICA,
    passos: passosPadrao({ titulo: "Decisão", texto: "A gestão usa os dados para organizar equipes, espaços e ações comerciais." }),
  },
  faq: [
    { p: "Preciso trocar minhas câmeras?", r: "Não necessariamente. Câmeras compatíveis com RTSP podem ser usadas após avaliação técnica." },
    { p: "A contagem diferencia entrada e saída?", r: "Sim. As linhas de contagem registram a direção da passagem." },
    { p: "A AIP faz reconhecimento facial?", r: "Sim, como recurso sob projeto, configurado conforme a finalidade e os requisitos legais de cada operação. A busca visual padrão usa características como roupas e aparência geral." },
    { p: "Quem acessa os dados?", r: "Apenas usuários cadastrados, com permissões definidas por perfil." },
  ],
  encerramento: ENCERRAMENTO_PRIVADO,
};

export default segmento;
