// Idiomas do site público. Português é o padrão e fica sem prefixo na URL
// (aipbrasil.com/sobre); inglês e russo têm prefixo (/en/sobre, /ru/sobre).
// O proxy (src/proxy.ts) atende as URLs sem prefixo como /pt/... por dentro.

export const IDIOMAS = ["pt", "en", "ru"] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const PADRAO: Idioma = "pt";

/** Cookie com a escolha de idioma (1 ano). */
export const COOKIE_IDIOMA = "AIP_LANG";
export const COOKIE_DURACAO = 60 * 60 * 24 * 365;

export const ehIdioma = (v: string | undefined | null): v is Idioma => !!v && (IDIOMAS as readonly string[]).includes(v);

/** <html lang> e hreflang. */
export const HTML_LANG: Record<Idioma, string> = { pt: "pt-BR", en: "en", ru: "ru" };
/** og:locale */
export const OG_LOCALE: Record<Idioma, string> = { pt: "pt_BR", en: "en_US", ru: "ru_RU" };
/** Formatação de números e datas (Intl). */
export const LOCALE: Record<Idioma, string> = { pt: "pt-BR", en: "en-US", ru: "ru-RU" };
/** Rótulo curto do seletor. */
export const SIGLA: Record<Idioma, string> = { pt: "PT", en: "EN", ru: "RU" };

/**
 * Caminho no idioma: "/contato" → "/contato" (pt), "/en/contato", "/ru/contato".
 * Links externos, âncoras e e-mail/WhatsApp ficam como estão.
 */
export function comIdioma(idioma: Idioma, href: string): string {
  if (idioma === PADRAO || !href.startsWith("/") || href.startsWith("//")) return href;
  if (href === "/") return `/${idioma}`;
  if (href.startsWith("/?") || href.startsWith("/#")) return `/${idioma}${href.slice(1)}`;
  return `/${idioma}${href}`;
}

/** Separa o idioma do caminho visível: "/en/sobre" → { idioma: "en", caminho: "/sobre" }. */
export function semIdioma(caminho: string): { idioma: Idioma; caminho: string } {
  const partes = caminho.split("/");
  if (partes[1] === "en" || partes[1] === "ru") {
    const resto = "/" + partes.slice(2).join("/");
    return { idioma: partes[1], caminho: resto === "/" ? "/" : resto.replace(/\/$/, "") };
  }
  return { idioma: PADRAO, caminho: caminho || "/" };
}
