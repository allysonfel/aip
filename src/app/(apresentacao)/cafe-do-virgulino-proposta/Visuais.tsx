"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { C, Caixa, F, Hud, L, Visto } from "../_compartilhado/Hud";
import type { EtapaLinha } from "../_compartilhado/LinhaDoTempo";
import { LINHA_FIM } from "../_compartilhado/LinhaDoTempo";
import { LogoA, LogoAIP } from "../_compartilhado/Logos";
import { Conta, d } from "../_compartilhado/slide";

// Visuais da proposta do Café do Virgulino, no mesmo idioma das outras
// propostas: linha fina em branco translúcido, detalhe em ciano, entrada uma
// vez (.ap-in/.ap-fade/.ap-acende) e depois só movimento sutil e contínuo.

const LOGO = "/clientes/cafe-do-virgulino-logo.jpg";

/**
 * Logo do Café do Virgulino. O arquivo é um selo colorido em JPG, sem fundo
 * transparente: não há versão monocromática possível sem descaracterizar.
 * Fica numa área clara discreta (moldura branca fina), legível no fundo escuro.
 */
export function LogoCafe({ className = "" }: { className?: string }) {
  const img = useRef<HTMLImageElement>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setErro(true);
  }, []);

  if (erro)
    return (
      <span className={`inline-flex aspect-square items-center justify-center rounded-xl border border-dashed border-white/25 p-2 text-center font-titulo text-[0.7em] font-semibold uppercase tracking-[0.14em] text-white/55 ${className}`}>
        Café do Virgulino
      </span>
    );
  return (
    <span className={`relative inline-block aspect-square rounded-[10%] bg-white/90 shadow-[0_0_40px_rgb(255_255_255/0.06)] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- arquivo pequeno do cliente, sem otimização. */}
      <img ref={img} src={LOGO} alt="Café do Virgulino" onError={() => setErro(true)} className="absolute inset-[5%] h-[90%] w-[90%] select-none rounded-[7%]" draggable={false} />
    </span>
  );
}

/* ------------------------------ mapa do salão ------------------------------ */

type Mesa = { x: number; y: number; r?: number; w?: number; h?: number; ocupada: boolean; t: number; a: number };

// 18 mesas (11 ocupadas no início, como no painel). Redondas de 2 lugares e
// retangulares de 4, vistas de cima. t/a: duração e atraso da troca de estado.
const MESAS: Mesa[] = [
  { x: 52, y: 44, r: 9, ocupada: true, t: 17, a: 0 },
  { x: 86, y: 44, r: 9, ocupada: false, t: 21, a: 3 },
  { x: 120, y: 44, r: 9, ocupada: true, t: 15, a: 6 },
  { x: 154, y: 44, r: 9, ocupada: true, t: 23, a: 1 },
  { x: 188, y: 44, r: 9, ocupada: false, t: 19, a: 8 },
  { x: 222, y: 44, r: 9, ocupada: true, t: 16, a: 4 },
  { x: 44, y: 84, w: 24, h: 16, ocupada: true, t: 20, a: 2 },
  { x: 84, y: 84, w: 24, h: 16, ocupada: false, t: 18, a: 9 },
  { x: 124, y: 84, w: 24, h: 16, ocupada: true, t: 22, a: 5 },
  { x: 164, y: 84, w: 24, h: 16, ocupada: true, t: 14, a: 7 },
  { x: 204, y: 84, w: 24, h: 16, ocupada: false, t: 24, a: 0 },
  { x: 44, y: 124, w: 24, h: 16, ocupada: true, t: 19, a: 10 },
  { x: 84, y: 124, w: 24, h: 16, ocupada: false, t: 16, a: 3 },
  { x: 124, y: 124, w: 24, h: 16, ocupada: true, t: 21, a: 12 },
  { x: 164, y: 124, w: 24, h: 16, ocupada: false, t: 17, a: 6 },
  { x: 204, y: 124, w: 24, h: 16, ocupada: true, t: 23, a: 2 },
  { x: 268, y: 112, r: 9, ocupada: false, t: 18, a: 11 },
  { x: 268, y: 146, r: 9, ocupada: true, t: 20, a: 4 },
];

function FormaMesa({ m, ...p }: { m: Mesa } & React.SVGProps<SVGRectElement & SVGCircleElement>) {
  if (m.r) return <circle cx={m.x} cy={m.y} r={m.r} {...p} />;
  return <rect x={m.x - (m.w ?? 0) / 2} y={m.y - (m.h ?? 0) / 2} width={m.w} height={m.h} rx="2.5" {...p} />;
}

/** Salão visto de cima: paredes, balcão, entrada e as mesas trocando de estado. */
export function SalaoMesas({ entrada = 0 }: { entrada?: number }) {
  return (
    <>
      <g className="ap-fade" style={d(entrada)}>
        <rect x="18" y="18" width="284" height="148" rx="3" stroke={L} />
        <path d="M244 18v62h58" stroke={F} />
        <path d="M252 30h40M252 44h40M252 58h40" stroke={F} strokeDasharray="2 4" />
        <path d="M118 166h44" stroke="#050607" strokeWidth="3" />
        <path d="M118 166v-8M162 166v-8" stroke={C} strokeOpacity="0.7" />
      </g>
      {MESAS.map((m, i) => (
        <g key={i} className="ap-fade" style={d(entrada + 150 + i * 45)}>
          <FormaMesa m={m} stroke={L} fill="none" />
          <FormaMesa
            m={m}
            stroke={C}
            fill="rgb(95 211 255 / 0.55)"
            className={`cv-mesa ${m.ocupada ? "cv-ocupada" : ""}`}
            style={{ "--t": `${m.t}s`, "--a": `${m.a}s` } as CSSProperties}
          />
        </g>
      ))}
    </>
  );
}

/** 01 · Salão: o mapa do salão com as mesas livres e ocupadas. */
export function HudSalao() {
  return (
    <Hud className="aspect-[16/9]">
      <SalaoMesas entrada={150} />
    </Hud>
  );
}

/** 02 · Cozinha e estoque: colaborador com touca, máscara, luva e avental conferidos; estoque trancado. */
export function HudCozinha() {
  return (
    <Hud className="aspect-[16/9]">
      <path d="M0 150h320" stroke={F} />
      {/* estoque: prateleiras com garrafas e cadeado */}
      <g className="ap-fade" style={d(150)}>
        <rect x="22" y="34" width="86" height="116" rx="2" stroke={L} />
        <path d="M22 72h86M22 110h86" stroke={F} />
        {[34, 48, 62, 76, 90].map((x) => (
          <path key={x} d={`M${x} 70v-18a4 4 0 0 1 4-4v-6M${x + 2} 108v-22`} stroke={F} />
        ))}
        <rect x="56" y="122" width="18" height="14" rx="2" stroke={C} />
        <path d="M59 122v-5a6 6 0 0 1 12 0v5" stroke={C} />
      </g>
      {/* colaborador com touca, máscara, luvas e avental */}
      <g className="ap-fade" style={d(400)}>
        <circle cx="178" cy="62" r="11" stroke={L} />
        <path d="M165.5 58a12.5 12.5 0 0 1 25 0z" stroke={C} fill="rgb(95 211 255 / 0.12)" />
        <path d="M171 67h14" stroke={C} />
        <path d="M156 146v-32a22 22 0 0 1 44 0v32" stroke={L} />
        <path d="M166 100h24v40h-24z" stroke={C} strokeOpacity="0.8" />
        <path d="M151 128h7M198 128h7" stroke={C} strokeWidth="3" />
        <Caixa x={144} y={40} w={68} h={112} />
      </g>
      {[52, 76, 100, 124].map((y, i) => (
        <g key={y} className="ap-acende" style={d(750 + i * 160)}>
          <circle cx="234" cy={y} r="8" stroke={C} />
          <Visto x={234} y={y - 0.5} />
        </g>
      ))}
      {/* sensor de fumaça e fogo */}
      <g className="ap-fade" style={d(1500)}>
        <circle cx="286" cy="64" r="14" stroke={C} strokeOpacity="0.8" />
        <circle cx="286" cy="64" r="14" stroke={C} className="ap-onda" />
        <path d="M286 72c-5 0-7-4-5-8 1 2 2 2 3 1-1-4 1-7 4-9 0 3 4 5 4 10 0 4-3 6-6 6z" stroke={C} />
      </g>
    </Hud>
  );
}

/** 03 · Segurança: restaurante fechado à noite, pessoa detectada e botão de pânico no celular. */
export function HudSeguranca() {
  return (
    <Hud className="aspect-[16/9]">
      <g className="ap-fade" style={d(150)}>
        <path d="M24 156V70l66-34 66 34v86z" stroke={L} />
        <path d="M76 156v-40h28v40" stroke={F} />
        <path d="M84 132h4" stroke={L} />
        <rect x="38" y="84" width="24" height="18" rx="1" stroke={F} />
        <rect x="118" y="84" width="24" height="18" rx="1" stroke={F} />
        <path d="M200 30a12 12 0 1 0 12 16 10 10 0 0 1-12-16z" stroke={L} />
      </g>
      <g className="ap-fade" style={d(400)}>
        <path d="M18 64h140" stroke={C} strokeOpacity="0.55" strokeDasharray="3 5" className="ap-respira" />
      </g>
      <g className="ap-fade" style={d(700)}>
        <circle cx="128" cy="122" r="6" stroke={L} />
        <path d="M118 148v-6a10 10 0 0 1 20 0v6" stroke={L} />
        <circle cx="128" cy="150" r="4" fill={C} />
        <circle cx="128" cy="150" r="4" stroke={C} className="ap-onda" />
        <Caixa x={112} y={110} w={32} h={44} t={7} />
      </g>
      {/* celular com botão de pânico silencioso */}
      <g className="ap-fade" style={d(1000)}>
        <rect x="236" y="40" width="58" height="108" rx="9" stroke={L} />
        <path d="M258 48h14" stroke={F} />
        <circle cx="265" cy="98" r="17" stroke={C} />
        <circle cx="265" cy="98" r="17" stroke={C} className="ap-onda" />
        <circle cx="265" cy="98" r="9" fill={C} fillOpacity="0.85" />
      </g>
    </Hud>
  );
}

/* ------------------------------ relatório diário (slide 9) ------------------------------ */

const RELATORIO: [string, string][] = [
  ["Clientes", "184"],
  ["Horário de pico", "12h40"],
  ["Giro de mesas", "10,2 por mesa"],
  ["Alertas de higiene", "1"],
  ["Alertas de segurança", "1"],
];

/** Card do relatório diário que se monta linha por linha. */
export function RelatorioDiario() {
  return (
    <div className="ap-in overflow-hidden rounded-2xl border border-white/10 bg-[#07090b]" style={d(250)}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
        <span className="flex items-center gap-3">
          <LogoA className="h-4 text-white" />
          <span className="ap-pequeno font-medium text-white/85">Relatório diário</span>
        </span>
        <span className="ap-pulso h-2 w-2 rounded-full bg-[#5FD3FF]" />
      </div>
      <ul className="ap-pequeno">
        {RELATORIO.map(([k, v], i) => (
          <li key={k} className="ap-in flex items-baseline justify-between gap-4 border-b border-white/[0.07] px-5 py-[clamp(0.55rem,1.5vh,0.9rem)]" style={d(600 + i * 280)}>
            <span className="text-white/60">{k}</span>
            <span className="ap-num text-[1.2em] text-white">{v}</span>
          </li>
        ))}
      </ul>
      <p className="px-5 py-3 text-[clamp(0.62rem,1.1vh,0.78rem)] text-white/35">Exemplo ilustrativo. Dados fictícios.</p>
    </div>
  );
}

/* ------------------------------ painel ilustrativo (slide 10) ------------------------------ */

const FEED = [
  { hora: "07:42", local: "Cozinha", tipo: "Sem touca", status: "Resolvido" },
  { hora: "10:15", local: "Estoque", tipo: "Acesso fora do horário", status: "Verificado" },
  { hora: "12:40", local: "Salão", tipo: "Horário de pico: 17 mesas ocupadas", status: "Informação", info: true },
];
const FEED_INICIO = 1100;
const FEED_PASSO = 420;

/** Miniatura da câmera da cozinha com a caixa de detecção (cabeça sem touca). */
function Miniatura() {
  return (
    <svg viewBox="0 0 160 90" aria-hidden className="block h-full w-full" fill="none" strokeLinecap="round">
      <rect width="160" height="90" fill="#0b0e10" />
      <path d="M0 60h160M18 60 0 90M58 60 44 90M102 60l14 30M142 60l18 30" stroke="rgb(255 255 255 / 0.14)" />
      <path d="M8 60V40h50v20M112 60V36h42v24" stroke="rgb(255 255 255 / 0.18)" />
      <circle cx="80" cy="34" r="7" stroke="rgb(255 255 255 / 0.7)" />
      <path d="M66 72V57a14 14 0 0 1 28 0v15" stroke="rgb(255 255 255 / 0.7)" />
      <Caixa x={68} y={22} w={24} h={22} t={5} />
    </svg>
  );
}

export function PainelCafe() {
  return (
    <div className="lg:flex lg:items-end lg:gap-[clamp(1rem,1.6vw,1.75rem)]">
      <div className="ap-in relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#07090b]" style={d(150)}>
        <div aria-hidden className="ap-varredura" style={{ "--t": "11s" } as CSSProperties} />
        {/* topo */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-[clamp(0.9rem,1.4vw,1.5rem)] py-3">
          <div className="flex items-center gap-4">
            <LogoAIP className="h-[clamp(0.85rem,1.2vw,1.15rem)] text-white" />
            <span className="text-[clamp(0.8rem,0.95vw,1.05rem)] font-medium text-white/85">Café do Virgulino · Ao vivo</span>
          </div>
          <span aria-hidden className="relative flex h-2.5 w-2.5">
            <span className="ap-onda absolute inset-0 rounded-full bg-[#5FD3FF]" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-[#5FD3FF]" />
          </span>
        </div>
        {/* indicadores */}
        <div className="grid grid-cols-2 border-b border-white/10 sm:grid-cols-4">
          {[
            { rotulo: "Clientes hoje", valor: <Conta ate={184} atraso={350} duracao={1300} /> },
            {
              rotulo: "Mesas ocupadas",
              valor: (
                <>
                  <Conta ate={11} atraso={440} duracao={1100} />
                  <span className="text-[0.55em] text-white/55"> de 18</span>
                </>
              ),
            },
            {
              rotulo: "Pico",
              valor: (
                <>
                  <Conta ate={12} atraso={530} duracao={1100} />h<Conta ate={40} atraso={530} duracao={1100} />
                </>
              ),
            },
            { rotulo: "Alertas hoje", valor: <Conta ate={3} atraso={620} duracao={900} /> },
          ].map((k, i) => (
            <div key={k.rotulo} className={`px-[clamp(0.9rem,1.4vw,1.5rem)] py-[clamp(0.6rem,1.6vh,1rem)] ${i % 2 ? "border-l border-white/10" : ""} ${i >= 2 ? "border-t border-white/10 sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}>
              <div className="text-[clamp(0.7rem,0.85vw,0.95rem)] text-white/55">{k.rotulo}</div>
              <span className="ap-num block text-[clamp(1.6rem,min(2.4vw,4.2vh),3rem)] leading-none text-white">{k.valor}</span>
            </div>
          ))}
        </div>
        {/* mapa do salão + feed */}
        <div className="grid md:grid-cols-[1fr_1.15fr]">
          <div className="border-b border-white/10 p-[clamp(0.6rem,1vw,1rem)] md:border-b-0 md:border-r">
            <svg viewBox="0 0 320 184" aria-hidden className="block h-auto w-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <SalaoMesas entrada={500} />
            </svg>
          </div>
          <ul className="divide-y divide-white/[0.07] text-[clamp(0.76rem,min(0.92vw,1.75vh),1.05rem)]">
            {FEED.map((a, i) => (
              <li key={a.hora} className="ap-in grid grid-cols-[3.2em_1fr_auto] items-center gap-x-3 gap-y-0.5 px-[clamp(0.9rem,1.4vw,1.5rem)] py-[clamp(0.55rem,1.5vh,1rem)]" style={d(FEED_INICIO + i * FEED_PASSO)}>
                <span className="ap-num text-white/55">{a.hora}</span>
                <span className="min-w-0">
                  <span className="block text-white/90">{a.local}</span>
                  <span className="block text-white/60">{a.tipo}</span>
                </span>
                <span className={`justify-self-end whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.85em] ${a.info ? "border-[#5FD3FF]/40 text-[#5FD3FF]" : "border-white/12 text-white/50"}`}>{a.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* celular com a notificação do WhatsApp (chega junto com o alerta das 07:42) */}
      <div className="ap-in mx-auto mt-6 w-[min(17rem,78vw)] shrink-0 lg:mx-0 lg:mb-[-1.5rem] lg:mt-0 lg:w-[clamp(10.5rem,13vw,15rem)]" style={d(FEED_INICIO + 300)}>
        <div className="rounded-[1.9rem] border border-white/20 bg-[#030405] p-[0.45rem] shadow-[0_30px_80px_rgb(0_0_0/0.85)]">
          <div className="overflow-hidden rounded-[1.5rem] bg-[#0b141a]">
            <div className="flex items-center gap-2.5 bg-[#1f2c34] px-3 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black">
                <LogoA className="h-2.5 text-white" />
              </span>
              <span className="h-2 w-16 rounded-full bg-white/25" />
            </div>
            <div className="px-2.5 pb-4 pt-6">
              <div className="ml-auto mr-0 max-w-[92%] rounded-lg rounded-tr-sm bg-[#144d37] p-1.5 text-[clamp(0.68rem,0.78vw,0.9rem)] leading-snug text-white/95">
                <div className="aspect-video overflow-hidden rounded-md">
                  <Miniatura />
                </div>
                <p className="px-1 pb-0.5 pt-1.5">AIP | Alerta: Cozinha, colaborador sem touca, 07:42</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ anel dos 60 dias (slide 13) ------------------------------ */

/** "60" com um anel de 60 marcas que acendem em sequência até fechar o círculo. */
export function Anel60() {
  const marcas = 60;
  return (
    <div className="relative mx-auto aspect-square w-[min(72vw,52vh,30rem)]">
      <svg viewBox="0 0 200 200" aria-hidden className="absolute inset-0 h-full w-full" fill="none" strokeLinecap="round">
        <circle cx="100" cy="100" r="76" stroke={F} />
        {Array.from({ length: marcas }, (_, i) => {
          const a = (i / marcas) * Math.PI * 2 - Math.PI / 2;
          const r2 = (v: number) => Math.round(v * 100) / 100;
          const x1 = r2(100 + Math.cos(a) * 86);
          const y1 = r2(100 + Math.sin(a) * 86);
          const x2 = r2(100 + Math.cos(a) * 95);
          const y2 = r2(100 + Math.sin(a) * 95);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={F} strokeWidth="1.6" />
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C} strokeWidth="1.8" className="ap-fade" style={d(300 + i * 24)} />
            </g>
          );
        })}
        <g className="ap-gira">
          <circle cx="100" cy="24" r="2.2" fill={C} className="ap-fade" style={d(1800)} />
        </g>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Conta ate={60} atraso={300} duracao={1440} className="ap-num font-bold leading-none text-white text-[min(30vw,22vh,12.5rem)]" />
      </div>
    </div>
  );
}

/* ------------------------------ linha do tempo (slide 14) ------------------------------ */

export const ETAPAS: EtapaLinha[] = [
  { n: "01", titulo: "Visita técnica", frase: "conhecemos o salão, a cozinha e o estoque.", icone: "local" },
  { n: "02", titulo: "Avaliação das câmeras", frase: "verificamos o que já existe e o que cada câmera pode monitorar.", icone: "busca" },
  { n: "03", titulo: "60 dias de isenção", frase: "a AIP funcionando, sem custo.", icone: "teste" },
  { n: "04", titulo: "Funcionamento completo", frase: "todas as frentes ativas.", icone: "expansao" },
];

/** A etapa 04 acende as quatro frentes (quatro pontos), depois que a linha termina. */
export function RamoFrentes() {
  const pontos: [number, number][] = [
    [58, 14],
    [68, 34],
    [68, 52],
    [58, 72],
  ];
  return (
    <svg viewBox="0 0 80 86" aria-hidden className="pointer-events-none absolute left-[78%] top-1/2 hidden h-[180%] -translate-y-1/2 overflow-visible lg:block" fill="none">
      {pontos.map(([x, y], i) => (
        <g key={i}>
          <path d={`M4 43 Q${x * 0.45} ${43 + (y - 43) * 0.15} ${x} ${y}`} stroke={C} strokeOpacity="0.5" className="ap-fade" style={d(LINHA_FIM + 150 + i * 120)} />
          <g className="ap-fade" style={d(LINHA_FIM + 300 + i * 120)}>
            <circle cx={x} cy={y} r="3.4" fill={C} />
            <circle cx={x} cy={y} r="3.4" stroke={C} className="ap-onda" style={{ animationDelay: `${i * 300}ms` }} />
          </g>
        </g>
      ))}
    </svg>
  );
}

export function RamoFrentesCelular() {
  const xs = [14, 56, 98, 140];
  return (
    <svg viewBox="0 0 160 40" aria-hidden className="mt-4 h-10 w-[160px] overflow-visible lg:hidden" fill="none">
      {xs.map((x, i) => (
        <g key={x}>
          <path d={`M14 2 Q14 22 ${x} 30`} stroke={C} strokeOpacity="0.5" className="ap-fade" style={d(LINHA_FIM + 150 + i * 120)} />
          <g className="ap-fade" style={d(LINHA_FIM + 300 + i * 120)}>
            <circle cx={x} cy="30" r="3.4" fill={C} />
            <circle cx={x} cy="30" r="3.4" stroke={C} className="ap-onda" style={{ animationDelay: `${i * 300}ms` }} />
          </g>
        </g>
      ))}
    </svg>
  );
}
