'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { sair } from '@/app/login/actions';
import { ThemeToggle } from './ThemeToggle';
import { LogoAIP } from './Logo';
import { IconeAtividade, IconeCamera, IconeConfig, IconePessoas, IconeSair, IconeVisaoGeral, IconeRotas, IconeBusca, IconeAlerta, IconeComparar, IconeCalendario } from './ui/icones';

// Menu no mesmo desenho do painel do Shopping Caruaru. As próximas etapas
// (pessoas, veículos, busca, validação, alertas, resumo) entram aqui.
const GRUPOS = [
  {
    titulo: 'Operação',
    abas: [
      { href: '/', label: 'Visão geral', Icone: IconeVisaoGeral },
      { href: '/ao-vivo', label: 'Câmeras ao vivo', Icone: IconeCamera },
    ],
  },
  {
    titulo: 'Análise',
    abas: [
      { href: '/pessoas', label: 'Pessoas', Icone: IconePessoas },
      { href: '/veiculos', label: 'Veículos', Icone: IconeRotas },
      { href: '/busca', label: 'Busca por características', Icone: IconeBusca },
      { href: '/resumo', label: 'Resumo do dia', Icone: IconeCalendario },
    ],
  },
  {
    titulo: 'Segurança e qualidade',
    abas: [
      { href: '/alertas', label: 'Alertas', Icone: IconeAlerta },
      { href: '/validacao', label: 'Validação de precisão', Icone: IconeComparar },
    ],
  },
  {
    titulo: 'Sistema',
    abas: [
      { href: '/motor', label: 'Uso do servidor', Icone: IconeAtividade },
      { href: '/configuracao', label: 'Configuração', Icone: IconeConfig },
    ],
  },
];

function Navegacao({ aoNavegar, alertas = 0 }: { aoNavegar?: () => void; alertas?: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4">
      {GRUPOS.map((g) => (
        <div key={g.titulo}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{g.titulo}</p>
          <div className="flex flex-col gap-0.5">
            {g.abas.map(({ href, label, Icone }) => {
              const ativa = href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={aoNavegar}
                  className={cn(
                    'relative flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors',
                    ativa
                      ? 'bg-primary-container font-semibold text-on-primary-container before:absolute before:inset-y-2 before:-left-3 before:w-[3px] before:rounded-r-full before:bg-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                  )}
                >
                  <Icone strokeWidth={ativa ? 2 : 1.75} className="shrink-0" />
                  {label}
                  {href === '/alertas' && alertas > 0 && <span className="ml-auto rounded-full bg-error px-1.5 text-[11px] font-semibold text-on-error">{alertas}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Cabecalho() {
  return (
    <div className="px-6 pb-4 pt-6">
      <LogoAIP className="h-7 text-on-surface" />
    </div>
  );
}

function Rodape({ nome }: { nome: string }) {
  return (
    <div className="border-t border-outline-variant p-4">
      <ThemeToggle />
      <div className="mb-2 min-w-0 px-1">
        <p className="truncate text-sm font-medium leading-tight text-on-surface">{nome}</p>
        <p className="truncate text-xs leading-tight text-on-surface-variant">Lavateria Fast Bezerros</p>
      </div>
      <form action={sair}>
        <button type="submit" className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface">
          <IconeSair />
          Sair
        </button>
      </form>
    </div>
  );
}

export function Menu({ nome, alertas }: { nome: string; alertas: number }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-outline-variant bg-surface lg:flex print:hidden">
      <Cabecalho />
      <Navegacao alertas={alertas} />
      <Rodape nome={nome} />
    </aside>
  );
}

export function MenuMovel({ nome, alertas }: { nome: string; alertas: number }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="lg:hidden print:hidden">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-outline-variant bg-surface/80 px-4 py-3 backdrop-blur-md">
        <LogoAIP className="h-7 text-on-surface" />
        <button onClick={() => setAberto(true)} className="rounded-sm border border-outline-variant px-3 py-1.5 text-sm text-on-surface" aria-label="Abrir menu">
          Menu
        </button>
      </div>
      {aberto && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex w-72 flex-col bg-surface">
            <Cabecalho />
            <Navegacao alertas={alertas} aoNavegar={() => setAberto(false)} />
            <Rodape nome={nome} />
          </div>
          <button className="flex-1 bg-black/40" aria-label="Fechar menu" onClick={() => setAberto(false)} />
        </div>
      )}
    </div>
  );
}
