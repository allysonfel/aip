import type { Atributo } from '@/lib/dados';
import { cn } from '@/lib/cn';

const pct = (c?: number) => (c == null ? '' : `${Math.round(c * 100)}%`);

/**
 * Um atributo estimado: valor + confiança. Abaixo do limiar, mostra
 * "indefinido" (sem chutar). Tudo é ESTIMATIVA, nunca identificação.
 */
export function ChipAtributo({ rotulo, a, limiar, formatar }: { rotulo: string; a?: Atributo; limiar: number; formatar?: (v: string | boolean) => string }) {
  let texto: string;
  let fraco = false;
  if (!a) {
    texto = 'indefinido';
    fraco = true;
  } else if (a.motivo) {
    texto = a.motivo;
    fraco = true;
  } else if (a.valor == null || (a.conf ?? 0) < limiar || a.acordo === false || (a.concordancia ?? 1) < 0.6) {
    texto = 'indefinido';
    fraco = true;
  } else {
    texto = formatar ? formatar(a.valor) : String(a.valor);
  }
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span className="text-on-surface-variant">{rotulo}</span>
      <span className={cn('text-right font-medium', fraco ? 'text-on-surface-variant italic' : 'text-on-surface')}>
        {texto}
        {a?.conf != null && !a.motivo && <span className="ml-1 font-normal tabular-nums text-on-surface-variant">{pct(a.conf)}</span>}
      </span>
    </div>
  );
}

export const simNao = (v: string | boolean) => (v === true ? 'sim' : 'não');
