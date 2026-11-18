import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { SITE_URL } from "../(site)/_config/contato";
import "./documento.css";

const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-barlow", display: "block" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-barlow-condensed", display: "block" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  icons: {
    icon: [
      { url: "/site/aip-icone-48.png", sizes: "48x48", type: "image/png" },
      { url: "/site/aip-icone-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/site/aip-icone-apple.png",
  },
};

// Documentos comerciais em páginas A4 (para virar PDF). Páginas ocultas: sem
// link no site, fora do sitemap, noindex. <html> própria, sem menu nem rodapé
// do site (Next.js "multiple root layouts"), sem animação: tudo visível no PDF.
export default function DocumentoLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="doc">{children}</body>
    </html>
  );
}
