"use client";

import type { ReactNode } from "react";
import { C } from "./Hud";
import { Icone, type NomeIcone } from "./Icones";
import { d } from "./slide";

/* ------------------------------ linha do tempo (próximos passos) ------------------------------ */

export type EtapaLinha = { n: string; titulo: string; frase: string; icone: NomeIcone };

const LINHA_INICIO = 400;
const LINHA_DUR = 2400;
export const LINHA_FIM = LINHA_INICIO + LINHA_DUR;

/**
 * Quatro etapas ligadas por uma linha ciano que se desenha (horizontal no
 * desktop, vertical no celular). Cada etapa acende quando a linha chega nela;
 * no fim, a etapa 04 se ramifica em pontos (as outras unidades).
 */
export function LinhaDoTempo({ etapas: ETAPAS, ramo = <Ramos />, ramoCelular = <RamosCelular /> }: { etapas: EtapaLinha[]; ramo?: ReactNode; ramoCelular?: ReactNode }) {
  const quando = (i: number) => LINHA_INICIO + (LINHA_DUR * i) / (ETAPAS.length - 1);
  return (
    <div className="relative">
      {/* trilho + linha (desktop): do centro do 1º ao centro do 4º marcador */}
      <div aria-hidden className="absolute left-[calc(12.5%)] right-[calc(12.5%)] top-[clamp(1.5rem,3.4vh,2rem)] hidden h-px bg-white/15 lg:block">
        <div className="ap-linha-x h-full w-full bg-[#5FD3FF]" style={{ "--d": `${LINHA_INICIO}ms`, "--t": `${LINHA_DUR}ms`, transitionTimingFunction: "linear" } as React.CSSProperties} />
      </div>
      {/* trilho + linha (celular) */}
      <div aria-hidden className="absolute bottom-10 left-[clamp(1.5rem,3.4vh,2rem)] top-6 w-px bg-white/15 lg:hidden">
        <div className="ap-linha-y h-full w-full bg-[#5FD3FF]" style={{ "--d": `${LINHA_INICIO}ms`, "--t": `${LINHA_DUR}ms`, transitionTimingFunction: "linear" } as React.CSSProperties} />
      </div>

      <ol className="relative grid gap-8 lg:grid-cols-4 lg:gap-6">
        {ETAPAS.map((e, i) => (
          <li key={e.n} className="relative flex gap-5 lg:flex-col lg:items-center lg:gap-0 lg:text-center">
            <div className="relative h-[clamp(3rem,6.8vh,4rem)] w-[clamp(3rem,6.8vh,4rem)] shrink-0 self-start lg:self-center">
              <span className="flex h-[clamp(3rem,6.8vh,4rem)] w-[clamp(3rem,6.8vh,4rem)] items-center justify-center rounded-full border border-white/20 bg-black text-white/35">
                <Icone nome={e.icone} className="h-[45%] w-[45%]" />
              </span>
              {/* estado aceso */}
              <span className="ap-fade absolute inset-0 flex items-center justify-center rounded-full border border-[#5FD3FF] bg-black text-[#5FD3FF] shadow-[0_0_28px_rgb(95_211_255/0.35)]" style={d(quando(i))}>
                <Icone nome={e.icone} className="h-[45%] w-[45%]" />
              </span>
              {i === ETAPAS.length - 1 && ramo}
            </div>
            <div className="ap-acende min-w-0 lg:mt-5" style={d(quando(i))}>
              <div className="ap-num text-[clamp(1rem,1.4vw,1.6rem)] text-[#5FD3FF]">{e.n}</div>
              <div className="mt-1 font-titulo text-[clamp(1.4rem,min(2vw,3.6vh),2.4rem)] font-semibold leading-tight">{e.titulo}:</div>
              <p className="mt-1.5 text-white/70 ap-pequeno lg:mx-auto lg:max-w-[22ch]">{e.frase}</p>
              {i === ETAPAS.length - 1 && ramoCelular}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** A etapa 04 se ramifica: pequenos pontos (as demais unidades) acendendo depois que a linha termina. */
export function Ramos() {
  const pontos: [number, number][] = [
    [58, 8],
    [66, 26],
    [70, 44],
    [64, 62],
    [54, 78],
  ];
  return (
    <svg viewBox="0 0 80 86" aria-hidden className="pointer-events-none absolute left-[78%] top-1/2 hidden h-[180%] -translate-y-1/2 overflow-visible lg:block" fill="none">
      {pontos.map(([x, y], i) => (
        <g key={i}>
          <path d={`M4 43 Q${x * 0.45} ${43 + (y - 43) * 0.15} ${x} ${y}`} stroke={C} strokeOpacity="0.5" className="ap-fade" style={d(LINHA_FIM + 150 + i * 110)} />
          <g className="ap-fade" style={d(LINHA_FIM + 300 + i * 110)}>
            <circle cx={x} cy={y} r="3.4" fill={C} />
            <circle cx={x} cy={y} r="3.4" stroke={C} className="ap-onda" style={{ animationDelay: `${i * 300}ms` }} />
          </g>
        </g>
      ))}
    </svg>
  );
}

/** No celular a ramificação vai para baixo do texto da etapa 04 (ao lado do marcador ela cobriria o texto). */
export function RamosCelular() {
  const xs = [14, 52, 90, 128, 166];
  return (
    <svg viewBox="0 0 180 40" aria-hidden className="mt-4 h-10 w-[180px] overflow-visible lg:hidden" fill="none">
      {xs.map((x, i) => (
        <g key={x}>
          <path d={`M14 2 Q14 22 ${x} 30`} stroke={C} strokeOpacity="0.5" className="ap-fade" style={d(LINHA_FIM + 150 + i * 110)} />
          <g className="ap-fade" style={d(LINHA_FIM + 300 + i * 110)}>
            <circle cx={x} cy="30" r="3.4" fill={C} />
            <circle cx={x} cy="30" r="3.4" stroke={C} className="ap-onda" style={{ animationDelay: `${i * 300}ms` }} />
          </g>
        </g>
      ))}
    </svg>
  );
}
