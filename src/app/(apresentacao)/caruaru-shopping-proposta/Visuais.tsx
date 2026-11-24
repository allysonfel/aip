"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ENTRADAS as ENTRADAS_PLANTA, FUNDO } from "@/lib/shopping/planta";
import { ESBOCO, type Poligono } from "@/lib/shopping/plantaEsboco";
import { simular } from "@/lib/shopping/simulacao";
import { ECONOMIA } from "../../(site)/_config/economia";
import { MiniVisual, type VisualId } from "../../(site)/_components/MiniVisuais";
import { Icone, type NomeIcone } from "../_compartilhado/Icones";
import { d, useAtivo } from "../_compartilhado/slide";

// Visuais da apresentação do Caruaru Shopping. Nada aqui vem do painel real:
// números, nomes de áreas e gráficos são de demonstração (selo EXEMPLO), sem
// imagens de câmera, rostos, placas, nomes de câmeras ou da planta.

/** Logo oficial do Caruaru Shopping, tratado para fundo escuro (texto em branco). */
export function LogoCaruaru({ className = "" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- logo do cliente, arquivo pronto em PNG transparente.
  return <img src="/clientes/caruaru-shopping.png" alt="Caruaru Shopping" className={`w-auto select-none ${className}`} draggable={false} />;
}

/** Selo discreto de dado de demonstração, como nos cards do site. */
export function SeloExemplo({ className = "" }: { className?: string }) {
  return <span className={`rounded-full border border-white/20 px-2.5 py-0.5 text-[clamp(0.55rem,1vh,0.7rem)] font-medium uppercase tracking-[0.16em] text-white/50 ${className}`}>Exemplo</span>;
}

/** Selo "Sob projeto" (função que depende de projeto e avaliação). */
export function SeloSobProjeto({ className = "" }: { className?: string }) {
  return <span className={`rounded-full border border-[#5FD3FF]/50 px-2.5 py-0.5 text-[clamp(0.55rem,1vh,0.7rem)] font-medium uppercase tracking-[0.16em] text-[#5FD3FF] ${className}`}>Sob projeto</span>;
}

/** Mini gráfico do site, animado quando o slide aparece (classes .mv-* do site). */
export function Mini({ id, pct, alvo }: { id: VisualId; pct?: number; alvo?: number }) {
  const ativo = useAtivo();
  return (
    <div className={`cartao-uso h-full w-full ${ativo ? "ativo" : ""}`}>
      <MiniVisual id={id} pct={pct} alvo={alvo} ativo={ativo} />
    </div>
  );
}

/** Cartão com o mini gráfico e um dado de exemplo embaixo. */
export function CartaoVisual({ id, exemplo, pct, alvo }: { id: VisualId; exemplo?: string; pct?: number; alvo?: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111214] p-[clamp(1rem,2.4vh,1.75rem)]">
      <div className="h-[clamp(9rem,26vh,17rem)]">
        <Mini id={id} pct={pct} alvo={alvo} />
      </div>
      {exemplo && (
        <div className="mt-[clamp(0.75rem,2vh,1.25rem)] flex items-center justify-between gap-4 border-t border-white/10 pt-[clamp(0.6rem,1.6vh,1rem)]">
          <span className="ap-pequeno font-medium text-white">{exemplo}</span>
          <SeloExemplo />
        </div>
      )}
    </div>
  );
}

/* ------------------------------ como funciona: 4 etapas ------------------------------ */

