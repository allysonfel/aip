// Período escolhido nas telas (horário de Brasília, UTC-3): Hoje, Ontem,
// Últimos 7 dias, Últimos 30 dias ou Personalizado (data inicial e final).

export type ChavePeriodo = 'hoje' | 'ontem' | '7d' | '30d' | 'personalizado';
export type Periodo = { chave: ChavePeriodo; de: string; ate: string; ini: Date; fim: Date; dias: number; rotulo: string };

export const hojeBr = () => new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
export const somaDias = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const meiaNoiteBr = (d: string) => new Date(Date.parse(`${d}T03:00:00Z`));
const valida = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : undefined);
const br = (d: string) => d.split('-').reverse().join('/');

export function lerPeriodo(sp: { p?: string; de?: string; ate?: string }): Periodo {
  const h = hojeBr();
  let chave = (['hoje', 'ontem', '7d', '30d', 'personalizado'].includes(sp.p ?? '') ? sp.p : 'hoje') as ChavePeriodo;
  let de = h;
  let ate = h;
  if (chave === 'ontem') de = ate = somaDias(h, -1);
  else if (chave === '7d') de = somaDias(h, -6);
  else if (chave === '30d') de = somaDias(h, -29);
  else if (chave === 'personalizado') {
    const a = valida(sp.de);
    const b = valida(sp.ate);
    if (a && b) [de, ate] = a <= b ? [a, b] : [b, a];
    else chave = 'hoje';
  }
  const ini = meiaNoiteBr(de);
  const fim = meiaNoiteBr(somaDias(ate, 1));
  const dias = Math.round((fim.getTime() - ini.getTime()) / 86_400_000);
  const rotulo = { hoje: 'Hoje', ontem: 'Ontem', '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias', personalizado: de === ate ? br(de) : `${br(de)} a ${br(ate)}` }[chave];
  return { chave, de, ate, ini, fim, dias, rotulo };
}

/** Rótulos do eixo dos gráficos: por hora (1 dia) ou por dia (vários dias). */
export function baldes(p: Periodo): { chave: string; rotulo: string }[] {
  if (p.dias === 1) return Array.from({ length: 24 }, (_, h) => ({ chave: String(h), rotulo: `${String(h).padStart(2, '0')}h` }));
  return Array.from({ length: p.dias }, (_, i) => {
    const d = somaDias(p.de, i);
    return { chave: d, rotulo: d.slice(8, 10) + '/' + d.slice(5, 7) };
  });
}

export const POR_PAGINA = 24;
export const lerPagina = (v?: string) => Math.max(1, Math.floor(Number(v) || 1));
