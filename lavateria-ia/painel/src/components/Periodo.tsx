import Link from 'next/link';
import type { Periodo } from '@/lib/periodo';
import { cn } from '@/lib/cn';

const OPCOES: [string, string][] = [['hoje', 'Hoje'], ['ontem', 'Ontem'], ['7d', 'Últimos 7 dias'], ['30d', 'Últimos 30 dias']];

/** Filtro de período (mantém os outros filtros da tela). */
export function FiltroPeriodo({ caminho, periodo, manter = {} }: { caminho: string; periodo: Periodo; manter?: Record<string, string | undefined> }) {
  const extras = Object.entries(manter).filter(([, v]) => v);
  const href = (p: string) => `${caminho}?${new URLSearchParams([['p', p], ...(extras as [string, string][])]).toString()}`;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
      {OPCOES.map(([k, t]) => (
        <Link key={k} href={href(k)} className={cn('rounded-sm border px-3 py-1.5', periodo.chave === k ? 'border-primary bg-primary-container font-semibold text-on-primary-container' : 'border-outline-variant text-on-surface')}>
          {t}
        </Link>
      ))}
      <form action={caminho} className={cn('flex flex-wrap items-center gap-1.5 rounded-sm border px-2 py-1', periodo.chave === 'personalizado' ? 'border-primary bg-primary-container' : 'border-outline-variant')}>
        <input type="hidden" name="p" value="personalizado" />
        {extras.map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <span className="text-on-surface-variant">Personalizado</span>
        <input type="date" name="de" defaultValue={periodo.de} aria-label="Data inicial" className="rounded-sm border border-outline-variant bg-surface px-1.5 py-0.5 text-on-surface" />
        <span className="text-on-surface-variant">a</span>
        <input type="date" name="ate" defaultValue={periodo.ate} aria-label="Data final" className="rounded-sm border border-outline-variant bg-surface px-1.5 py-0.5 text-on-surface" />
        <button className="rounded-sm bg-primary px-2.5 py-0.5 font-semibold text-on-primary">Ver</button>
      </form>
    </div>
  );
}
