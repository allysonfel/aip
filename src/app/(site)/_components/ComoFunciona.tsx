"use client";

import { useEffect, useRef, useState } from "react";
import { MiniVisual, type VisualId } from "./MiniVisuais";

const PASSOS: { titulo: string; texto: string; visual: VisualId }[] = [
  { titulo: "Conectamos às suas câmeras.", texto: "A AIP se integra às câmeras e gravadores que você já tem. Sem obra e sem trocar equipamento.", visual: "V22" },
  { titulo: "A IA analisa as imagens.", texto: "A IA detecta pessoas, veículos e objetos e é configurada para o que importa na sua operação: contar, acompanhar, avisar ou reconhecer comportamentos específicos. A tecnologia se adapta à sua necessidade.", visual: "V23" },
  { titulo: "Você acompanha no seu painel.", texto: "Tudo chega a um painel exclusivo da sua operação, no computador ou no celular, de qualquer lugar.", visual: "V24" },
];

/**
 * Três passos (lado a lado no desktop, empilhados no celular), cada um com
 * um mini-visual animado. Uma linha fina liga os passos e se desenha quando
 * a seção aparece; os visuais animam em sequência (mesmas classes .mv-* dos
 * cards de Soluções).
 */
export default function ComoFunciona() {
  const ref = useRef<HTMLOListElement>(null);
  const [ativo, setAtivo] = useState(false);
  // Quantos passos já animaram: um de cada vez, acompanhando a linha.
  const [passos, setPassos] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timers: number[] = [];
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        setAtivo(true);
        PASSOS.forEach((_, i) => timers.push(window.setTimeout(() => setPassos(i + 1), i * 450)));
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <ol ref={ref} className="relative mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
      {/* Linha que liga os passos: horizontal no desktop, vertical no celular. */}
      <span aria-hidden className="pointer-events-none absolute left-6 top-6 h-[calc(100%-3rem)] w-px origin-top bg-gradient-to-b from-[#5FD3FF]/70 to-white/10 transition-transform duration-[1400ms] ease-out motion-reduce:transition-none md:left-6 md:right-6 md:h-px md:w-auto md:origin-left md:bg-gradient-to-r" style={{ transform: ativo ? "scale(1)" : "scale(0)" }} />
      {PASSOS.map((p, i) => (
        <li key={p.titulo} className={`cartao-uso relative pl-16 md:pl-0 ${passos > i ? "ativo" : ""}`}>
          <span className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black font-titulo text-sm font-medium tracking-[0.14em] text-white/80 md:relative">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="font-titulo text-[1.75rem] font-bold leading-[1.05] md:mt-6">{p.titulo}</h3>
          <p className="corpo mt-3 max-w-[22rem]">{p.texto}</p>
          <div className="mt-6 h-36 max-w-[22rem] rounded-2xl border border-white/10 bg-[#111214] p-4 opacity-90">
            <MiniVisual id={p.visual} />
          </div>
        </li>
      ))}
    </ol>
  );
}
