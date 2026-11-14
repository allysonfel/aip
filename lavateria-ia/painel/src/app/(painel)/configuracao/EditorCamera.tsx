'use client';

import { useRef, useState } from 'react';
import { BASE } from '@/lib/base';
import type { CameraInfo } from '@/lib/dados';
import { salvarCamera } from './acoes';

type Ponto = [number, number];
const PADRAO: { a: Ponto; b: Ponto } = { a: [0.3, 0.5], b: [0.7, 0.5] };

/** Quadro atual da câmera com a linha de contagem arrastável por cima. */
export default function EditorCamera({ cam }: { cam: CameraInfo }) {
  const [linha, setLinha] = useState(cam.linha ?? PADRAO);
  const [tipo, setTipo] = useState<string>(cam.tipo_linha ?? '');
  const [arrastando, setArrastando] = useState<'a' | 'b' | null>(null);
  const [salvo, setSalvo] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const proporcao = cam.largura && cam.altura ? cam.largura / cam.altura : 704 / 480;

  const mover = (e: React.PointerEvent) => {
    if (!arrastando || !caixa.current) return;
    const r = caixa.current.getBoundingClientRect();
    const p: Ponto = [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
    setLinha((l) => ({ ...l, [arrastando]: [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000] }));
    setSalvo(false);
  };

  // Seta para o lado "A" (no motor: fim do lado negativo do produto vetorial).
  const [ax, ay] = linha.a;
  const [bx, by] = linha.b;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const vx = (bx - ax) * proporcao;
  const vy = by - ay;
  const n = Math.hypot(vx, vy) || 1;
  const sx = mx + (-vy / n) * 0.09 / proporcao;
  const sy = my + (vx / n) * 0.09;
  const nomeA = tipo === 'entrada' ? 'entrada' : 'sentido A';

  return (
    <form
      action={async (f) => {
        await salvarCamera(cam.canal, f);
        setSalvo(true);
      }}
      className="grid gap-5 lg:grid-cols-[1.4fr_1fr]"
    >
      <div>
        <div
          ref={caixa}
          className="relative touch-none select-none overflow-hidden rounded-sm bg-black"
          style={{ aspectRatio: String(proporcao) }}
          onPointerMove={mover}
          onPointerUp={() => setArrastando(null)}
          onPointerLeave={() => setArrastando(null)}
        >
          {cam.quadro_cru_em ? (
            // eslint-disable-next-line @next/next/no-img-element -- quadro atual da câmera
            <img src={`${BASE}/api/quadro/${cam.canal}?tipo=cru&t=${new Date(cam.quadro_cru_em).getTime()}`} alt={`Quadro atual da câmera ${cam.nome}`} className="h-full w-full object-contain" draggable={false} />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Esperando o primeiro quadro do motor...</p>
          )}
          {tipo && (
            <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#4ade80" strokeWidth={0.006} vectorEffect="non-scaling-stroke" style={{ strokeWidth: 3 }} />
              <line x1={mx} y1={my} x2={sx} y2={sy} stroke="#4ade80" style={{ strokeWidth: 2 }} vectorEffect="non-scaling-stroke" strokeDasharray="4 3" />
            </svg>
          )}
          {tipo && (
            <>
              <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded bg-[#4ade80] px-1.5 py-0.5 text-[11px] font-semibold text-black" style={{ left: `${sx * 100}%`, top: `${sy * 100}%` }}>
                {nomeA}
              </span>
              {(['a', 'b'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-label={`Ponta ${k.toUpperCase()} da linha (arraste)`}
                  onPointerDown={(e) => {
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    setArrastando(k);
                  }}
                  className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-[#16a34a] shadow active:cursor-grabbing"
                  style={{ left: `${linha[k][0] * 100}%`, top: `${linha[k][1] * 100}%` }}
                />
              ))}
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          {cam.quadro_cru_em ? `Quadro de ${new Date(cam.quadro_cru_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}. ` : ''}
          {tipo ? 'Arraste as pontas verdes para posicionar a linha. A seta mostra o lado contado como "' + nomeA + '".' : 'Sem linha de contagem nesta câmera.'}
        </p>
      </div>

      <div className="space-y-4 text-sm">
        <input type="hidden" name="linha" value={JSON.stringify(linha)} />
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Nome</span>
          <input name="nome" defaultValue={cam.nome} maxLength={40} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Função</span>
          <input name="funcao" defaultValue={cam.funcao} maxLength={120} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Quadros por segundo</span>
            <input name="fps" type="number" min={0.5} max={5} step={0.5} defaultValue={cam.fps} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Linha</span>
            <select name="tipo_linha" value={tipo} onChange={(e) => { setTipo(e.target.value); setSalvo(false); }} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface">
              <option value="">Nenhuma</option>
              <option value="entrada">Entradas da loja</option>
              <option value="veiculos">Veículos</option>
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="ativa" defaultChecked={cam.ativa} />
          Analisar esta câmera
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-sm bg-primary px-4 py-2 font-semibold text-on-primary">Salvar</button>
          {tipo && (
            <button type="button" onClick={() => { setLinha({ a: linha.b, b: linha.a }); setSalvo(false); }} className="rounded-sm border border-outline-variant px-3 py-2 text-on-surface">
              Inverter sentido
            </button>
          )}
          {salvo && <span className="text-xs text-[var(--color-success)]">Salvo. O motor aplica em até 10 segundos.</span>}
        </div>
        <p className="text-xs text-on-surface-variant">Canal no servidor de vídeo: lavateria/{cam.caminho}</p>
      </div>
    </form>
  );
}
