"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LogoAIP } from "./Logos";
import { d, reduzido } from "./slide";

export const dois = (n: number) => String(n).padStart(2, "0");

/* ------------------------------ moldura ------------------------------ */

export function useNavegacao(TOTAL: number) {
  const [atual, setAtual] = useState(0);
  const atualRef = useRef(0);
  const destino = useRef<number | null>(null);

  useEffect(() => {
    const slides = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slide]"));
    let raf = 0;
    let espera = 0;

    // Slide atual: o último cujo topo já passou de 45% da altura da tela.
    const calcula = () => {
      const linha = window.innerHeight * 0.45;
      let i = 0;
      slides().forEach((s, k) => {
        if (s.getBoundingClientRect().top <= linha) i = k;
      });
      atualRef.current = i;
      setAtual(i);
    };
    const aoRolar = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calcula);
    };

    const ir = (i: number) => {
      const lista = slides();
      const alvo = Math.max(0, Math.min(lista.length - 1, i));
      destino.current = alvo;
      lista[alvo].scrollIntoView({ behavior: reduzido() ? "auto" : "smooth", block: "start" });
      window.clearTimeout(espera);
      espera = window.setTimeout(() => (destino.current = null), 900);
    };

    const tecla = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable]")) return;
      const base = destino.current ?? atualRef.current;
      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          ir(base + 1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          ir(base - 1);
          break;
        case " ":
        case "Spacebar":
          e.preventDefault();
          ir(e.shiftKey ? base - 1 : base + 1);
          break;
        case "Home":
          e.preventDefault();
          ir(0);
          break;
        case "End":
          e.preventDefault();
          ir(TOTAL - 1);
          break;
        case "f":
        case "F":
          e.preventDefault();
          if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
          else document.documentElement.requestFullscreen?.().catch(() => {});
          break;
      }
    };

    calcula();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    window.addEventListener("keydown", tecla);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(espera);
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
      window.removeEventListener("keydown", tecla);
    };
  }, [TOTAL]);

  return atual;
}

export function Moldura({ atual, total: TOTAL }: { atual: number; total: number }) {
  return (
    <>
      {/* progresso: linha fina ciano no topo */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-[2px] bg-white/[0.06]">
        <div className="h-full origin-left bg-[#5FD3FF] transition-transform duration-500 ease-out" style={{ transform: `scaleX(${(atual + 1) / TOTAL})` }} />
      </div>
      {/* marca discreta depois da capa */}
      <div aria-hidden className={`pointer-events-none fixed left-[clamp(1.25rem,3vw,3rem)] top-[clamp(1rem,3vh,2rem)] z-40 transition-opacity duration-500 ${atual > 0 && atual < TOTAL - 1 ? "opacity-60" : "opacity-0"}`}>
        <LogoAIP className="h-[clamp(0.9rem,1.6vh,1.25rem)] text-white" />
      </div>
      {/* número do slide */}
      <div className="pointer-events-none fixed bottom-[clamp(0.9rem,2.6vh,1.75rem)] right-[clamp(1.25rem,3vw,3rem)] z-40 ap-num text-[clamp(0.8rem,1.6vh,1.1rem)] tracking-[0.18em] text-white/45" aria-live="polite">
        <span className="text-white/85">{dois(atual + 1)}</span> / {TOTAL}
      </div>
    </>
  );
}

/* ------------------------------ peças ------------------------------ */

export function Rotulo({ children, atraso = 0 }: { children: ReactNode; atraso?: number }) {
  return (
    <p className="ap-in ap-rotulo mb-[clamp(1rem,3vh,2rem)] flex items-center gap-3" style={d(atraso)}>
      <span aria-hidden className="h-px w-8 bg-[#5FD3FF]" />
      {children}
    </p>
  );
}

/** Marcador de lista: tracinho ciano. */
export function Marca() {
  return <span aria-hidden className="mt-[0.62em] h-px w-5 shrink-0 bg-[#5FD3FF]" />;
}
