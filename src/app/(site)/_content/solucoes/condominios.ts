import { ENCERRAMENTO_PRIVADO, passosPadrao, TEXTO_PRATICA, type Segmento } from "./tipos";

const segmento: Segmento = {
  slug: "condominios",
  nome: "Condomínios",
  tipo: "empresa",
  descricaoMenu: "Portaria, áreas comuns e garagem.",
  linhaCartao: "Acessos, circulação e áreas comuns.",
  hero: {
    titulo: "Mais segurança e informação para o condomínio.",
    texto: "Portaria, áreas comuns e garagem acompanhadas com inteligência artificial nas câmeras existentes.",
    foto: "condominio-noite.jpg",
    alt: "Torres residenciais iluminadas em volta de uma piscina, vistas do alto à noite",
  },
  cartao: { foto: "condominio-piscina.jpg", alt: "Edifício residencial moderno com piscina" },
  usos: [
    { titulo: "Áreas comuns", texto: "Ocupação de piscina, academia, salão e playground ao longo do dia." },
    { titulo: "Portaria e garagem", texto: "Registro de placas na entrada e na saída.", sobProjeto: true },
    { titulo: "Áreas restritas", texto: "Aviso de movimento em locais e horários definidos.", sobProjeto: true },
    { titulo: "Busca visual", texto: "Localização de registros nas imagens pela descrição, com confirmação humana." },
    { titulo: "Acesso por perfil", texto: "Síndico, administração e portaria veem apenas o que precisam." },
  ],
  pratica: {
    texto: TEXTO_PRATICA,
    passos: passosPadrao({ titulo: "Gestão", texto: "Síndico e administração acompanham o condomínio pelo navegador." }),
  },
  faq: [
    { p: "É preciso trocar as câmeras do condomínio?", r: "Não necessariamente. Avaliamos a compatibilidade das câmeras atuais." },
    { p: "Os moradores são identificados pelo rosto?", r: "Não. A AIP não usa reconhecimento facial." },
    { p: "Quem pode ver as imagens?", r: "Apenas os usuários cadastrados, com acesso definido por perfil." },
    { p: "Por quanto tempo as imagens ficam guardadas?", r: "O prazo de retenção é definido pelo condomínio." },
  ],
  encerramento: ENCERRAMENTO_PRIVADO,
};

export default segmento;
