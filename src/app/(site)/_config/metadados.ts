import type { Metadata } from "next";
import { comIdioma, HTML_LANG, IDIOMAS, OG_LOCALE, type Idioma } from "../_i18n/idiomas";
import { SITE_URL } from "./contato";

/** Endereço completo de uma página num idioma. */
export function urlNoIdioma(idioma: Idioma, caminho: string) {
  const c = comIdioma(idioma, caminho);
  return `${SITE_URL}${c === "/" ? "" : c}`;
}

/** hreflang: as três versões e x-default apontando para o inglês. */
export function alternativas(caminho: string): Record<string, string> {
  const mapa: Record<string, string> = {};
  for (const i of IDIOMAS) mapa[HTML_LANG[i]] = urlNoIdioma(i, caminho);
  mapa["x-default"] = urlNoIdioma("en", caminho);
  return mapa;
}

type Imagem = { url: string; width: number; height: number; alt: string };

// title, description, canonical, hreflang e Open Graph de cada página, num formato só.
// `tituloAbsoluto`: sem o " | AIP" do modelo (página inicial).
export function metadados(idioma: Idioma, caminho: string, titulo: string, descricao: string, opcoes: { tituloAbsoluto?: boolean; imagem?: Imagem; marca?: string } = {}): Metadata {
  const imagem = opcoes.imagem ?? { url: "/site/media/og.jpg", width: 1200, height: 630, alt: opcoes.marca ?? "AIP" };
  const tituloOg = opcoes.tituloAbsoluto ? titulo : `${titulo} | AIP`;
  return {
    title: opcoes.tituloAbsoluto ? { absolute: titulo } : titulo,
    description: descricao,
    alternates: { canonical: urlNoIdioma(idioma, caminho), languages: alternativas(caminho) },
    openGraph: {
      title: tituloOg,
      description: descricao,
      url: urlNoIdioma(idioma, caminho),
      siteName: "AIP",
      locale: OG_LOCALE[idioma],
      alternateLocale: IDIOMAS.filter((i) => i !== idioma).map((i) => OG_LOCALE[i]),
      type: "website",
      images: [imagem],
    },
    twitter: { card: "summary_large_image", title: tituloOg, description: descricao, images: [{ url: imagem.url, alt: imagem.alt }] },
  };
}
