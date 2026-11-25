"use client";

import { useId, type ReactNode } from "react";
import { MiniVisual, type VisualId } from "../../(site)/_components/MiniVisuais";
import { d, useAtivo } from "../_compartilhado/slide";

// Visuais da apresentação do Bonanza. Ilustrações em linha fina no estilo do site
// (branco ~70% com acento ciano). Nada vem de câmera real: números são de
// demonstração (selo EXEMPLO), sem rostos, marcas de outros supermercados ou placas legíveis.

const C = "#5FD3FF";
const L = "rgb(255 255 255 / 0.62)";
const F = "rgb(255 255 255 / 0.16)";
const R = "#f87171";

/** Logo oficial do Bonanza Supermercados (PNG transparente, cores originais). */
export function LogoBonanza({ className = "" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- logo do cliente, arquivo pronto em PNG transparente.
  return <img src="/clientes/bonanza.png" alt="Bonanza Supermercados" className={`w-auto select-none ${className}`} draggable={false} />;
}

export function SeloExemplo({ className = "" }: { className?: string }) {
  return <span className={`shrink-0 rounded-full border border-white/20 px-2.5 py-0.5 text-[clamp(0.55rem,1vh,0.7rem)] font-medium uppercase tracking-[0.16em] text-white/50 ${className}`}>Exemplo</span>;
}

export function SeloOpcional({ className = "" }: { className?: string }) {
  return <span className={`shrink-0 rounded-full border border-[#5FD3FF]/50 px-2.5 py-0.5 text-[clamp(0.55rem,1vh,0.7rem)] font-medium uppercase tracking-[0.16em] text-[#5FD3FF] ${className}`}>Opcional</span>;
}

/** Mini gráfico do site, animado quando o slide aparece. */
export function Mini({ id }: { id: VisualId }) {
  const ativo = useAtivo();
  return (
    <div className={`cartao-uso h-full w-full ${ativo ? "ativo" : ""}`}>
      <MiniVisual id={id} ativo={ativo} />
    </div>
  );
}

/** Caixa de detecção só pelos cantos. */
function Cantos({ x, y, w, h, k = 8, cor = C, largura = 1.6 }: { x: number; y: number; w: number; h: number; k?: number; cor?: string; largura?: number }) {
  return <path d={`M${x} ${y + k} V${y} H${x + k} M${x + w - k} ${y} H${x + w} V${y + k} M${x + w} ${y + h - k} V${y + h} H${x + w - k} M${x + k} ${y + h} H${x} V${y + h - k}`} stroke={cor} strokeWidth={largura} fill="none" />;
}

/** Cartão padrão: visual em cima, título, uma linha e o dado de exemplo. */
export function Cartao({ visual, titulo, texto, exemplo, atraso = 0, selo, alto = "h-[clamp(5.5rem,14vh,9.5rem)]" }: { visual: ReactNode; titulo: string; texto: string; exemplo?: string; atraso?: number; selo?: ReactNode; alto?: string }) {
  return (
    <div className="ap-in flex flex-col rounded-2xl border border-white/10 bg-[#111214] p-[clamp(0.9rem,1.6vw,1.4rem)]" style={d(atraso)}>
      <div className={alto}>{visual}</div>
      <h3 className="mt-[clamp(0.6rem,1.6vh,1rem)] font-titulo text-[clamp(1.15rem,min(1.6vw,2.9vh),1.85rem)] font-bold leading-[1.05]">{titulo}</h3>
      <p className="mt-1 ap-pequeno text-white/65">{texto}</p>
      {exemplo && (
        <div className="mt-auto pt-[clamp(0.6rem,1.6vh,1rem)]">
          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-[clamp(0.5rem,1.2vh,0.8rem)]">
            <span className="text-[clamp(0.65rem,1.2vh,0.85rem)] font-medium text-white">{exemplo}</span>
            {selo ?? <SeloExemplo />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ ruptura de gôndola ------------------------------ */

// Gôndola de frente: 4 prateleiras com embalagens genéricas (sem marca). Na 2ª, um vão.
const PRAT = [40, 95, 150, 205];
function produtos(y: number, vaoDe?: number, vaoAte?: number) {
  const itens: ReactNode[] = [];
  let x = 26;
  let k = 0;
  while (x < 392) {
    const w = 18 + ((k * 7) % 3) * 5;
    const h = 30 + ((k * 5) % 4) * 4;
    if (!(vaoDe !== undefined && vaoAte !== undefined && x + w > vaoDe && x < vaoAte)) itens.push(<rect key={`${y}-${k}`} x={x} y={y - h} width={w} height={h} rx="2.5" stroke={L} strokeWidth="1" fill="rgb(255 255 255 / 0.025)" />);
    x += w + 5;
    k++;
  }
  return itens;
}

export function Gondola({ mini = false }: { mini?: boolean }) {
  const ativo = useAtivo();
  const id = useId();
  return (
    <svg viewBox={mini ? "190 50 170 60" : "0 0 420 232"} className="block h-auto w-full" fill="none" strokeLinecap="round" aria-hidden={mini} aria-label={mini ? undefined : "Gôndola com um espaço vazio na segunda prateleira, marcado pela inteligência artificial"}>
      <defs>
        <linearGradient id={`${id}-v`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={C} stopOpacity="0.16" />
          <stop offset="1" stopColor={C} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <rect x="14" y="6" width="392" height="216" rx="6" stroke={F} />
      {PRAT.map((y) => (
        <path key={y} d={`M14 ${y} H406`} stroke="rgb(255 255 255 / 0.35)" strokeWidth="1.4" />
      ))}
      {produtos(PRAT[0])}
      {produtos(PRAT[1], 205, 345)}
      {produtos(PRAT[2])}
      {produtos(PRAT[3])}
      {/* vão detectado */}
      <rect x="206" y="58" width="138" height="36" rx="3" fill={`url(#${id}-v)`} style={{ opacity: ativo ? 1 : 0, transition: "opacity .5s ease 1.3s" }} />
      <g style={{ opacity: ativo ? 1 : 0, transition: "opacity .4s ease 1s" }}>
        <Cantos x={202} y={54} w={146} h={44} k={9} />
      </g>
      {!mini && (
        <>
          {/* varredura da câmera */}
          <rect x="14" y="6" width="3" height="216" fill={C} opacity="0.5" style={{ transform: ativo ? "translateX(389px)" : "translateX(0)", opacity: ativo ? 0 : 0.5, transition: "transform 1.1s cubic-bezier(.45,.05,.35,1) .2s, opacity .3s ease 1.2s" }} />
          <g style={{ opacity: ativo ? 1 : 0, transition: "opacity .4s ease 1.5s" }}>
            <rect x="282" y="34" width="66" height="15" rx="3" fill="rgb(0 0 0 / 0.85)" stroke={C} strokeWidth="0.8" />
            <text x="315" y="44.5" fill={C} fontSize="7.5" letterSpacing="1" textAnchor="middle" fontFamily="var(--font-barlow)">
              40% VAZIO
            </text>
          </g>
        </>
      )}
    </svg>
  );
}

/** Cartão de alerta que chega ao painel, com a foto do trecho vazio. */
export function AlertaRuptura() {
  return (
    <div className="ap-in rounded-2xl border border-[#5FD3FF]/40 bg-[#0b0c0d] p-[clamp(0.9rem,1.8vw,1.4rem)] shadow-[0_24px_60px_rgb(0_0_0/0.55)]" style={d(1700)}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 ap-pequeno font-medium text-[#5FD3FF]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5FD3FF] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5FD3FF]" />
          </span>
          Ruptura detectada
        </span>
        <SeloExemplo />
      </div>
      <div className="mt-[clamp(0.6rem,1.6vh,1rem)] overflow-hidden rounded-lg border border-white/10 bg-black">
        <Gondola mini />
      </div>
      <p className="mt-[clamp(0.6rem,1.6vh,1rem)] font-titulo text-[clamp(1.1rem,min(1.6vw,2.8vh),1.7rem)] font-bold leading-tight">Corredor 5 · Biscoitos · 40% vazio</p>
      <p className="mt-1 text-[clamp(0.6rem,1.1vh,0.78rem)] text-white/50">Foto às 10h42 · aviso enviado para a reposição</p>
    </div>
  );
}

/* ------------------------------ filas nos caixas ------------------------------ */

const FILAS = [2, 6, 3, 1, 0];
const LIMITE = 4;
const ESPERA = [2, 2.5, 3.5, 5.5, 6, 4, 3, 3.5, 4.5, 6.5, 7, 5, 3];

export function Caixas() {
  const ativo = useAtivo();
  const w = 420;
  const max = Math.max(...ESPERA);
  const pts = ESPERA.map((v, i) => [20 + (i * (w - 40)) / (ESPERA.length - 1), 92 - (v / max) * 64] as const);
  const linha = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const pico = ESPERA.indexOf(max);
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111214] p-[clamp(0.9rem,1.8vw,1.4rem)]">
      <div className="flex items-center justify-between gap-3">
        <span className="ap-pequeno font-medium text-white/80">Pessoas na fila por caixa</span>
        <SeloExemplo />
      </div>
      <svg viewBox="0 0 420 150" className="mt-2 block h-auto w-full" fill="none" strokeLinecap="round" aria-label="Cinco caixas vistos de cima; o caixa 2 passou do limite de quatro pessoas na fila">
        <path d={`M10 ${118 - LIMITE * 18} H410`} stroke={C} strokeWidth="0.8" strokeDasharray="3 4" opacity="0.6" />
        <text x="410" y={114 - LIMITE * 18} fill={C} fontSize="8" textAnchor="end" fontFamily="var(--font-barlow)" opacity="0.8">
          limite
        </text>
        {FILAS.map((n, c) => {
          const x = 30 + c * 80;
          const alto = n > LIMITE;
          return (
            <g key={c}>
              <rect x={x} y="122" width="46" height="14" rx="3" stroke={n === 0 ? F : L} strokeWidth="1" />
              <text x={x + 23} y="147" fill="rgb(255 255 255 / 0.45)" fontSize="8.5" textAnchor="middle" fontFamily="var(--font-barlow)">
                Caixa {c + 1}
                {n === 0 ? " (fechado)" : ""}
              </text>
              {Array.from({ length: n }, (_, k) => (
                <circle key={k} cx={x + 23} cy={110 - k * 18} r="6" stroke={alto ? C : L} strokeWidth="1.2" fill={alto ? "rgb(95 211 255 / 0.15)" : "none"} style={{ opacity: ativo ? 1 : 0, transition: `opacity .3s ease ${0.3 + c * 0.12 + k * 0.08}s` }} />
              ))}
              {alto && (
                <g style={{ opacity: ativo ? 1 : 0, transition: "opacity .4s ease 1.3s" }}>
                  <Cantos x={x + 9} y={110 - (n - 1) * 18 - 10} w={28} h={(n - 1) * 18 + 20} k={6} largura={1.3} />
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="ap-in mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[#5FD3FF]/40 bg-[#5FD3FF]/[0.06] px-3 py-2" style={d(1500)}>
        <span className="font-titulo text-[clamp(1rem,min(1.4vw,2.5vh),1.5rem)] font-bold text-[#5FD3FF]">Abrir mais um caixa</span>
        <span className="ap-pequeno text-white/70">Caixa 2 com 6 pessoas na fila</span>
      </div>
      <div className="mt-[clamp(0.75rem,2vh,1.25rem)] border-t border-white/10 pt-[clamp(0.6rem,1.6vh,1rem)]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[clamp(0.6rem,1.1vh,0.78rem)] text-white/50">Espera média por horário</span>
          <span className="text-[clamp(0.6rem,1.1vh,0.78rem)] font-medium text-white">18h: 7 min</span>
        </div>
        <svg viewBox={`0 0 ${w} 104`} className="mt-1 block h-[clamp(3.5rem,9vh,6rem)] w-full overflow-visible" fill="none" aria-hidden>
          <path d={`${linha} L${w - 20} 96 L20 96 Z`} fill="rgb(95 211 255 / 0.08)" />
          <path d={linha} stroke={C} strokeWidth="1.8" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: ativo ? 0 : 1, transition: "stroke-dashoffset 1.6s cubic-bezier(.22,1,.36,1) .5s" }} />
          <circle cx={pts[pico][0]} cy={pts[pico][1]} r="4" fill={C} className="ap-fade" style={d(1900)} />
          {[8, 11, 14, 17, 20].map((h) => (
            <text key={h} x={20 + ((h - 8) * (w - 40)) / 12} y="104" fill="rgb(255 255 255 / 0.4)" fontSize="10" textAnchor="middle" fontFamily="var(--font-barlow)">
              {h}h
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------ operação ------------------------------ */

/** Corredor visto de cima: poça no chão (marcada), caixa largada e carrinhos acumulados. */
export function Riscos() {
  const ativo = useAtivo();
  return (
    <svg viewBox="0 0 240 120" className="h-full w-full overflow-visible" fill="none" strokeLinecap="round" aria-hidden>
      <path d="M20 12 H220 M20 108 H220" stroke={F} strokeWidth="6" />
      <path d="M20 60 H220" stroke={F} strokeDasharray="4 6" />
      <ellipse cx="70" cy="62" rx="22" ry="11" stroke={L} fill="rgb(255 255 255 / 0.04)" />
      <path d="M58 60 q6 -5 12 0 t12 0" stroke={L} strokeWidth="0.8" />
      <g style={{ opacity: ativo ? 1 : 0, transition: "opacity .4s ease .8s" }}>
        <Cantos x={42} y={45} w={56} h={34} k={7} largura={1.4} />
      </g>
      <rect x="128" y="74" width="24" height="18" rx="2" stroke={L} />
      <path d="M128 80 H152" stroke={F} />
      {[0, 1, 2].map((k) => (
        <g key={k} transform={`translate(${168 + k * 9} ${24 + k * 2})`}>
          <path d="M0 0 H26 L22 18 H4 Z" stroke={L} />
          <circle cx="7" cy="23" r="2" stroke={L} />
          <circle cx="19" cy="23" r="2" stroke={L} />
        </g>
      ))}
      <g style={{ opacity: ativo ? 1 : 0, transition: "opacity .4s ease 1.2s" }}>
        <circle cx="98" cy="45" r="4" fill={C} />
        <circle cx="98" cy="45" r="8" stroke={C} opacity="0.5" />
      </g>
    </svg>
  );
}

/** Porta da câmara fria aberta com o tempo correndo. */
export function CamaraFria() {
  const ativo = useAtivo();
  return (
    <svg viewBox="0 0 240 120" className="h-full w-full overflow-visible" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="36" y="10" width="92" height="104" rx="4" stroke={F} />
      <path d="M44 18 V106" stroke={F} />
      <path d="M44 18 L96 30 V112 L44 106 Z" stroke={L} fill="rgb(255 255 255 / 0.03)" style={{ transformOrigin: "44px 60px", transform: ativo ? "none" : "scaleX(0.2)", transition: "transform .8s cubic-bezier(.22,1,.36,1) .3s" }} />
      <path d="M86 66 V74" stroke={L} strokeWidth="2" />
      <path d="M58 40 l4 4 m0 -4 l-4 4 M70 52 l4 4 m0 -4 l-4 4" stroke={L} strokeWidth="0.9" />
      <circle cx="178" cy="56" r="28" stroke={F} strokeWidth="3" />
      <circle cx="178" cy="56" r="28" stroke={C} strokeWidth="3" pathLength={1} strokeDasharray="1" transform="rotate(-90 178 56)" style={{ strokeDashoffset: ativo ? 0.28 : 1, transition: "stroke-dashoffset 1.6s ease .5s" }} />
      <text x="178" y="60" fill="#fff" fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="var(--font-barlow-condensed)">
        6 min
      </text>
      <text x="178" y="104" fill="rgb(255 255 255 / 0.45)" fontSize="8.5" textAnchor="middle" fontFamily="var(--font-barlow)">
        porta aberta
      </text>
    </svg>
  );
}

/* ------------------------------ recebimento e higiene ------------------------------ */

/** Caminhão encostado na doca com o tempo de descarga. */
export function Doca() {
  const ativo = useAtivo();
  return (
    <svg viewBox="0 0 240 120" className="h-full w-full overflow-visible" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 86 H228" stroke={F} />
      <rect x="150" y="34" width="78" height="52" stroke={F} />
      <path d="M156 40 H222 M156 46 H222" stroke={F} strokeWidth="0.8" />
      <g style={{ transform: ativo ? "translateX(0)" : "translateX(-40px)", opacity: ativo ? 1 : 0, transition: "transform 1s cubic-bezier(.22,1,.36,1) .2s, opacity .4s ease .2s" }}>
        <rect x="58" y="30" width="88" height="48" rx="2" stroke={L} fill="rgb(255 255 255 / 0.03)" />
        <path d="M58 44 H30 L18 58 V78 H58" stroke={L} />
        <path d="M24 58 H50 V46" stroke={L} strokeWidth="0.9" />
        <circle cx="36" cy="82" r="7" stroke={L} />
        <circle cx="96" cy="82" r="7" stroke={L} />
        <circle cx="126" cy="82" r="7" stroke={L} />
        <Cantos x={10} y={22} w={142} h={70} k={9} largura={1.3} />
      </g>
      <g style={{ opacity: ativo ? 1 : 0, transition: "opacity .4s ease 1.1s" }}>
        <rect x="12" y="100" width="216" height="5" rx="2.5" fill={F} />
        <rect x="12" y="100" width="216" height="5" rx="2.5" fill={C} style={{ transformOrigin: "12px 0", transform: ativo ? "scaleX(0.7)" : "scaleX(0)", transition: "transform 1.4s ease 1.2s" }} />
      </g>
    </svg>
  );
}

/** Touca e luva: uma conferida (ciano), outra faltando (vermelho). Sem rosto. */
export function EpiAlimentos() {
  const ativo = useAtivo();
  return (
    <svg viewBox="0 0 240 120" className="h-full w-full overflow-visible" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* cabeça com touca, sem rosto */}
      <circle cx="70" cy="62" r="20" stroke={L} />
      <path d="M48 56 Q50 30 70 30 Q90 30 92 56 Q70 48 48 56 Z" stroke={C} fill="rgb(95 211 255 / 0.12)" style={{ opacity: ativo ? 1 : 0.2, transition: "opacity .4s ease .6s" }} />
      <path d="M50 86 Q70 76 90 86 V112 H50 Z" stroke={L} />
      <g style={{ opacity: ativo ? 1 : 0, transition: "opacity .4s ease .9s" }}>
        <Cantos x={42} y={24} w={56} h={40} k={7} largura={1.3} />
        <path d="M100 20 l4 4 l8 -9" stroke={C} strokeWidth="1.6" />
      </g>
      {/* mão sem luva */}
      <path d="M150 104 V70 q0 -6 6 -6 q6 0 6 6 V58 q0 -6 6 -6 q6 0 6 6 V62 q0 -6 6 -6 q6 0 6 6 V72 q0 -6 6 -6 q6 0 6 6 V92 q0 14 -14 18 H164 Q150 110 150 104 Z" stroke={L} />
      <g style={{ opacity: ativo ? 1 : 0, transition: "opacity .4s ease 1.3s" }}>
        <Cantos x={142} y={44} w={70} h={70} k={8} cor={R} largura={1.3} />
        <path d="M218 32 L226 44 H210 Z" stroke={R} strokeWidth="1.3" />
        <path d="M218 37 V40" stroke={R} strokeWidth="1.3" />
      </g>
    </svg>
  );
}

/* ------------------------------ estacionamento ------------------------------ */

/** Carro visto de trás com a placa lida (fictícia e borrada). */
export function PlacaBorrada() {
  const ativo = useAtivo();
  const id = useId();
  return (
    <svg viewBox="0 0 240 120" className="h-full w-full overflow-visible" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <defs>
        <filter id={`${id}-b`}>
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>
      <path d="M50 84 V58 Q52 46 64 44 L84 26 H156 L176 44 Q188 46 190 58 V84 Z" stroke={L} />
      <path d="M90 32 H150 L164 44 H76 Z" stroke={F} />
      <rect x="58" y="54" width="22" height="10" rx="2" stroke={L} strokeWidth="0.9" />
      <rect x="160" y="54" width="22" height="10" rx="2" stroke={L} strokeWidth="0.9" />
      <rect x="98" y="62" width="44" height="14" rx="2" stroke="#fff" />
      <g filter={`url(#${id}-b)`}>
        <text x="120" y="73" fill="#fff" fontSize="10" fontWeight="600" letterSpacing="1.6" textAnchor="middle" fontFamily="var(--font-barlow-condensed)">
          ABC1D23
        </text>
      </g>
      <path d="M54 84 V96 H72 V84 M168 84 V96 H186 V84" stroke={L} />
      <g style={{ opacity: ativo ? 1 : 0, transition: "opacity .4s ease .9s" }}>
        <Cantos x={92} y={56} w={56} h={26} k={6} largura={1.3} />
        <path d="M148 62 L170 18" stroke={C} strokeWidth="0.9" />
        <rect x="168" y="6" width="62" height="18" rx="3" fill="rgb(0 0 0 / 0.85)" stroke={C} strokeWidth="0.8" />
        <text x="199" y="18" fill={C} fontSize="7" letterSpacing="1" textAnchor="middle" fontFamily="var(--font-barlow)">
          PARADO 3H10
        </text>
      </g>
    </svg>
  );
}

/* ------------------------------ gestão comercial ------------------------------ */

/** Entradas x cupons emitidos, com a conversão. */
export function Conversao() {
  const ativo = useAtivo();
  const linhas: [string, number, string][] = [
    ["Entradas", 100, "3.420"],
    ["Cupons", 68, "2.326"],
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-[clamp(0.45rem,1.2vh,0.8rem)]">
      {linhas.map(([nome, pct, v], i) => (
        <div key={nome}>
          <div className="flex justify-between text-[clamp(0.6rem,1.15vh,0.8rem)] text-white/70">
            <span>{nome}</span>
            <span className="ap-num text-white">{v}</span>
          </div>
          <div className="mt-1 h-[clamp(0.5rem,1.2vh,0.75rem)] rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-[#5FD3FF] transition-[width] duration-1000 ease-out" style={{ width: ativo ? `${pct}%` : "0%", transitionDelay: `${400 + i * 200}ms`, opacity: i ? 1 : 0.45 }} />
          </div>
        </div>
      ))}
      <p className="ap-num text-[clamp(1.4rem,min(2.2vw,3.8vh),2.4rem)] font-bold leading-none text-[#5FD3FF]">68% de conversão</p>
    </div>
  );
}

/** Ponta de gôndola com pessoas parando (pontos com anel de tempo). */
export function PontaGondola() {
  const ativo = useAtivo();
  return (
    <svg viewBox="0 0 240 120" className="h-full w-full overflow-visible" fill="none" strokeLinecap="round" aria-hidden>
      <rect x="20" y="26" width="58" height="70" rx="4" stroke={L} />
      {[42, 62, 82].map((y) => (
        <path key={y} d={`M20 ${y} H78`} stroke={F} />
      ))}
      <path d="M86 20 V104" stroke={C} strokeWidth="0.9" strokeDasharray="3 4" />
      {(
        [
          [118, 40, 0.75],
          [140, 74, 0.45],
          [178, 52, 0.9],
          [206, 90, 0.2],
        ] as [number, number, number][]
      ).map(([x, y, p], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="11" stroke={F} strokeWidth="2.2" />
          <circle cx={x} cy={y} r="11" stroke={C} strokeWidth="2.2" pathLength={1} strokeDasharray="1" transform={`rotate(-90 ${x} ${y})`} style={{ strokeDashoffset: ativo ? 1 - p : 1, transition: `stroke-dashoffset 1.2s ease ${0.4 + i * 0.2}s` }} />
          <circle cx={x} cy={y} r="3.5" fill="#fff" />
        </g>
      ))}
    </svg>
  );
}
