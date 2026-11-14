import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import './tema.css';

export const metadata: Metadata = {
  title: 'AIP | Lavateria Fast Bezerros',
  description: 'Piloto de IA nas câmeras da Lavateria Fast Bezerros.',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  icons: { icon: '/lavateria/aip-a.png' },
};

// Fonte dos títulos, a mesma do painel do Shopping Caruaru.
const fonteTitulo = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-titulo', display: 'swap' });

// Tema salvo (claro/escuro) antes da primeira pintura, como no painel do shopping.
const SCRIPT_TEMA = `try{if(localStorage.getItem('aip-theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className={`tema-shopping ${fonteTitulo.variable}`}>{children}</body>
    </html>
  );
}