export function Rota({ etapas }: { etapas: { icone: NomeIcone; titulo: string; texto: string }[] }) {
  const inicio = 450;
  const dur = 1800;
  const quando = (i: number) => inicio + (dur * i) / (etapas.length - 1);
  const tam = "h-[clamp(3.25rem,8vh,5rem)] w-[clamp(3.25rem,8vh,5rem)]";
  const borda = `${50 / etapas.length}%`;
  return (
    <div className="relative">
      <div aria-hidden className="absolute top-[clamp(1.625rem,4vh,2.5rem)] hidden h-px bg-white/15 md:block" style={{ left: borda, right: borda }}>
        <div className="ap-linha-x h-full w-full bg-[#5FD3FF]" style={{ "--d": `${inicio}ms`, "--t": `${dur}ms`, transitionTimingFunction: "linear" } as React.CSSProperties} />
      </div>
      <div aria-hidden className="absolute bottom-6 left-[clamp(1.625rem,4vh,2.5rem)] top-6 w-px bg-white/15 md:hidden">
        <div className="ap-linha-y h-full w-full bg-[#5FD3FF]" style={{ "--d": `${inicio}ms`, "--t": `${dur}ms`, transitionTimingFunction: "linear" } as React.CSSProperties} />
      </div>
      <ol className="relative grid gap-6 md:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style={{ "--n": etapas.length } as React.CSSProperties}>
        {etapas.map((e, i) => (
          <li key={e.titulo} className="flex items-start gap-5 md:flex-col md:items-center md:gap-5 md:text-center">
            <span className={`relative shrink-0 ${tam}`}>
              <span className="absolute inset-0 flex items-center justify-center rounded-full border border-white/20 bg-black text-white/35">
                <Icone nome={e.icone} className="h-[44%] w-[44%]" />
              </span>
              <span className="ap-fade absolute inset-0 flex items-center justify-center rounded-full border border-[#5FD3FF] bg-black text-[#5FD3FF] shadow-[0_0_26px_rgb(95_211_255/0.3)]" style={d(quando(i))}>
                <Icone nome={e.icone} className="h-[44%] w-[44%]" />
              </span>
            </span>
            <span>
              <span className="ap-acende block font-titulo text-[clamp(1.3rem,min(2vw,3.6vh),2.4rem)] font-semibold leading-tight" style={d(quando(i))}>
                {e.titulo}
              </span>
              <span className="ap-acende mt-2 block ap-pequeno text-white/65 md:mx-auto md:max-w-[30ch]" style={d(quando(i) + 150)}>
                {e.texto}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------ painel (reprodução com dados de exemplo) ------------------------------ */

const HORAS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const ENTRADAS = [310, 520, 840, 990, 760, 690, 780, 960, 1140, 1080, 870, 520, 210];
const ACESSOS: [string, number][] = [
  ["Acesso principal", 3980],
  ["Estacionamento", 2870],
  ["Acesso lateral", 1640],
  ["Praça de alimentação", 1380],
];

function GraficoHoras() {
  const ativo = useAtivo();
  const max = Math.max(...ENTRADAS);
  const w = 520;
  const h = 150;
  const pts = ENTRADAS.map((v, i) => [12 + (i * (w - 24)) / (ENTRADAS.length - 1), h - 18 - (v / max) * (h - 40)] as const);
  const linha = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const pico = ENTRADAS.indexOf(max);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full overflow-visible" fill="none" aria-hidden>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="12" x2={w - 12} y1={h - 18 - f * (h - 40)} y2={h - 18 - f * (h - 40)} stroke="rgb(255 255 255 / 0.07)" />
      ))}
      <path d={`${linha} L${w - 12} ${h - 18} L12 ${h - 18} Z`} fill="rgb(95 211 255 / 0.08)" />
      <path d={linha} stroke="#5FD3FF" strokeWidth="1.8" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: ativo ? 0 : 1, transition: "stroke-dashoffset 1.6s cubic-bezier(.22,1,.36,1) .3s" }} />
      <circle cx={pts[pico][0]} cy={pts[pico][1]} r="4" fill="#5FD3FF" className="ap-fade" style={d(1500)} />
      {HORAS.filter((_, i) => i % 2 === 0).map((hr, k) => (
        <text key={hr} x={12 + (k * 2 * (w - 24)) / (ENTRADAS.length - 1)} y={h - 2} fill="rgb(255 255 255 / 0.4)" fontSize="10" textAnchor="middle" fontFamily="var(--font-barlow)">
          {hr}h
        </text>
      ))}
    </svg>
  );
}

