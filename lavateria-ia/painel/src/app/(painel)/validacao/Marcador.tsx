'use client';

import { useOptimistic, useTransition } from 'react';
import { marcar } from './acoes';

/** Linha de um atributo com os botões Certo / Errado. */
export function Marcador({ tipo, refId, atributo, rotulo, estimado, marcado }: { tipo: 'pessoa' | 'veiculo'; refId: number; atributo: string; rotulo: string; estimado: string; marcado?: boolean }) {
  const [, iniciar] = useTransition();
  const [valor, otimista] = useOptimistic<boolean | undefined, boolean>(marcado, (_a, b) => b);
  const clicar = (c: boolean) =>
    iniciar(async () => {
      otimista(c);
      await marcar(tipo, refId, atributo, estimado, c);
    });
  return (
    <div className="flex items-center justify-between gap-2 py-0.5 text-xs">
      <span className="text-on-surface-variant">{rotulo}</span>
      <span className="flex items-center gap-1.5">
        <span className="font-medium text-on-surface">{estimado}</span>
        <button type="button" onClick={() => clicar(true)} aria-pressed={valor === true} className={`rounded-sm border px-2 py-0.5 ${valor === true ? 'border-[var(--color-success)] bg-success-container text-on-success-container' : 'border-outline-variant text-on-surface-variant'}`}>
          certo
        </button>
        <button type="button" onClick={() => clicar(false)} aria-pressed={valor === false} className={`rounded-sm border px-2 py-0.5 ${valor === false ? 'border-error bg-error-container text-on-error-container' : 'border-outline-variant text-on-surface-variant'}`}>
          errado
        </button>
      </span>
    </div>
  );
}
