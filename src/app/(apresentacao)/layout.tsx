import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { SITE_URL } from "../(site)/_config/contato";
import "../(site)/site-theme.css";
import "./apresentacao.css";

const barlow = Barlow({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-barlow", display: "swap" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-barlow-condensed", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  icons: {
    icon: [
      { url: "/site/aip-icone-48.png", sizes: "48x48", type: "image/png" },
      { url: "/site/aip-icone-192.png", sizes: "192x192", type: "image/png" },
      { url: "/site/aip-icone-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/site/aip-icone-apple.png",
  },
};

// Apresentações comerciais exclusivas (páginas ocultas, fora do menu e do
// sitemap). Mesma identidade do site, mas sem navegação nem rodapé: cada
// slide ocupa a tela inteira. <html> própria (Next.js "multiple root layouts").
export default function ApresentacaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`apresentacao ${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
