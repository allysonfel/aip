import type { VisualId } from "../../_components/MiniVisuais";
import { dicionario } from "../../_i18n/dicionario";
import { PADRAO, type Idioma } from "../../_i18n/idiomas";
import type { Segmento } from "./tipos";

export type { Segmento } from "./tipos";

// Páginas de Soluções. Para criar um segmento novo: inclua aqui a base
// (foto, mini gráficos) e os textos em "segmentos" nos três dicionários.

type Base = {
  slug: keyof ReturnType<typeof dicionario>["segmentos"];
  tipo: "empresa" | "publico";
  foto: string;
  /** mini gráfico de cada uso, na ordem dos usos do dicionário */
  visuais: VisualId[];
  sobProjeto?: number[];
  valores?: Record<number, { pct?: number; alvo?: number }>;
};

/** Ordem do menu, do rodapé e dos carrosséis. */
const BASE: Base[] = [
  { slug: "shoppings-e-varejo", tipo: "empresa", foto: "shopping-escadas.jpg", visuais: ["V1", "V2", "V3", "V4", "V5", "V17"], sobProjeto: [5] },
  { slug: "industria-e-logistica", tipo: "empresa", foto: "industria-fabrica.jpg", visuais: ["V21", "V20", "V7", "V8", "V9", "V11", "V18"], valores: { 4: { pct: 64 } } },
  { slug: "condominios", tipo: "empresa", foto: "condominio-torre.jpg", visuais: ["V18", "V19", "V10", "V8", "V7", "V5", "V12"] },
  { slug: "restaurantes", tipo: "empresa", foto: "restaurante-salao-premium.jpg", visuais: ["V13", "V1", "V2", "V4", "V5"] },
  { slug: "setor-publico", tipo: "publico", foto: "praca-aerea.jpg", visuais: ["V15", "V17", "V18", "V16", "V8", "V14", "V11", "V4"], sobProjeto: [0, 1], valores: { 3: { alvo: 1540 } } },
];

export const SLUGS: string[] = BASE.map((b) => b.slug);

/** Segmentos completos (base + textos) num idioma. */
export function segmentos(idioma: Idioma = PADRAO): Segmento[] {
  const d = dicionario(idioma);
  return BASE.map((b) => {
    const t = d.segmentos[b.slug];
    const publico = "pratica" in t ? t : null;
    const ultimo = "ultimoPasso" in t ? t.ultimoPasso : null;
    return {
      slug: b.slug,
      nome: t.nome,
      tipo: b.tipo,
      descricaoMenu: t.descricaoMenu,
      linhaCartao: t.linhaCartao,
      hero: { titulo: t.heroTitulo, texto: t.heroTexto, foto: b.foto, alt: t.alt },
      cartao: { foto: b.foto, alt: t.alt },
      usos: t.usos.map((u, i) => ({ ...u, visual: b.visuais[i], sobProjeto: b.sobProjeto?.includes(i) || undefined, ...b.valores?.[i] })),
      pratica: publico ? { texto: publico.pratica, passos: publico.passos } : { texto: d.segmento.textoPratica, passos: [...d.segmento.passosPadrao, ...(ultimo ? [ultimo] : [])] },
      governanca: publico?.governanca,
      faq: t.faq,
      encerramento: publico?.encerramento ?? d.segmento.encerramentoPrivado,
    };
  });
}

export const hrefSegmento = (s: { slug: string }) => `/solucoes/${s.slug}`;
export const contatoSegmento = (s: Segmento) => `/contato?tipo=${s.tipo}&segmento=${s.slug}`;
export const buscarSegmento = (slug: string, idioma: Idioma = PADRAO) => segmentos(idioma).find((s) => s.slug === slug);
export const ehSegmento = (slug: string) => SLUGS.includes(slug);
