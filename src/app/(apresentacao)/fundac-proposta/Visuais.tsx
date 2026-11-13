"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { Palco, type EtapaTotem } from "../../(site)/_components/TotemPorDentro";
import { C, Caixa, F, Hud, L } from "../_compartilhado/Hud";
import { LINHA_FIM } from "../_compartilhado/LinhaDoTempo";
import { d, reduzido, useAtivo } from "../_compartilhado/slide";

// Visuais da proposta da Feira da Sulanca – Fundac. Fotos do totem e blocos
// reaproveitados da página /totem-ia; o espaço da Feira aparece só como
// desenho esquemático (nada de fotos reais da Feira).

const M = "/site/media";

/** Sorteio com semente fixa: os pontos saem iguais no servidor e no navegador. */
function sorteio(semente: number) {
  let s = semente;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/* ------------------------------ slide 3 · dia de feira x feira fechada ------------------------------ */

/** Bancas vistas de cima: fileiras de retângulos com corredores entre elas. */
function Bancas({ cor }: { cor: string }) {
  const blocos = [];
  for (let c = 0; c < 6; c++)
    for (let l = 0; l < 4; l++)
      blocos.push(<rect key={`${c}-${l}`} x={22 + c * 62} y={52 + l * 48} width="48" height="30" rx="2" stroke={cor} />);
  return <g fill="none">{blocos}</g>;
}

function Multidao({ quantos, semente, cor, raio, lento }: { quantos: number; semente: number; cor: string; raio: number; lento?: boolean }) {
  const rnd = sorteio(semente);
  return (
    <g>
      {Array.from({ length: quantos }, (_, i) => {
        // nos corredores: entre as fileiras de bancas
        const x = r1(14 + rnd() * 372);
        const faixa = Math.floor(rnd() * 5);
        const y = r1(44 + faixa * 48 + rnd() * 10 - 2);
        const estilo = {
          "--dx": `${r1((rnd() - 0.5) * (lento ? 16 : 26))}px`,
          "--dy": `${r1((rnd() - 0.5) * 6)}px`,
          "--dur": `${r1((lento ? 9 : 4) + rnd() * 4)}s`,
          "--atraso": `${r1(-rnd() * 6)}s`,
        } as CSSProperties;
        return <circle key={i} cx={x} cy={y} r={raio} fill={cor} className="ap-deriva" style={estilo} />;
      })}
    </g>
  );
}

export function DiaENoite() {
  return (
    <div className="grid gap-[clamp(0.5rem,1vw,1rem)] sm:grid-cols-2">
      <figure className="ap-in relative overflow-hidden rounded-xl border border-white/12 bg-[#0b0d10]" style={d(250)}>
        <figcaption className="ap-rotulo absolute left-4 top-3 z-10 text-white/75">Dia de feira</figcaption>
        <svg viewBox="0 0 400 250" aria-hidden className="block h-full w-full" strokeWidth="1">
          <Bancas cor="rgb(255 255 255 / 0.14)" />
          <Multidao quantos={150} semente={7} cor="rgb(255 255 255 / 0.78)" raio={2.1} />
        </svg>
      </figure>
      <figure className="ap-in relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#020304]" style={d(380)}>
        <figcaption className="ap-rotulo absolute left-4 top-3 z-10 text-white/45">Feira fechada</figcaption>
        <svg viewBox="0 0 400 250" aria-hidden className="block h-full w-full" strokeWidth="1">
          <Bancas cor="rgb(255 255 255 / 0.06)" />
          <Multidao quantos={3} semente={41} cor="rgb(255 255 255 / 0.4)" raio={2.1} lento />
        </svg>
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(0_0_0/0.7))]" />
      </figure>
    </div>
  );
}

/* ------------------------------ slide 4 · o totem (palco da página /totem-ia) ------------------------------ */

