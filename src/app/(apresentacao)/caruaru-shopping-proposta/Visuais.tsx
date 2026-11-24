"use client";

import type { ReactNode } from "react";
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
  return (
    <div className="relative">
      <div aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[clamp(1.625rem,4vh,2.5rem)] hidden h-px bg-white/15 md:block">
        <div className="ap-linha-x h-full w-full bg-[#5FD3FF]" style={{ "--d": `${inicio}ms`, "--t": `${dur}ms`, transitionTimingFunction: "linear" } as React.CSSProperties} />
      </div>
      <div aria-hidden className="absolute bottom-6 left-[clamp(1.625rem,4vh,2.5rem)] top-6 w-px bg-white/15 md:hidden">
        <div className="ap-linha-y h-full w-full bg-[#5FD3FF]" style={{ "--d": `${inicio}ms`, "--t": `${dur}ms`, transitionTimingFunction: "linear" } as React.CSSProperties} />
      </div>
      <ol className="relative grid gap-6 md:grid-cols-4">
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
              <span className="ap-acende mt-2 block ap-pequeno text-white/65 md:mx-auto md:max-w-[22ch]" style={d(quando(i) + 150)}>
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
          Quais são as zonas mortas?
        </Balao>
        <Balao de="aip" atraso={1900}>
          A ala sul do piso 1 está 38% abaixo da média do shopping.
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
