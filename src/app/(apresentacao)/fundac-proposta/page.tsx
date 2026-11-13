import type { Metadata } from "next";
import Apresentacao from "./Apresentacao";

// Página oculta: sem link no site, fora do sitemap e com noindex/nofollow.
export const metadata: Metadata = {
  title: { absolute: "AIP | Fundac" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function FundacProposta() {
  return <Apresentacao />;
}
