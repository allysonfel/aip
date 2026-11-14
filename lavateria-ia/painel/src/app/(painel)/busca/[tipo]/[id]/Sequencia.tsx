'use client';

import { useEffect, useState } from 'react';
import { BASE } from '@/lib/base';

/** Sequência de imagens daquele momento (cerca de 1 por segundo), tocando em loop. */
export default function Sequencia({ quadros }: { quadros: { id: number; ts: string }[] }) {
  const [i, setI] = useState(0);
  const [tocando, setTocando] = useState(true);
  useEffect(() => {
    if (!tocando || quadros.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % quadros.length), 900);
    return () => clearInterval(id);
  }, [tocando, quadros.length]);
  if (!quadros.length) return <p className="text-sm text-on-surface-variant">Sem imagens guardadas deste momento.</p>;
  const q = quadros[i];
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element -- quadro do banco */}
      <img src={`${BASE}/api/momento/${q.id}`} alt={`Imagem ${i + 1} de ${quadros.length}`} className="w-full rounded-sm bg-black object-contain" />
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <button onClick={() => setTocando((t) => !t)} className="rounded-sm border border-outline-variant px-3 py-1 text-on-surface">
          {tocando ? 'Pausar' : 'Tocar'}
        </button>
        <input type="range" min={0} max={quadros.length - 1} value={i} onChange={(e) => { setTocando(false); setI(Number(e.target.value)); }} className="flex-1" aria-label="Imagem" />
        <span className="tabular-nums text-on-surface-variant">
          {new Date(q.ts).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · {i + 1}/{quadros.length}
        </span>
      </div>
    </div>
  );
}