export function PainelExemplo() {
  const ativo = useAtivo();
  const maxAcesso = ACESSOS[0][1];
  const kpis: [string, string, string?][] = [
    ["Pessoas no shopping agora", "1.284"],
    ["Entradas hoje", "9.870", "+6% sobre a média"],
    ["Horário de pico", "18h"],
    ["Ocupação da praça de alimentação", "72%"],
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#0b0c0d] shadow-[0_30px_80px_rgb(0_0_0/0.6)]">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-[clamp(1rem,2vw,1.5rem)] py-[clamp(0.6rem,1.4vh,0.9rem)]">
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5">
            {[0, 1, 2].map((k) => (
              <span key={k} className="h-2 w-2 rounded-full bg-white/15" />
            ))}
          </span>
          <span className="ap-pequeno font-medium text-white/80">Visão geral</span>
        </div>
        <SeloExemplo />
      </div>
      <div className="grid gap-[clamp(0.5rem,1.2vh,0.9rem)] p-[clamp(0.8rem,1.8vw,1.4rem)]">
        <div className="grid grid-cols-2 gap-[clamp(0.5rem,1.2vh,0.9rem)] lg:grid-cols-4">
          {kpis.map(([r, v, extra], i) => (
            <div key={r} className="ap-in rounded-xl border border-white/10 bg-white/[0.025] p-[clamp(0.6rem,1.4vh,1rem)]" style={d(200 + i * 80)}>
              <p className="text-[clamp(0.6rem,1.1vh,0.78rem)] leading-tight text-white/50">{r}</p>
              <p className="ap-num mt-1 text-[clamp(1.3rem,min(2.2vw,3.8vh),2.4rem)] font-bold leading-none text-white">{v}</p>
              {extra && <p className="mt-1 text-[clamp(0.55rem,1vh,0.72rem)] text-[#5FD3FF]">{extra}</p>}
            </div>
          ))}
        </div>
        <div className="grid gap-[clamp(0.5rem,1.2vh,0.9rem)] lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-[clamp(0.6rem,1.4vh,1rem)]">
            <p className="text-[clamp(0.6rem,1.1vh,0.78rem)] text-white/50">Entradas por hora</p>
            <div className="mt-2 h-[clamp(6rem,17vh,11rem)]">
              <GraficoHoras />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-[clamp(0.6rem,1.4vh,1rem)]">
            <p className="text-[clamp(0.6rem,1.1vh,0.78rem)] text-white/50">Entradas por acesso</p>
            <ul className="mt-3 space-y-[clamp(0.45rem,1.2vh,0.8rem)]">
              {ACESSOS.map(([nome, v], i) => (
                <li key={nome}>
                  <div className="flex justify-between text-[clamp(0.6rem,1.15vh,0.8rem)] text-white/75">
                    <span>{nome}</span>
                    <span className="ap-num text-white">{v.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-[#5FD3FF] transition-[width] duration-1000 ease-out" style={{ width: ativo ? `${(v / maxAcesso) * 100}%` : "0%", transitionDelay: `${500 + i * 120}ms`, opacity: i ? 0.55 : 1 }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Pergunte à AIP (conversa de exemplo) ------------------------------ */

function Balao({ de, children, atraso }: { de: "voce" | "aip"; children: ReactNode; atraso: number }) {
  return (
    <div className={`ap-in flex ${de === "voce" ? "justify-end" : "justify-start"}`} style={d(atraso)}>
      <div className={`max-w-[85%] rounded-2xl px-[clamp(0.8rem,1.6vw,1.2rem)] py-[clamp(0.55rem,1.3vh,0.85rem)] ap-pequeno ${de === "voce" ? "rounded-br-md bg-white text-black" : "rounded-bl-md border border-white/12 bg-white/[0.04] text-white/90"}`}>{children}</div>
    </div>
  );
}

export function ChatExemplo() {
  return (
    <div className="rounded-2xl border border-white/12 bg-[#0b0c0d] p-[clamp(0.9rem,2vw,1.5rem)]">
      <div className="mb-[clamp(0.75rem,2vh,1.25rem)] flex items-center justify-between">
        <span className="ap-pequeno font-medium text-white/80">Pergunte à AIP</span>
        <SeloExemplo />
      </div>
      <div className="space-y-[clamp(0.5rem,1.4vh,0.9rem)]">
        <Balao de="voce" atraso={300}>
          Qual o horário de pico hoje?
        </Balao>
        <Balao de="aip" atraso={800}>
          Das 18h às 19h, com 1.140 entradas. É 9% acima da média das terças.
        </Balao>
        <Balao de="voce" atraso={1400}>
          Qual acesso teve mais entradas hoje?
        </Balao>
        <Balao de="aip" atraso={1900}>
          O acesso principal, com 3.980 entradas até agora.
        </Balao>
      </div>
    </div>
  );
}

/* ------------------------------ lista de restrição (visual) ------------------------------ */

/** Silhueta numa caixa de detecção (só cantos), comparada com a lista. Sem rosto real. */
export function ListaRestricao() {
  const ativo = useAtivo();
  const C = "#5FD3FF";
  const L = "rgb(255 255 255 / 0.62)";
  const F = "rgb(255 255 255 / 0.16)";
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111214] p-[clamp(1rem,2.4vh,1.75rem)]">
      <svg viewBox="0 0 320 170" className="h-[clamp(9rem,26vh,17rem)] w-full overflow-visible" fill="none" aria-hidden>
        {/* pessoa entrando, caixa de detecção só pelos cantos */}
        <g stroke={L} strokeWidth="1.2">
          <circle cx="74" cy="46" r="13" />
          <path d="M54 76 Q74 66 94 76 L99 118 H49 Z" />
          <path d="M55 78 L44 112 M93 78 L104 112 M60 118 L57 152 M88 118 L91 152" />
        </g>
        <path d="M34 34 V22 H46 M102 22 H114 V34 M114 150 V162 H102 M46 162 H34 V150" stroke="#fff" strokeWidth="1.6" />
        {/* comparação com a lista */}
        <path d="M120 92 H176" stroke={C} strokeWidth="1.2" strokeDasharray="3 4" style={{ opacity: ativo ? 1 : 0, transition: "opacity .5s ease .6s" }} />
        <g transform="translate(184 30)">
          <rect width="120" height="124" rx="8" stroke={F} />
          <text x="12" y="20" fill="rgb(255 255 255 / 0.5)" fontSize="9" letterSpacing="1.5" fontFamily="var(--font-barlow)">
            LISTA DE RESTRIÇÃO
          </text>
          {[0, 1, 2].map((k) => (
            <g key={k} transform={`translate(12 ${32 + k * 30})`}>
              <rect width="22" height="22" rx="4" stroke={k === 1 && ativo ? C : F} style={{ transition: "stroke .4s ease 1.2s" }} />
              <circle cx="11" cy="9" r="4" stroke={L} strokeWidth="0.9" />
              <path d="M4 20 Q11 14 18 20" stroke={L} strokeWidth="0.9" />
              <rect x="30" y="5" width="62" height="4" rx="2" fill={F} />
              <rect x="30" y="13" width="40" height="4" rx="2" fill={F} />
            </g>
          ))}
        </g>
        {/* alerta para a equipe */}
        <g style={{ opacity: ativo ? 1 : 0, transition: "opacity .5s ease 1.5s" }}>
          <circle cx="114" cy="22" r="5" fill={C} />
          <circle cx="114" cy="22" r="10" stroke={C} strokeWidth="1" opacity="0.5" />
        </g>
      </svg>
      <div className="mt-[clamp(0.75rem,2vh,1.25rem)] flex items-center justify-between gap-4 border-t border-white/10 pt-[clamp(0.6rem,1.6vh,1rem)]">
        <span className="ap-pequeno font-medium text-white">Aviso para a segurança na entrada</span>
        <SeloSobProjeto />
      </div>
    </div>
  );
}

/* ------------------------------ planta: cerca digital ------------------------------ */

// Planta oficial do térreo (public/plantas/terreo.jpg, 1615 x 1000), a mesma do
// painel. Por cima: a cerca digital proposta (contorno), linhas de contagem nos
// acessos e pontos de câmera. É o que será montado, não o que já funciona.
const CERCA: [number, number][] = [
  [165, 715], [165, 430], [245, 295], [330, 160], [405, 35], [720, 22], [1150, 22], [1240, 140], [1452, 345], [1456, 800], [1400, 862], [1232, 935], [742, 940], [700, 908], [480, 908], [300, 805],
];
/** Linhas de contagem: [x1, y1, x2, y2] (entradas de pedestres e acessos do estacionamento). */
const CONTAGEM: [number, number, number, number][] = [
  [508, 728, 552, 748], // entrada principal
  [292, 478, 322, 506], // entrada oeste
  [752, 712, 790, 712], // entrada do estacionamento
  [1192, 705, 1226, 705], // entrada leste
  [165, 540, 165, 600], // acesso do estacionamento oeste
  [940, 940, 1020, 939], // acesso do estacionamento sul
  [1455, 540, 1455, 610], // acesso leste
  [860, 22, 940, 22], // acesso norte
];
const CAMERAS: [number, number][] = [
  [470, 470], [620, 420], [720, 600], [860, 690], [1050, 690], [950, 450], [1200, 470], [560, 700], [980, 860], [250, 560], [1420, 600], [800, 70],
];

export function PlantaCerca() {
  const ativo = useAtivo();
  const pontos = CERCA.map(([x, y]) => `${x},${y}`).join(" ");
  const id = useId();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
      <svg viewBox="130 0 1350 1000" className="block h-auto w-full" aria-label="Planta do Caruaru Shopping com a cerca digital proposta em volta do shopping e do estacionamento">
        <defs>
          <filter id={`${id}-cinza`}>
            <feColorMatrix type="saturate" values="0.08" />
          </filter>
          <radialGradient id={`${id}-vinheta`} cx="50%" cy="50%" r="70%">
            <stop offset="55%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.75" />
          </radialGradient>
        </defs>
        <image href="/plantas/terreo.jpg" x="0" y="0" width="1615" height="1000" filter={`url(#${id}-cinza)`} opacity="0.42" />
        {/* a planta oficial traz o logo do shopping impresso no canto: fica coberto (o logo vai inteiro na capa) */}
        <rect x="1362" y="20" width="130" height="285" fill="rgb(66 66 66)" />
        <rect x="130" y="0" width="1350" height="1000" fill={`url(#${id}-vinheta)`} />
        {/* área dentro da cerca, bem leve */}
        <polygon points={pontos} fill="rgb(95 211 255 / 0.05)" style={{ opacity: ativo ? 1 : 0, transition: "opacity 1s ease 1.8s" }} />
        {/* a cerca sendo desenhada */}
        <polygon points={pontos} fill="none" stroke="#5FD3FF" strokeWidth="3.2" strokeLinejoin="round" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: ativo ? 0 : 1, transition: "stroke-dashoffset 2.4s cubic-bezier(.45,.05,.35,1) .3s" }} />
        {/* linhas de contagem acendendo */}
        {CONTAGEM.map(([x1, y1, x2, y2], i) => (
          <g key={i} style={{ opacity: ativo ? 1 : 0, transition: `opacity .45s ease ${2.6 + i * 0.18}s` }}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth="7" strokeLinecap="round" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5FD3FF" strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}
        {/* pontos de câmera */}
        {CAMERAS.map(([x, y], i) => (
          <g key={i} style={{ opacity: ativo ? 1 : 0, transition: `opacity .4s ease ${1.2 + i * 0.08}s` }}>
            <circle cx={x} cy={y} r="16" fill="rgb(255 255 255 / 0.08)" />
            <circle cx={x} cy={y} r="6.5" fill="#fff" />
          </g>
        ))}
      </svg>
      <div className="absolute bottom-[clamp(0.5rem,1.4vh,0.9rem)] left-[clamp(0.6rem,1.4vw,1rem)] flex flex-wrap gap-x-5 gap-y-1 text-[clamp(0.6rem,1.15vh,0.8rem)] text-white/70">
        <span className="flex items-center gap-2">
          <span className="h-[2px] w-5 bg-[#5FD3FF]" /> Cerca digital
        </span>
        <span className="flex items-center gap-2">
          <span className="h-[3px] w-3 rounded-full bg-[#5FD3FF] ring-2 ring-white/60" /> Linha de contagem
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white" /> Câmera
        </span>
      </div>
    </div>
  );
}

/* ------------------------------ estacionamento ------------------------------ */

/** Recorte do estacionamento da planta, com caixas (só cantos) em volta de carros e uma placa lida (fictícia e borrada). */
export function Estacionamento() {
  const ativo = useAtivo();
  const id = useId();
  const caixas: [number, number, number, number][] = [
    [862, 846, 18, 28],
    [935, 846, 18, 28],
    [1062, 846, 18, 28],
    [1150, 846, 18, 28],
  ];
  const k = 5;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111214]">
      <div className="relative">
        <svg viewBox="745 788 470 140" className="block h-auto w-full" aria-hidden>
          <defs>
            <filter id={`${id}-cinza`}>
              <feColorMatrix type="saturate" values="0.15" />
            </filter>
            <filter id={`${id}-borra`}>
              <feGaussianBlur stdDeviation="1.6" />
            </filter>
          </defs>
          <image href="/plantas/terreo.jpg" x="0" y="0" width="1615" height="1000" filter={`url(#${id}-cinza)`} opacity="0.55" />
          {caixas.map(([x, y, w, h], i) => (
            <path
              key={i}
              d={`M${x} ${y + k} V${y} H${x + k} M${x + w - k} ${y} H${x + w} V${y + k} M${x + w} ${y + h - k} V${y + h} H${x + w - k} M${x + k} ${y + h} H${x} V${y + h - k}`}
              stroke={i === 2 ? "#5FD3FF" : "#fff"}
              strokeWidth="1.4"
              fill="none"
              style={{ opacity: ativo ? 1 : 0, transition: `opacity .4s ease ${0.4 + i * 0.2}s` }}
            />
          ))}
          {/* etiqueta da placa lida (fictícia e borrada) */}
          <g style={{ opacity: ativo ? 1 : 0, transition: "opacity .5s ease 1.4s" }}>
            <path d="M1071 846 L1086 826" stroke="#5FD3FF" strokeWidth="1" />
            <rect x="1086" y="808" width="96" height="24" rx="4" fill="rgb(0 0 0 / 0.85)" stroke="#5FD3FF" strokeWidth="1" />
            <text x="1093" y="818" fill="#5FD3FF" fontSize="6.5" letterSpacing="0.8" fontFamily="var(--font-barlow)">
              PLACA LIDA
            </text>
            <g filter={`url(#${id}-borra)`}>
              <text x="1093" y="828" fill="#fff" fontSize="8.5" fontWeight="600" letterSpacing="1.6" fontFamily="var(--font-barlow-condensed)">
                ABC1D23
              </text>
            </g>
          </g>
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-px border-t border-white/10 bg-white/10">
        {(
          [
            ["Veículos agora", "612"],
            ["Ocupação", "74%"],
            ["Permanência média", "1h52"],
          ] as [string, string][]
        ).map(([r, v]) => (
          <div key={r} className="bg-[#111214] px-[clamp(0.7rem,1.4vw,1.1rem)] py-[clamp(0.6rem,1.4vh,0.9rem)]">
            <p className="text-[clamp(0.6rem,1.1vh,0.78rem)] text-white/50">{r}</p>
            <p className="ap-num mt-1 text-[clamp(1.2rem,min(2vw,3.4vh),2.1rem)] font-bold leading-none">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-end border-t border-white/10 px-4 py-2">
        <SeloExemplo />
      </div>
    </div>
  );
}

/* ------------------------------ economia (calculadora) ------------------------------ */

const MIN_CAM = 10;
const MAX_CAM = 300;

/** "R$ 130 mil", "R$ 1,3 milhão", "R$ 4,2 milhões" (mesma escrita da calculadora do site). */
function reaisCurto(v: number) {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `R$ ${m.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${m < 2 ? "milhão" : "milhões"}`;
  }
  return `R$ ${Math.round(v / 1000).toLocaleString("pt-BR")} mil`;
}

/**
 * A economia é a protagonista: câmeras novas com IA embarcada (barra cheia,
 * cinza, valor discreto) x a AIP nas câmeras atuais (barra curta, ciano, sem
 * valor). Em destaque, o percentual; embaixo, a economia em R$ que acompanha
 * o controle. Nunca mostra o valor da AIP.
 */
export function Economia({ inicial = 120 }: { inicial?: number }) {
  const ativo = useAtivo();
  const id = useId();
  const [qtd, setQtd] = useState(inicial);
  const pct = ECONOMIA.economiaPercentual;
  const trocaMin = qtd * ECONOMIA.precoMinimo;
  const trocaMax = qtd * ECONOMIA.precoMaximo;
  // Barra cheia cresce com a quantidade (como no site); a da AIP é ~20% dela.
  const larguraTroca = 45 + ((qtd - MIN_CAM) / (MAX_CAM - MIN_CAM)) * 55;
  const larguraAip = larguraTroca * (1 - pct / 100);
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111214] p-[clamp(1.1rem,2.6vh,2.25rem)]">
      {/* 1. controle */}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <label htmlFor={`${id}-qtd`} className="ap-pequeno font-medium">
          Câmeras do shopping
        </label>
        <span className="flex items-center gap-3">
          <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[clamp(0.55rem,1vh,0.7rem)] font-medium uppercase tracking-[0.16em] text-white/50">Estimativa</span>
          <span className="ap-num text-[clamp(1.8rem,min(3vw,5.4vh),3.2rem)] font-bold leading-none tabular-nums" aria-hidden>
            {qtd}
          </span>
        </span>
      </div>
      <input
        id={`${id}-qtd`}
        type="range"
        min={MIN_CAM}
        max={MAX_CAM}
        step={5}
        value={qtd}
        onChange={(e) => setQtd(Number(e.target.value))}
        aria-valuetext={`${qtd} câmeras`}
        className="controle-calc mt-[clamp(0.6rem,1.6vh,1rem)] w-full"
        style={{ "--pos": `${((qtd - MIN_CAM) / (MAX_CAM - MIN_CAM)) * 100}%` } as React.CSSProperties}
      />

      {/* 2. comparação */}
      <div className="mt-[clamp(1.25rem,3.4vh,2.25rem)] space-y-[clamp(0.9rem,2.4vh,1.5rem)]">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="ap-pequeno text-white/75">Câmeras novas com IA embarcada</p>
            <p className="text-[clamp(0.6rem,1.1vh,0.78rem)] tabular-nums text-white/40">
              referência de mercado: {reaisCurto(trocaMin)} a {reaisCurto(trocaMax)}
            </p>
          </div>
          <div className="mt-2 h-[clamp(1.5rem,3.6vh,2.25rem)] rounded-lg bg-white/[0.04]">
            <div className="h-full rounded-lg bg-white/30 transition-[width] duration-700 ease-out" style={{ width: ativo ? `${larguraTroca}%` : "0%" }} />
          </div>
        </div>
        <div>
          <p className="ap-pequeno text-white">Com a AIP, usando as câmeras atuais</p>
          <div className="mt-2 flex h-[clamp(1.5rem,3.6vh,2.25rem)] items-center gap-3 rounded-lg">
            <div className="h-full rounded-lg bg-[#5FD3FF] transition-[width] delay-150 duration-700 ease-out" style={{ width: ativo ? `${larguraAip}%` : "0%" }} />
            <span className="whitespace-nowrap font-titulo text-[clamp(0.95rem,min(1.4vw,2.4vh),1.4rem)] font-semibold text-[#5FD3FF]">≈ {pct}% menos</span>
          </div>
        </div>
      </div>

      {/* 3 e 4. destaque */}
      <div className="mt-[clamp(1.25rem,3.4vh,2.25rem)] border-t border-white/10 pt-[clamp(1.25rem,3.4vh,2.25rem)]">
        <div className="flex flex-wrap items-end gap-x-[clamp(0.75rem,1.6vw,1.5rem)] gap-y-1">
          <p className="ap-num text-[clamp(3.25rem,min(7vw,12vh),8rem)] font-bold leading-[0.85] text-[#5FD3FF]">≈ {pct}%</p>
          <p className="pb-[0.3em] ap-texto text-white/85">de economia em média neste projeto</p>
        </div>
        <p className="mt-[clamp(0.75rem,2vh,1.25rem)] ap-pequeno tabular-nums text-white/70">
          Economia estimada: <span className="font-medium text-white">{reaisCurto(trocaMin * (pct / 100))} a {reaisCurto(trocaMax * (pct / 100))}</span>
        </p>
      </div>

      {/* 5. nota */}
      <p className="mt-[clamp(1rem,2.6vh,1.6rem)] text-[clamp(0.6rem,1.1vh,0.78rem)] leading-relaxed text-white/45">Valores de referência. O cálculo final depende do levantamento das câmeras.</p>
    </div>
  );
}

/* ------------------------------ mapa de calor sobre a planta ------------------------------ */

// Mesma lógica do mapa de calor simulado do painel (/shopping-caruaru), sem
// alterá-lo: simulação de um dia inteiro, grade de 125 x 70 sobre a planta de
// 1000 x 560, calor só onde se anda (corredores, estacionamento, entradas),
// escala pelo percentil 92 e a mesma rampa azul → verde → amarelo → vermelho.
const GW = 125;
const GH = 70;

function dentroPoli(x: number, y: number, p: Poligono): boolean {
  let dentro = false;
  for (const anel of p)
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
      const [xi, yi] = anel[i];
      const [xj, yj] = anel[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
  return dentro;
}

function corCalor(v: number): [number, number, number, number] {
  const pares: [number, [number, number, number]][] = [
    [0, [59, 130, 246]],
    [0.35, [16, 185, 129]],
    [0.65, [250, 204, 21]],
    [1, [220, 38, 38]],
  ];
  let i = 0;
  while (i < pares.length - 2 && v > pares[i + 1][0]) i++;
  const [a, ca] = pares[i];
  const [b, cb] = pares[i + 1];
  const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return [ca[0] + (cb[0] - ca[0]) * k, ca[1] + (cb[1] - ca[1]) * k, ca[2] + (cb[2] - ca[2]) * k, Math.min(225, 80 + v * 300)];
}

/** Calcula a imagem do calor do térreo (dia inteiro simulado) num canvas 125 x 70. */
function desenharCalor(canvas: HTMLCanvasElement) {
  const sim = simular([], 20261012);
  const am = sim.amostras;
  const grade = new Float32Array(GW * GH);
  for (let i = 0; i < am.t.length; i++) {
    if (am.andar[i] !== 0) continue;
    const gx = Math.floor(am.x[i] / 8);
    const gy = Math.floor(am.y[i] / 8);
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const x = gx + dx;
        const y = gy + dy;
        if (x < 0 || y < 0 || x >= GW || y >= GH) continue;
        grade[y * GW + x] += Math.exp(-(dx * dx + dy * dy) / 3);
      }
  }
  const polis = [...ESBOCO.T.corredores, ...ESBOCO.T.estacionamento];
  const entradas = ENTRADAS_PLANTA.filter((e) => e.andar === "T").map((e) => e.rect);
  const masc = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++)
    for (let i = 0; i < GW; i++) {
      const x = (i + 0.5) * 8;
      const y = (j + 0.5) * 8;
      if (polis.some((p) => dentroPoli(x, y, p)) || entradas.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)) masc[j * GW + i] = 1;
    }
  const vals: number[] = [];
  for (let i = 0; i < grade.length; i++) if (masc[i] && grade[i] > 0) vals.push(grade[i]);
  vals.sort((a, b) => a - b);
  const max = vals.length ? vals[Math.floor(vals.length * 0.92)] : 0;
  canvas.width = GW;
  canvas.height = GH;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(GW, GH);
  for (let i = 0; i < grade.length; i++) {
    if (!masc[i] || grade[i] <= 0 || !max) continue;
    img.data.set(corCalor(Math.min(1, Math.sqrt(grade[i] / max))), i * 4);
  }
  ctx.putImageData(img, 0, 0);
}

export function MapaCalorPlanta() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const ativo = useAtivo();
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    // A simulação leva um instante: só roda no navegador, logo depois de abrir a página.
    const t = window.setTimeout(() => {
      if (canvas.current) desenharCalor(canvas.current);
      setPronto(true);
    }, 50);
    return () => window.clearTimeout(t);
  }, []);
  const f = FUNDO.T;
  return (
    <div className="relative overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "1000 / 500" }}>
      <div className="absolute inset-x-0" style={{ top: "-6%", height: "112%" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- planta oficial do térreo, a mesma do painel. */}
      <img src={f.src} alt="Planta do térreo do Caruaru Shopping com o mapa de calor simulado" className="absolute select-none opacity-[0.38] grayscale" style={{ left: `${(f.x / 1000) * 100}%`, top: `${(f.y / 560) * 100}%`, width: `${(f.w / 1000) * 100}%`, height: `${(f.h / 560) * 100}%` }} draggable={false} />
      {/* a planta oficial traz o logo do shopping impresso no canto: fica coberto */}
      <span aria-hidden className="absolute bg-[rgb(60_60_60)]" style={{ left: `${((f.x + 1330 * 0.56) / 1000) * 100}%`, top: `${((20 * 0.56) / 560) * 100}%`, width: `${((240 * 0.56) / 1000) * 100}%`, height: `${((285 * 0.56) / 560) * 100}%` }} />
      <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full transition-opacity duration-1000 [filter:blur(5px)_saturate(1.15)]" style={{ opacity: pronto && ativo ? 0.95 : 0 }} />
      </div>
    </div>
  );
}
