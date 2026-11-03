import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./site-theme.css";

// Fonte dos títulos e números de destaque, a mesma do painel do shopping. O
// texto corrido fica na fonte do sistema (ver site-theme.css).
const fonteTitulo = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-titulo", display: "swap" });

// "/" é a LP institucional da AIP, com seções alternando claro e escuro
// (ver site-theme.css), isolada do sistema em /painel: por isso tem <html> própria aqui, sem compartilhar layout com o
// resto do app (ver Next.js "multiple root layouts").
export const metadata: Metadata = {
  title: "AIP | Logos Company",
  description:
    "Ponto com IA, dispositivos no mapa, câmeras com IA e alertas em tempo real, numa única plataforma.",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fonteTitulo.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
