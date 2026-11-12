import condominios from "./condominios";
import estacionamentos from "./estacionamentos";
import industria from "./industria-e-logistica";
import restaurantes from "./restaurantes";
import setorPublico from "./setor-publico";
import shoppings from "./shoppings-e-varejo";
import type { Segmento } from "./tipos";

export type { Segmento } from "./tipos";

/** Ordem do menu, do rodapé e dos carrosséis. */
export const SEGMENTOS: Segmento[] = [shoppings, restaurantes, industria, condominios, estacionamentos, setorPublico];

export const hrefSegmento = (s: Segmento) => `/solucoes/${s.slug}`;
export const contatoSegmento = (s: Segmento) => `/contato?tipo=${s.tipo}&segmento=${s.slug}`;
export const buscarSegmento = (slug: string) => SEGMENTOS.find((s) => s.slug === slug);
