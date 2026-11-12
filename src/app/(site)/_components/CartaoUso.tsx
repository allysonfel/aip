"use client";

import { useEffect, useRef, useState } from "react";
import { MiniVisual, type VisualId } from "./MiniVisuais";

/**
 * Card de "Como a tecnologia é usada": índice e título no topo, texto logo
 * abaixo, mini-visual no meio (o espaço que sobra vai para ele, centralizado)
 * e o dado de exemplo no rodapé. O visual anima uma vez quando o card entra
 * na tela. No celular (sem hover), o card que está no centro do carrossel
 * recebe o mesmo destaque do hover.
 */
export default function CartaoUso({ indice, titulo, texto, visual, exemplo, sobProjeto }: { indice: number; titulo: string; texto: string; visual: VisualId; exemplo: string; sobProjeto?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(false);
  const [foco, setFoco] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const entrada = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setAtivo(true);
          entrada.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    entrada.observe(el);

    // Destaque no card centralizado, só em telas de toque.
    let centro: IntersectionObserver | undefined;
    if (window.matchMedia("(hover: none)").matches) {
      centro = new IntersectionObserver(([e]) => setFoco(e.isIntersecting), { rootMargin: "0px -35% 0px -35%" });
      centro.observe(el);
    }
    return () => {
      entrada.disconnect();
      centro?.disconnect();
    };
  }, []);

  const pct = Number(exemplo.match(/(\d+)%/)?.[1]) || undefined;
  const alvo = Number(exemplo.match(/(\d[\d.]*)\s*pessoas/)?.[1].replace(/\./g, "")) || undefined;

  return (
    <div ref={ref} className={`cartao-uso group flex h-full min-h-[23rem] flex-col rounded-2xl border bg-[#111214] p-6 transition-colors duration-300 sm:min-h-[24rem] sm:p-7 ${foco ? "border-[#5FD3FF]/60" : "border-white/10 hover:border-[#5FD3FF]/60"} ${ativo ? "ativo" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-titulo text-sm font-medium tracking-[0.18em] text-white/45">{String(indice).padStart(2, "0")}</p>
        {sobProjeto && <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/55">Sob projeto</span>}
      </div>
      <h3 className="mt-2 font-titulo text-[1.625rem] font-bold leading-[1.05] text-white">{titulo}</h3>
      <p className="mt-2 text-[0.95rem] leading-snug text-white/65">{texto}</p>

      <div className={`flex min-h-36 flex-1 items-center py-5 transition-opacity duration-300 ${foco ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}>
        <div className="h-36 w-full sm:h-40">
          <MiniVisual id={visual} pct={pct} alvo={alvo} ativo={ativo} />
        </div>
      </div>

      <p className="flex items-baseline gap-2 text-sm">
        <span className="font-medium text-white">{exemplo}</span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-white/35">Exemplo</span>
      </p>
    </div>
  );
}
