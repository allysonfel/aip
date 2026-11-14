import Link from 'next/link';
import { cn } from '@/lib/cn';

/** Navegação por páginas: anterior, 1, 2, 3 ... próxima (mantém os filtros). */
export function Paginacao({ caminho, pagina, total, porPagina, params }: { caminho: string; pagina: number; total: number; porPagina: number; params: Record<string, string | undefined> }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (paginas <= 1) return null;
  const href = (n: number) => {
    const q = new URLSearchParams(Object.entries({ ...params, pag: String(n) }).filter(([, v]) => v) as [string, string][]);
    return `${caminho}?${q.toString()}`;
  };
  const nums = new Set<number>([1, paginas, pagina - 2, pagina - 1, pagina, pagina + 1, pagina + 2].filter((n) => n >= 1 && n <= paginas));
  const lista = [...nums].sort((a, b) => a - b);
  const item = 'min-w-9 rounded-sm border px-3 py-1.5 text-center text-sm';
  return (
    <nav aria-label="Páginas" className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
      {pagina > 1 ? <Link href={href(pagina - 1)} className={cn(item, 'border-outline-variant text-on-surface')}>Anterior</Link> : <span className={cn(item, 'border-outline-variant text-on-surface-variant opacity-50')}>Anterior</span>}
      {lista.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - lista[i - 1] > 1 && <span className="px-1 text-on-surface-variant">…</span>}
          <Link href={href(n)} aria-current={n === pagina ? 'page' : undefined} className={cn(item, n === pagina ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant text-on-surface')}>
            {n}
          </Link>
        </span>
      ))}
      {pagina < paginas ? <Link href={href(pagina + 1)} className={cn(item, 'border-outline-variant text-on-surface')}>Próxima</Link> : <span className={cn(item, 'border-outline-variant text-on-surface-variant opacity-50')}>Próxima</span>}
      <span className="ml-2 text-xs text-on-surface-variant">{total} no total</span>
    </nav>
  );
}
