import type { Metadata } from "next";
import Apresentacao from "./Apresentacao";

// Página oculta: sem link no site, fora do sitemap e com noindex/nofollow
// (o layout do grupo já marca robots; repetido aqui por segurança).
export const metadata: Metadata = {
  title: { absolute: "AIP | Santa Joana" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function SantaJoanaProposta() {
  return <Apresentacao />;
}
