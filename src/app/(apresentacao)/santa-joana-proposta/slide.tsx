"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** Atraso da entrada em cascata (CSS: var(--d)). */
export const d = (ms: number, extra?: CSSProperties) => ({ "--d": `${ms}ms`, ...extra }) as CSSProperties;

export const reduzido = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const AtivoCtx = createContext(false);

/** true depois que o slide apareceu (fica true para sempre: a entrada é uma vez só). */
export const useAtivo = () => useContext(AtivoCtx);

/**
 * Slide de tela inteira. Recebe .ativo uma única vez, quando boa parte dele
 * aparece (ou metade da tela, para slides mais altos que a tela no celular).
 */
export function Slide({ id, rotulo, className = "", children }: { id: string; rotulo: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.4 || e.intersectionRect.height >= window.innerHeight * 0.55) {
          setAtivo(true);
          obs.disconnect();
        }
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} id={id} data-slide aria-label={rotulo} className={`ap-slide ${ativo ? "ativo" : ""} ${className}`}>
      <AtivoCtx.Provider value={ativo}>{children}</AtivoCtx.Provider>
    </section>
  );
}

const BRL = new Intl.NumberFormat("pt-BR");

/** Número que conta de 0 até `ate` quando o slide aparece. */
export function Conta({ ate, atraso = 0, duracao = 1400, milhar = false, className }: { ate: number; atraso?: number; duracao?: number; milhar?: boolean; className?: string }) {
  const ativo = useAtivo();
  const [valor, setValor] = useState(ate);

  // Antes de aparecer fica em 0 (o slide ainda está escondido).
  useEffect(() => {
    if (!reduzido()) setValor(0);
  }, []);

  useEffect(() => {
    if (!ativo || reduzido()) {
      if (ativo) setValor(ate);
      return;
    }
    let raf = 0;
    const inicio = performance.now() + atraso;
    const passo = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - inicio) / duracao));
      setValor(Math.round(ate * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [ativo, ate, atraso, duracao]);

  return <span className={className}>{milhar ? BRL.format(valor) : valor}</span>;
}
