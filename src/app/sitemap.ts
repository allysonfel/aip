import type { MetadataRoute } from "next";
import { alternativas, urlNoIdioma } from "./(site)/_config/metadados";
import { hrefSegmento, SLUGS } from "./(site)/_content/solucoes";
import { IDIOMAS } from "./(site)/_i18n/idiomas";

// Páginas públicas nos três idiomas (pt sem prefixo, /en e /ru), cada uma
// com as versões alternativas (hreflang). As páginas ocultas ficam de fora.
const ROTAS = ["/", "/cameras-ia", "/totem-ia", ...SLUGS.map((slug) => hrefSegmento({ slug })), "/sobre", "/contato", "/privacidade"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROTAS.flatMap((rota) =>
    IDIOMAS.map((idioma) => ({
      url: urlNoIdioma(idioma, rota),
      priority: rota === "/" ? 1 : 0.7,
      alternates: { languages: alternativas(rota) },
    })),
  );
}
