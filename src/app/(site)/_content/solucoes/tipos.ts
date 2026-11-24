import type { VisualId } from "../../_components/MiniVisuais";

// Modelo de uma página de Soluções. Os textos ficam nos dicionários
// (_i18n/dicionarios/*.json, em "segmentos"); aqui ficam só fotos, mini
// gráficos e marcações que valem para todos os idiomas (ver index.ts).

export type Passo = { titulo: string; texto: string };

export type Uso = {
  titulo: string;
  texto: string;
  visual: VisualId;
  exemplo: string;
  sobProjeto?: boolean;
  /** valor do mini gráfico (medidor em %, contador de pessoas), igual em todos os idiomas */
  pct?: number;
  alvo?: number;
};

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
  /** Cards de "Como a tecnologia é usada". */
  usos: Uso[];
  pratica: { texto: string; passos: Passo[] };
  /** Bloco "Governança e responsabilidade", antes do FAQ (só setor público). */
  governanca?: { texto: string; itens: string[] };
  faq: { p: string; r: string }[];
  encerramento: { titulo: string; texto: string; cta: string };
};