const ALT_FRENTE = "Totem IA da AIP visto de frente, com giroflex, quatro câmeras e linhas de LED azul, sobre fundo preto";
const ALT_TOPO = "Topo do Totem IA em close: giroflex vermelho e azul e câmeras com a marca AIP";
const ALT_TRES_QUARTOS = "Totem IA em três quartos, mostrando as câmeras laterais e o corpo de 3 metros";

/** As partes do totem, com as mesmas fotos e medições da página /totem-ia. */
const PARTES: EtapaTotem[] = [
  { titulo: "", texto: "", foto: "totem-topo.jpg", alt: ALT_TOPO, alvos: [{ x: 22, y: 49.5, w: 26, h: 13 }, { x: 78.5, y: 49.5, w: 26, h: 13 }] },
  { titulo: "", texto: "", foto: "totem-topo.jpg", alt: ALT_TOPO, alvos: [{ x: 50.5, y: 24, w: 30, h: 17 }] },
  { titulo: "", texto: "", foto: "totem-frente.jpg", alt: ALT_FRENTE, alvos: [{ x: 50, y: 51, w: 17, h: 88, caixa: true }], zoom: 1 },
  { titulo: "", texto: "", foto: "totem-tres-quartos.jpg", alt: ALT_TRES_QUARTOS, alvos: [{ x: 50.3, y: 48, w: 25, h: 90, caixa: true }], zoom: 1 },
];

export const DESTAQUES_TOTEM = ["4 câmeras com inteligência artificial", "Giroflex acionado pela central", "Central AIP 24h", "Feito para resistir ao tempo: sol, chuva e poeira"];

const PASSO_TOTEM = 2400;

/**
 * O "palco" do totem da página /totem-ia num slide: ao entrar, percorre os
 * quatro destaques uma vez (como a rolagem da página do produto) e para no
 * último; clicar num destaque mostra a parte correspondente. No último, a foto
 * do bloco "Feito para resistir ao tempo" (totem na chuva) entra por cima.
 */
export function useDestaquesTotem() {
  const ativo = useAtivo();
  const [atual, setAtual] = useState(0);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (!ativo || manual || reduzido()) return;
    const ids = DESTAQUES_TOTEM.map((_, i) => (i === 0 ? 0 : window.setTimeout(() => setAtual(i), 500 + i * PASSO_TOTEM)));
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [ativo, manual]);

  const escolhe = (i: number) => {
    setManual(true);
    setAtual(i);
  };

  return { atual, escolhe };
}

export function PalcoTotem({ atual }: { atual: number }) {
  return (
    <div className="relative mx-auto h-[min(62svh,calc((100vw-2.5rem)*1.25))] lg:h-[min(76svh,52rem)]" style={{ aspectRatio: "4 / 5" }}>
      <Palco etapas={PARTES} ativa={atual} className="h-full" />
      <div className={`absolute inset-0 overflow-hidden rounded-2xl transition-opacity duration-700 ease-out ${atual === 3 ? "opacity-100" : "opacity-0"}`}>
        <Image src={`${M}/totem-chuva.jpg`} alt="Totem IA sob chuva forte, visto de baixo para cima, com nuvens carregadas ao fundo" fill sizes="(min-width: 1024px) 40vw, 90vw" quality={85} style={{ objectPosition: "68% 50%" }} className="object-cover" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black to-transparent" />
      </div>
    </div>
  );
}

/* ------------------------------ slide 5 · HUD do dia de feira ------------------------------ */

function Pessoa({ x, y, s = 1, cor = L }: { x: number; y: number; s?: number; cor?: string }) {
  return (
    <g stroke={cor} transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="-26" r="6" />
      <path d="M-11 0v-8a11 11 0 0 1 22 0v8" />
    </g>
  );
}

