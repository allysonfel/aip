import { lang } from "next/root-params";
import { dicionario } from "./dicionario";
import { comIdioma, ehIdioma, PADRAO, type Idioma } from "./idiomas";

/** Idioma da página atual (segmento [lang] da rota), para Server Components. */
export async function idiomaAtual(): Promise<Idioma> {
  const v = await lang();
  return ehIdioma(v) ? v : PADRAO;
}

/** Idioma, dicionário e um atalho para links no idioma: `const { d, l } = await i18n()`. */
export async function i18n() {
  const idioma = await idiomaAtual();
  return { idioma, d: dicionario(idioma), l: (href: string) => comIdioma(idioma, href) };
}
