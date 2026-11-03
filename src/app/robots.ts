import type { MetadataRoute } from "next";
import { SITE_URL } from "./(site)/_config/contato";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/painel", "/shopping", "/login", "/checkin", "/trocar-senha", "/sem-acesso", "/api"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