export function HudFeira() {
  return (
    <Hud className="aspect-[16/9]">
      {/* toldos das bancas */}
      <g className="ap-fade" style={d(150)}>
        <path d="M0 40h320" stroke={F} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={i} d={`M${i * 40} 40l10 10 10-10 10 10 10-10`} stroke={F} />
        ))}
        <path d="M0 132h320" stroke={F} />
      </g>
      <g className="ap-fade" style={d(300)}>
        <Pessoa x={30} y={124} />
        <Pessoa x={62} y={128} s={0.9} />
        <Pessoa x={152} y={126} s={0.95} />
        <Pessoa x={184} y={124} />
        <Pessoa x={268} y={127} s={0.9} />
      </g>
      {/* permanência fora do comum */}
      <g className="ap-fade" style={d(550)}>
        <Pessoa x={108} y={124} cor="rgb(255 255 255 / 0.85)" />
        <Caixa x={90} y={86} w={36} h={44} t={7} />
        <circle cx="108" cy="80" r="3" fill={C} className="ap-pulso" />
      </g>
      {/* correria */}
      <g className="ap-fade" style={d(750)}>
        <Pessoa x={228} y={126} cor="rgb(255 255 255 / 0.85)" />
        <path d="M200 102h-14M203 112h-20M200 122h-14" stroke={C} strokeOpacity="0.7" />
        <Caixa x={210} y={88} w={36} h={44} t={7} />
      </g>
      {/* placa no estacionamento */}
      <g className="ap-fade" style={d(950)}>
        <path d="M40 172v-14l8-10h44l10 10v14" stroke={L} />
        <rect x="58" y="160" width="26" height="8" rx="1.5" stroke={C} />
        <Caixa x={52} y={155} w={38} h={18} t={5} />
      </g>
    </Hud>
  );
}

/* ------------------------------ slide 6 · totem à noite ------------------------------ */

export function TotemNoite() {
  return (
    <div className="relative aspect-[3/2] overflow-hidden rounded-xl border border-white/10">
      <Image src={`${M}/totem-noite.jpg`} alt="Totem IA à noite numa área vazia, com o giroflex aceso e as linhas de LED azul" fill sizes="(min-width: 1024px) 45vw, 92vw" quality={85} className="object-cover" />
      {/* brilho lento do giroflex aceso */}
      <span aria-hidden className="ap-respira absolute left-[69.2%] top-[7.6%] h-[16%] w-[11%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_70_90/0.45),rgb(80_120_255/0.25)_55%,transparent)] mix-blend-screen" />
      {/* cerca virtual no chão */}
      <svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden className="absolute inset-0 h-full w-full" fill="none">
        <path d="M10 168 L120 150 L290 162" stroke={C} strokeOpacity="0.75" strokeDasharray="5 5" strokeWidth="1.2" vectorEffect="non-scaling-stroke" className="ap-fade ap-respira" style={d(700)} />
      </svg>
    </div>
  );
}

/* ------------------------------ slide 7 · fluxo de público por horário ------------------------------ */

// Alturas ilustrativas (não são dados reais): o slide traz a nota "Dados ilustrativos."
const FLUXO = [18, 34, 58, 82, 96, 88, 72, 64, 58, 46, 34, 22, 12];
const HORA_INICIAL = 4;

