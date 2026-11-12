import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { SITE_URL } from "./_config/contato";
import Navegacao from "./_components/Navegacao";
import Rodape from "./_components/Rodape";
import "./site-theme.css";

const barlow = Barlow({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-barlow", display: "swap" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-barlow-condensed", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "AIP — Agência de Inteligência Patrimonial", template: "%s | AIP" },
  icons: {
    icon: [
      { url: "/site/aip-icone-48.png", sizes: "48x48", type: "image/png" },
      { url: "/site/aip-icone-192.png", sizes: "192x192", type: "image/png" },
      { url: "/site/aip-icone-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/site/aip-icone-apple.png",
  },
  description: "Soluções de inteligência artificial e visão computacional aplicadas à segurança, à operação e à gestão de ambientes.",
};

// Site institucional, com <html> própria: não compartilha layout nem tema
// com o sistema em /painel e /shopping (Next.js "multiple root layouts").
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-full">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black">
          Ir para o conteúdo
        </a>
        <Navegacao />
        <main id="conteudo">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
