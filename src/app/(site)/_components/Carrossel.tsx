"use client";

import { useRef, useState, type ReactNode } from "react";
import DragHint from "./DragHint";

// Faixa de cartões arrastáveis: toque nativo no celular; no desktop, arrastar
// com o mouse, rolagem horizontal do trackpad ou da roda (Shift + roda) e
// setas redondas embaixo. O teclado alcança a faixa, que rola com as setas.
export default function Carrossel({ itens, rotulo, largura = "w-[82vw] sm:w-[420px]" }: { itens: { chave: string; conteudo: ReactNode }[]; rotulo: string; largura?: string }) {
  const faixa = useRef<HTMLUListElement>(null);
  const arraste = useRef<{ x: number; inicio: number; moveu: boolean } | null>(null);
  const [mexeu, setMexeu] = useState(false);

  function mover(direcao: 1 | -1) {
    const el = faixa.current;
    const cartao = el?.querySelector("li");
    if (!el || !cartao) return;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direcao * (cartao.clientWidth + 20), behavior: reduzido ? "auto" : "smooth" });
  }

  return (
    <div>
      <div className="margem mb-5">
        <DragHint oculto={mexeu} />
      </div>
      <ul
        ref={faixa}
        tabIndex={0}
        aria-label={rotulo}
        onScroll={() => !mexeu && setMexeu(true)}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") arraste.current = { x: e.clientX, inicio: faixa.current?.scrollLeft ?? 0, moveu: false };
        }}
        onPointerMove={(e) => {
          const a = arraste.current;
          if (!a || !faixa.current) return;
          const dx = e.clientX - a.x;
          if (Math.abs(dx) > 5) a.moveu = true;
          faixa.current.scrollLeft = a.inicio - dx;
        }}
        onPointerUp={() => setTimeout(() => (arraste.current = null))}
        onPointerLeave={() => (arraste.current = null)}
        // Quem arrastou não quer abrir o link do cartão.
        onClickCapture={(e) => {
          if (arraste.current?.moveu) e.preventDefault();
        }}
        className="sem-barra flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-[var(--recuo)] px-[var(--recuo)] [--recuo:max(clamp(1.25rem,4vw,3.5rem),calc((100%-1320px)/2+3.5rem))] active:cursor-grabbing active:snap-none"
      >
        {itens.map((i) => (
          <li key={i.chave} className={`shrink-0 snap-start ${largura}`}>
            {i.conteudo}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex justify-center gap-3">
        {([[-1, "Anterior", "M15 5l-7 7 7 7"], [1, "Próximo", "M9 5l7 7-7 7"]] as const).map(([d, nome, caminho]) => (
          <button key={nome} type="button" aria-label={nome} onClick={() => mover(d)} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 transition-colors hover:bg-white hover:text-black">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden>
              <path d={caminho} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
