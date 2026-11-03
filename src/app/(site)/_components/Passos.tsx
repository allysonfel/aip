"use client";

import { useEffect, useRef } from "react";
import type { Passo } from "../_content/solucoes/tipos";

// Lista numerada vertical. A linha que liga os números "se desenha" conforme
// a lista passa pelo meio da tela; com movimento reduzido, já vem inteira.
export default function Passos({ passos }: { passos: Passo[] }) {
  const lista = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = lista.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--progresso", "1");
      return;
    }
    let quadro = 0;
    const atualizar = () => {
      quadro = 0;
      const r = el.getBoundingClientRect();
      const meio = window.innerHeight * 0.6;
      const p = Math.min(1, Math.max(0, (meio - r.top) / r.height));
      el.style.setProperty("--progresso", p.toFixed(3));
    };
    const pedir = () => (quadro ||= requestAnimationFrame(atualizar));
    atualizar();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
    };
  }, []);

  return (
    <ol ref={lista} className="relative" style={{ "--progresso": 0 } as React.CSSProperties}>
      {/* Trilho e linha desenhada, no eixo dos números */}
      <span aria-hidden className="absolute bottom-8 left-[1.4rem] top-8 w-px bg-linha sm:left-[1.9rem]" />
      <span aria-hidden className="absolute bottom-8 left-[1.4rem] top-8 w-px origin-top bg-visao sm:left-[1.9rem]" style={{ transform: "scaleY(var(--progresso))" }} />
      {passos.map((p, i) => (
        <li key={p.titulo} className="relative flex gap-6 pb-12 last:pb-0 sm:gap-9">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-visao/60 bg-black font-titulo text-2xl font-bold text-visao sm:h-[3.8rem] sm:w-[3.8rem] sm:text-3xl">{i + 1}</span>
          <div className="pt-1.5 sm:pt-3">
            <h3 className="titulo-coluna">{p.titulo}</h3>
            <p className="corpo mt-2 max-w-[34rem]">{p.texto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
