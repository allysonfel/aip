"use client";

import { useEffect, useRef, useState } from "react";
import { ECONOMIA } from "../_config/economia";

const reais = (v: number) => v.toLocaleString("pt-BR");

// Comparação em duas barras: trocar as câmeras x manter as atuais com a AIP.
// Quando entra na tela, a barra da AIP encolhe até o custo relativo e o
// contador sobe até a economia. Movimento reduzido: já vem no valor final.
export default function Economia() {
  const ref = useRef<HTMLDivElement>(null);
  const [valor, setValor] = useState(0);
  const alvo = ECONOMIA.economiaPercentual;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValor(alvo);
      return;
    }
    let quadro = 0;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        const inicio = performance.now();
        const passo = (t: number) => {
          const p = Math.min(1, (t - inicio) / 1600);
          setValor(Math.round(alvo * (1 - Math.pow(1 - p, 3))));
          if (p < 1) quadro = requestAnimationFrame(passo);
        };
        quadro = requestAnimationFrame(passo);
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(quadro);
    };
  }, [alvo]);

  const custoAip = 100 - valor;

  return (
    <div ref={ref} className="rounded-2xl border border-linha bg-painel p-6 sm:p-10">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="font-medium">Trocar por câmeras com IA embarcada</p>
          <p className="text-sm text-cinza">
            R$ {reais(ECONOMIA.precoMinimo)} a R$ {reais(ECONOMIA.precoMaximo)} por câmera
          </p>
        </div>
        <div className="mt-3 h-12 rounded-lg bg-white/80" />
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="font-medium">Câmeras atuais + AIP</p>
          <p className="text-sm text-cinza">a mesma inteligência, sem trocar equipamento</p>
        </div>
        <div className="relative mt-3 h-12 rounded-lg border border-dashed border-visao/50">
          <div className="absolute inset-y-0 left-0 rounded-lg bg-visao transition-[width] duration-100" style={{ width: `${Math.max(custoAip, 100 - alvo)}%` }} />
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-end gap-x-5 gap-y-2 border-t border-linha pt-8">
        <p className="font-titulo text-7xl font-bold leading-none text-visao sm:text-8xl" aria-hidden>
          ~{valor}%
        </p>
        <p className="pb-2 text-lg leading-snug text-white/85">
          de economia aproximada
          <br className="hidden sm:block" /> em relação à troca dos equipamentos
        </p>
        <p className="sr-only">Economia aproximada de {alvo}% em relação à troca dos equipamentos.</p>
      </div>
    </div>
  );
}
