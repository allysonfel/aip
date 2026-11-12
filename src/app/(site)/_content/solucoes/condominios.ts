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
    foto: "condominio-torre.jpg",
    alt: "Torre residencial de alto padrão com área de lazer e piscina, vista do alto",
  },
  cartao: { foto: "condominio-torre.jpg", alt: "Torre residencial de alto padrão com área de lazer e piscina, vista do alto" },
  usos: [
    { titulo: "Perímetro e muros", texto: "Aviso quando alguém cruza muros, cercas e limites definidos.", visual: "V18", exemplo: "Muro lateral: 1 aviso" },
    { titulo: "Permanência suspeita", texto: "Aviso quando alguém permanece tempo demais perto do portão ou da garagem.", visual: "V19", exemplo: "Portão: 6 min" },
    { titulo: "Áreas comuns", texto: "Ocupação de piscina, academia, salão e playground ao longo do dia.", visual: "V10", exemplo: "Piscina: 72% às 16h" },
    { titulo: "Portaria e garagem", texto: "Registro de placas na entrada e na saída.", visual: "V8", exemplo: "Entrada: 08:14" },
    { titulo: "Áreas restritas", texto: "Aviso de movimento em locais e horários definidos.", visual: "V7", exemplo: "Casa de máquinas: 1 aviso" },
    { titulo: "Busca visual", texto: "Localização de registros nas imagens pela descrição, com confirmação humana.", visual: "V5", exemplo: "2 registros encontrados" },
    { titulo: "Acesso por perfil", texto: "Síndico, administração e portaria veem apenas o que precisam.", visual: "V12", exemplo: "3 perfis" },
  ],
  pratica: {
    texto: TEXTO_PRATICA,
    passos: passosPadrao({ titulo: "Gestão", texto: "Síndico e administração acompanham o condomínio pelo navegador." }),
  },
  faq: [
    { p: "É preciso trocar as câmeras do condomínio?", r: "Não. A IA é aplicada em qualquer câmera, inclusive nas que o condomínio já tem." },
    { p: "A AIP faz reconhecimento facial?", r: "Sim, sob projeto. A AIP pode identificar pessoas pelo rosto, mediante avaliação técnica e jurídica, conforme a finalidade e a legislação aplicável. Também é possível localizar pessoas por características como roupas e cores." },
    { p: "Quem pode ver as imagens?", r: "Apenas os usuários cadastrados, com acesso definido por perfil." },
    { p: "Por quanto tempo as imagens ficam guardadas?", r: "O prazo de retenção é definido pelo condomínio." },
  ],
  encerramento: ENCERRAMENTO_PRIVADO,
};

export default segmento;