export function GraficoFluxo() {
  const pico = FLUXO.indexOf(Math.max(...FLUXO));
  return (
    <div className="ap-in rounded-xl border border-white/10 bg-[#050607] p-[clamp(0.9rem,1.6vw,1.5rem)]" style={d(250)}>
      <div className="flex h-[clamp(9rem,26vh,16rem)] items-end gap-[clamp(0.25rem,0.5vw,0.5rem)] border-b border-white/15">
        {FLUXO.map((v, i) => (
          <div key={i} className="ap-barra flex-1 rounded-t-[3px]" style={{ height: `${v}%`, background: i === pico ? C : "rgb(255 255 255 / 0.22)", ...d(400 + i * 70) }} />
        ))}
      </div>
      <div className="mt-2 flex gap-[clamp(0.25rem,0.5vw,0.5rem)] text-[clamp(0.6rem,1.1vh,0.8rem)] text-white/40">
        {FLUXO.map((_, i) => (
          <span key={i} className="ap-num flex-1 text-center">
            {i % 2 === 0 ? `${String(HORA_INICIAL + i).padStart(2, "0")}h` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ slide 9 · mapa esquemático ------------------------------ */

export const ZONAS = ["Entradas principais", "Estacionamento", "Praça de alimentação", "Corredores principais", "Banheiros", "Carga e descarga", "Perímetro"];

/** Totens no mapa: posição e zona (índice em ZONAS). */
const TOTENS: { x: number; y: number; z: number }[] = [
  { x: 500, y: 58, z: 0 },
  { x: 52, y: 345, z: 0 },
  { x: 145, y: 195, z: 1 },
  { x: 850, y: 150, z: 2 },
  { x: 600, y: 300, z: 3 },
  { x: 400, y: 300, z: 3 },
  { x: 800, y: 300, z: 3 },
  { x: 880, y: 500, z: 4 },
  { x: 145, y: 470, z: 5 },
  { x: 945, y: 300, z: 6 },
  { x: 600, y: 545, z: 6 },
];

export const MAPA_INICIO = 500;
export const MAPA_PASSO = 380;

/** Desenho de base: perímetro, estacionamento, carga e descarga, quadras de bancas, praça e banheiros. */
function BaseMapa() {
  const quadras = [];
  const cols = [270, 445, 625, 780];
  const lins = [70, 175, 330, 435];
  for (const [ci, x] of cols.entries())
    for (const [li, y] of lins.entries()) {
      if (ci === 3 && li === 0) continue; // praça de alimentação
      if (ci === 3 && li === 3) continue; // banheiros
      const w = ci === 1 ? 140 : 150;
      const bancas = [];
      for (let k = 0; k < 5; k++) bancas.push(<path key={k} d={`M${x + 8 + k * ((w - 16) / 5)} ${y + 8}v${80}`} stroke="rgb(255 255 255 / 0.07)" />);
      quadras.push(
        <g key={`${ci}-${li}`}>
          <rect x={x} y={y} width={w} height="95" rx="3" stroke="rgb(255 255 255 / 0.2)" />
          {bancas}
        </g>,
      );
    }
  return (
    <g fill="none" strokeWidth="1.2">
      {/* corredores principais, levemente destacados */}
      <rect x="250" y="275" width="700" height="50" fill="rgb(255 255 255 / 0.035)" />
      <rect x="585" y="55" width="30" height="495" fill="rgb(255 255 255 / 0.035)" />
      {/* perímetro, com as entradas abertas */}
      <path d="M40 40H470M530 40H960V560H40V375M40 315V40" stroke={L} strokeWidth="1.6" />
      <path d="M500 18v14M494 26l6 6 6-6M18 345h14M26 339l6 6-6 6" stroke="rgb(255 255 255 / 0.5)" />
      {/* estacionamento */}
      <rect x="60" y="60" width="170" height="250" rx="3" stroke="rgb(255 255 255 / 0.2)" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M60 ${84 + i * 25}h44M186 ${84 + i * 25}h44`} stroke="rgb(255 255 255 / 0.1)" />
      ))}
      {/* carga e descarga */}
      <rect x="60" y="380" width="170" height="165" rx="3" stroke="rgb(255 255 255 / 0.2)" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={72 + i * 40} y="500" width="28" height="36" stroke="rgb(255 255 255 / 0.1)" />
      ))}
      {/* praça de alimentação */}
      <rect x="780" y="70" width="150" height="95" rx="3" stroke="rgb(255 255 255 / 0.2)" />
      {[0, 1, 2].map((c) => [0, 1].map((l) => <circle key={`${c}${l}`} cx={812 + c * 40} cy={100 + l * 36} r="9" stroke="rgb(255 255 255 / 0.14)" />))}
      {/* banheiros */}
      <rect x="780" y="435" width="150" height="95" rx="3" stroke="rgb(255 255 255 / 0.2)" />
      <path d="M855 445v75M800 470h40M870 470h40" stroke="rgb(255 255 255 / 0.1)" />
      {quadras}
    </g>
  );
}

export function MapaFeira() {
  return (
    <div className="ap-in relative overflow-hidden rounded-xl border border-white/10 bg-[#050607]" style={d(150)}>
      <div aria-hidden className="ap-varredura" style={{ "--t": "12s" } as CSSProperties} />
      <svg viewBox="0 0 1000 600" aria-hidden className="relative block h-auto w-full" fill="none">
        <BaseMapa />
        {TOTENS.map((t, i) => {
          const atraso = MAPA_INICIO + t.z * MAPA_PASSO + (i % 2) * 90;
          return (
            <g key={i} className="ap-fade" style={d(atraso)}>
              <circle cx={t.x} cy={t.y} r="72" fill={C} fillOpacity="0.07" stroke={C} strokeOpacity="0.28" />
              <circle cx={t.x} cy={t.y} r="9" fill={C} />
              <circle cx={t.x} cy={t.y} r="9" stroke={C} strokeWidth="2" className="ap-onda" style={{ animationDelay: `${(i * 430) % 2600}ms` }} />
              <text x={t.x + 14} y={t.y - 12} fill={C} fontSize="22" fontFamily="var(--font-titulo)" fontWeight="600">
                {t.z + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------ slide 12 · expansão pelo mapa ------------------------------ */

const PONTOS_EXPANSAO: [number, number][] = [
  [18, 14],
  [52, 12],
  [86, 18],
  [30, 44],
  [70, 40],
  [100, 52],
  [46, 70],
  [84, 74],
];

/** A etapa 04 se ramifica em pontos ciano acendendo num mini-mapa (desktop: ao lado do marcador). */
export function RamoMapa() {
  return (
    <svg viewBox="0 0 130 90" aria-hidden className="pointer-events-none absolute left-[115%] top-1/2 hidden h-[170%] -translate-y-1/2 overflow-visible lg:block" fill="none">
      <rect x="8" y="2" width="114" height="86" rx="3" stroke="rgb(255 255 255 / 0.18)" className="ap-fade" style={d(LINHA_FIM)} />
      <path d="M8 45h114M65 2v86" stroke="rgb(255 255 255 / 0.08)" className="ap-fade" style={d(LINHA_FIM)} />
      <path d="M-6 45H8" stroke={C} strokeOpacity="0.5" className="ap-fade" style={d(LINHA_FIM + 100)} />
      {PONTOS_EXPANSAO.map(([x, y], i) => (
        <g key={i} className="ap-fade" style={d(LINHA_FIM + 250 + i * 120)}>
          <circle cx={x + 8} cy={y + 2} r="9" fill={C} fillOpacity="0.08" />
          <circle cx={x + 8} cy={y + 2} r="2.6" fill={C} />
        </g>
      ))}
    </svg>
  );
}

/** No celular, o mini-mapa vai para baixo do texto da etapa 04. */
export function RamoMapaCelular() {
  return (
    <svg viewBox="0 0 130 90" aria-hidden className="mt-4 h-24 w-auto lg:hidden" fill="none">
      <rect x="8" y="2" width="114" height="86" rx="3" stroke="rgb(255 255 255 / 0.18)" className="ap-fade" style={d(LINHA_FIM)} />
      <path d="M8 45h114M65 2v86" stroke="rgb(255 255 255 / 0.08)" className="ap-fade" style={d(LINHA_FIM)} />
      {PONTOS_EXPANSAO.map(([x, y], i) => (
        <g key={i} className="ap-fade" style={d(LINHA_FIM + 250 + i * 120)}>
          <circle cx={x + 8} cy={y + 2} r="9" fill={C} fillOpacity="0.08" />
          <circle cx={x + 8} cy={y + 2} r="2.6" fill={C} />
        </g>
      ))}
    </svg>
  );
}
