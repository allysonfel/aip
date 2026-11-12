import type { VisualId } from "../../_components/MiniVisuais";

// Modelo de uma página de Soluções. Para criar um segmento novo, copie um
// dos arquivos desta pasta, ajuste o conteúdo e inclua-o em index.ts.

export type Passo = { titulo: string; texto: string };

export type Segmento = {
  slug: string;
  nome: string;
  /** Preenche "Tipo de organização" no formulário de contato. */
  tipo: "empresa" | "publico";
  /** Linha curta embaixo do nome, no menu. */
  descricaoMenu: string;
  /** Linha do cartão no carrossel da página inicial. */
  linhaCartao: string;
  hero: { titulo: string; texto: string; foto: string; alt: string };
  /** Foto do cartão nos carrosséis (página inicial e "outros segmentos"). */
  cartao: { foto: string; alt: string };
  /** Cards de "Como a tecnologia é usada": mini-visual (V1 a V14) e um dado de exemplo. */
  usos: { titulo: string; texto: string; visual: VisualId; exemplo: string; sobProjeto?: boolean }[];
  pratica: { texto: string; passos: Passo[] };
  /** Bloco "Governança e responsabilidade", antes do FAQ (só setor público). */
  governanca?: { texto: string; itens: string[] };
  faq: { p: string; r: string }[];
  encerramento: { titulo: string; texto: string; cta: string };
};

/** Os três primeiros passos são iguais nos segmentos privados; muda o quarto. */
export function passosPadrao(ultimo: Passo): Passo[] {
  return [
    { titulo: "Conexão", texto: "Integramos as câmeras atuais pelo gravador (NVR), sem trocar equipamento quando há compatibilidade." },
    { titulo: "Calibração", texto: "Desenhamos linhas de contagem e zonas sobre a imagem de cada câmera." },
    { titulo: "Indicadores", texto: "Fluxo, ocupação e mapas de calor passam a aparecer no painel em tempo real." },
    ultimo,
  ];
}

export const TEXTO_PRATICA = "Implantação sobre a estrutura existente, com resultados no painel desde os primeiros dias.";

export const ENCERRAMENTO_PRIVADO = {
  titulo: "Sua estrutura de câmeras pode oferecer mais informações para o negócio.",
  texto: "Conte um pouco sobre sua necessidade e nossa equipe entrará em contato.",
  cta: "Solicitar demonstração",
};
