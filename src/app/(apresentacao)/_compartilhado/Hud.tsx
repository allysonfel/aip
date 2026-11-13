import type { CSSProperties, ReactNode } from "react";

export const C = "#5FD3FF";
export const L = "rgb(255 255 255 / 0.62)";
export const F = "rgb(255 255 255 / 0.16)";

/* ------------------------------ moldura HUD ------------------------------ */

/** Quadro de "tela de análise": cantos marcados, grade fraca e varredura lenta. */
export function Hud({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-[#050607] ${className}`}>
      <div aria-hidden className="ap-grade opacity-40" style={{ backgroundSize: "28px 28px" }} />
      <div aria-hidden className="ap-varredura" style={{ "--t": "7s" } as CSSProperties} />
      <svg viewBox="0 0 320 180" aria-hidden className="relative block h-full w-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
      {/* cantos do visor */}
      <span aria-hidden className="absolute left-2 top-2 h-3 w-3 border-l border-t border-white/35" />
      <span aria-hidden className="absolute right-2 top-2 h-3 w-3 border-r border-t border-white/35" />
      <span aria-hidden className="absolute bottom-2 left-2 h-3 w-3 border-b border-l border-white/35" />
      <span aria-hidden className="absolute bottom-2 right-2 h-3 w-3 border-b border-r border-white/35" />
    </div>
  );
}

/** Cantos de uma caixa de detecção. */
export function Caixa({ x, y, w, h, t = 10, cor = C }: { x: number; y: number; w: number; h: number; t?: number; cor?: string }) {
  const r = x + w;
  const b = y + h;
  return <path d={`M${x} ${y + t}V${y}h${t} M${r - t} ${y}h${t}v${t} M${r} ${b - t}v${t}h-${t} M${x + t} ${b}h-${t}v-${t}`} stroke={cor} strokeWidth="1.6" />;
}

export function Visto({ x, y, cor = C }: { x: number; y: number; cor?: string }) {
  return <path d={`M${x - 3.5} ${y}l2.6 2.6 5-5.2`} stroke={cor} strokeWidth="1.5" />;
}
