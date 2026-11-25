import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, Roboto, Roboto_Condensed } from "next/font/google";
import { notFound } from "next/navigation";
import { SITE_URL } from "../_config/contato";
import Navegacao from "../_components/Navegacao";
import Rodape from "../_components/Rodape";
import { ProvedorIdioma } from "../_i18n/Contexto";
import { dicionario } from "../_i18n/dicionario";
import { ehIdioma, HTML_LANG, IDIOMAS } from "../_i18n/idiomas";
import "../site-theme.css";

const barlow = Barlow({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-barlow", display: "swap" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-barlow-condensed", display: "swap" });
// A Barlow não tem cirílico: nas páginas em russo o tema troca para a Roboto
// (ver html:lang(ru) em site-theme.css). Sem preload: só baixa se for usada.
const cirilico = Roboto({ subsets: ["cyrillic", "latin"], variable: "--font-cirilico", display: "swap", preload: false });
const cirilicoTitulo = Roboto_Condensed({ subsets: ["cyrillic", "latin"], variable: "--font-cirilico-titulo", display: "swap", preload: false });

export const dynamicParams = false;
export function generateStaticParams() {
  return IDIOMAS.map((lang) => ({ lang }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "AIP", template: "%s | AIP" },
  icons: {
    icon: [
      { url: "/site/aip-icone-48.png", sizes: "48x48", type: "image/png" },
      { url: "/site/aip-icone-192.png", sizes: "192x192", type: "image/png" },
      { url: "/site/aip-icone-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/site/aip-icone-apple.png",
  },
};

// Site institucional, com <html> própria: não compartilha layout nem tema
// com o sistema em /painel e /shopping (Next.js "multiple root layouts").
// O segmento [lang] é o idioma (pt, en, ru); o português é servido sem
// prefixo pelo proxy (src/proxy.ts).
export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!ehIdioma(lang)) notFound();
  const d = dicionario(lang);
  return (
    <html lang={HTML_LANG[lang]} data-scroll-behavior="smooth" className={`${barlow.variable} ${barlowCondensed.variable} ${cirilico.variable} ${cirilicoTitulo.variable}`}>
      <body className="min-h-full">
        {/* Altura da tela medida uma vez (--vh-fixo = 1% dela). No navegador do Instagram a barra de baixo
            some e volta durante a rolagem e muda o svh: as seções de tela cheia mudavam de altura e a página
            "pulava". Só remede quando a largura muda (girar o celular) ou fora do toque (janela do computador). */}
        <script
          dangerouslySetInnerHTML={{
            __html: "(function(){var r=document.documentElement,w=innerWidth,t=matchMedia('(pointer:coarse)').matches;function m(){r.style.setProperty('--vh-fixo',innerHeight/100+'px')}m();addEventListener('resize',function(){if(!t||innerWidth!==w){w=innerWidth;m()}})})()",
          }}
        />
        <ProvedorIdioma idioma={lang}>
          <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black">
            {d.comum.pularConteudo}
          </a>
          <Navegacao />
          <main id="conteudo">{children}</main>
          <Rodape />
        </ProvedorIdioma>
      </body>
    </html>
  );
}
