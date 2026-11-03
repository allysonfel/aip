import type { MetadataRoute } from "next";
import { SITE_URL } from "./(site)/_config/contato";

const ROTAS = ["", "/cameras-ia", "/totem-ia", "/empresas", "/setor-publico", "/tecnologia", "/sobre", "/contato", "/privacidade"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROTAS.map((rota) => ({ url: `${SITE_URL}${rota}`, priority: rota === "" ? 1 : 0.7 }));
}
