import en from "./dicionarios/en.json";
import pt from "./dicionarios/pt.json";
import ru from "./dicionarios/ru.json";
import type { Idioma } from "./idiomas";

// Textos do site por idioma. O português é a referência: os outros precisam
// ter exatamente as mesmas chaves (o TypeScript acusa se faltar alguma).
export type Dicionario = typeof pt;

const DICIONARIOS: Record<Idioma, Dicionario> = { pt, en: en satisfies Dicionario, ru: ru satisfies Dicionario };

export const dicionario = (idioma: Idioma): Dicionario => DICIONARIOS[idioma];

/** Troca {chave} pelo valor: f("Ir para {item}", { item: "X" }). */
export function f(texto: string, valores: Record<string, string | number>): string {
  return texto.replace(/\{(\w+)\}/g, (_, k: string) => (k in valores ? String(valores[k]) : `{${k}}`));
}
