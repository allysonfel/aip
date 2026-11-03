import type { MetadataRoute } from "next";
import { SITE_URL } from "./(site)/_config/contato";
import { hrefSegmento, SEGMENTOS } from "./(site)/_content/solucoes";

const ROTAS = ["", "/cameras-ia", "/totem-ia", ...SEGMENTOS.map(hrefSegmento), "/tecnologia", "/sobre", "/contato", "/privacidade"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROTAS.map((rota) => ({ url: `${SITE_URL}${rota}`, priority: rota === "" ? 1 : 0.7 }));
}
