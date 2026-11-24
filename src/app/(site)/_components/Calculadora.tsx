"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ECONOMIA, faixaPreco } from "../_config/economia";
import { useIdioma } from "../_i18n/Contexto";
import { f } from "../_i18n/dicionario";
import { LOCALE, type Idioma } from "../_i18n/idiomas";

const MIN = 4;
const MAX = 200;

/** "R$ 130 mil", "R$ 1,3 milhão", "R$ 4,2 milhões"; em inglês e russo, dólares no formato compacto de cada idioma ("$22K", "22 тыс. $"). */
function valorCurto(v: number, idioma: Idioma) {
  if (idioma !== "pt") return new Intl.NumberFormat(LOCALE[idioma], { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v);
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    const t = m.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    return `R$ ${t} ${m < 2 ? "milhão" : "milhões"}`;
  }
  return `R$ ${Math.round(v / 1000).toLocaleString("pt-BR")} mil`;
}

/**
 * Calculadora visual: o controle define a quantidade de câmeras e a barra de
 * troca mostra o custo de mercado (quantidade × faixa de preço). A barra
 * "Suas câmeras + AIP" é ~80% menor e não mostra valor em reais. As barras
 * crescem quando a seção aparece e acompanham o controle.
 */
export default function Calculadora() {
  const id = useId();
  const { idioma, d } = useIdioma();
  const c = d.calculadora;
  const ref = useRef<HTMLDivElement>(null);
  const [qtd, setQtd] = useState(20);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const pct = ECONOMIA.economiaPercentual;
  // A barra de troca cresce com a quantidade (de ~35% a 100% da largura).
  const larguraTroca = 35 + ((qtd - MIN) / (MAX - MIN)) * 65;
  const larguraAip = larguraTroca * (1 - pct / 100);
  const preco = faixaPreco(idioma);
  const faixa = f(c.faixa, { min: valorCurto(qtd * preco.minimo, idioma), max: valorCurto(qtd * preco.maximo, idioma) });

  return (
    <div ref={ref} className="rounded-2xl border border-white/10 bg-[#111214] p-6 sm:p-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <label htmlFor={`${id}-qtd`} className="font-medium">
          {c.pergunta}
        </label>
        <p className="font-titulo text-4xl font-bold leading-none tabular-nums" aria-hidden>
          {qtd}
        </p>
      </div>
      <input
        id={`${id}-qtd`}
        type="range"
        min={MIN}
        max={MAX}
        step={1}
        value={qtd}
        onChange={(e) => setQtd(Number(e.target.value))}
        aria-valuetext={f(c.cameras, { n: qtd })}
        className="controle-calc mt-4 w-full"
        style={{ "--pos": `${((qtd - MIN) / (MAX - MIN)) * 100}%` } as React.CSSProperties}
      />
      <div className="mt-1 flex justify-between text-xs text-white/40">
        <span>{MIN}</span>
        <span>{MAX}</span>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="font-medium">{c.trocar}</p>
          <p className="text-sm text-white/70 tabular-nums">{faixa}</p>
        </div>
        <div className="mt-3 h-10 rounded-lg bg-white/[0.04]">
          <div className="h-full rounded-lg bg-white/80 transition-[width] duration-700 ease-out motion-reduce:transition-none" style={{ width: visivel ? `${larguraTroca}%` : "0%" }} />
        </div>
      </div>

      <div className="mt-6">
        <p className="font-medium">{c.aip}</p>
        <div className="mt-3 h-10 rounded-lg bg-white/[0.04]">
          <div className="h-full rounded-lg bg-[#5FD3FF] transition-[width] delay-150 duration-700 ease-out motion-reduce:transition-none" style={{ width: visivel ? `${larguraAip}%` : "0%" }} />
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-end gap-x-5 gap-y-2 border-t border-white/10 pt-8">
        <p className="font-titulo text-7xl font-bold leading-none text-[#5FD3FF] sm:text-8xl">~{pct}%</p>
        <p className="pb-2 text-lg leading-snug text-white/85">{c.economia}</p>
      </div>
      <p className="sr-only" aria-live="polite">
        {f(c.resumo, { n: qtd, faixa, pct })}
      </p>
    </div>
  );
}
