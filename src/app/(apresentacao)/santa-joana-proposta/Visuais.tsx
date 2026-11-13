"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LogoAIP, LogoA } from "@/components/shopping/Logo";
import { Conta, d, reduzido, useAtivo } from "./slide";

// Visuais da apresentação: linha fina (branco translúcido) com detalhe em
// ciano, no mesmo idioma dos mini-visuais do site. Entrada via .ap-in/.ap-fade/
// .ap-acende (uma vez); depois só pulso, onda e varredura.

const C = "#5FD3FF";
const L = "rgb(255 255 255 / 0.62)";
const F = "rgb(255 255 255 / 0.16)";

/* ---------------------------------- logos ---------------------------------- */

export { LogoAIP };

const LOGO_SJ = "/clientes/santa-joana-logo.png";

/**
 * Logo da Santa Joana em monocromático claro. O filtro #sj-mono (FiltroMono)
 * troca as cores por branco com a opacidade vinda do contraste: o azul vira
 * branco, o fundo branco some e o amarelo fica suave. Sem o arquivo em
 * public/clientes/, mostra um marcador discreto no lugar.
 */
export function LogoSantaJoana({ className = "" }: { className?: string }) {
  const img = useRef<HTMLImageElement>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setErro(true);
  }, []);

  if (erro)
    return (
      <span className={`inline-flex aspect-[168/128] items-center justify-center rounded-lg border border-dashed border-white/25 font-titulo text-[0.7em] font-semibold uppercase tracking-[0.18em] text-white/55 ${className}`}>
        Santa Joana
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element -- o filtro SVG precisa da imagem original, sem otimização.
  return <img ref={img} src={LOGO_SJ} alt="Água Mineral Santa Joana" onError={() => setErro(true)} className={`w-auto select-none ${className}`} style={{ filter: "url(#sj-mono)" }} draggable={false} />;
}

/** Filtro SVG usado pelo LogoSantaJoana (colocar uma vez na página). */
export function FiltroMono() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <filter id="sj-mono" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -0.34 -1.144 -0.116 1.6 0" />
      </filter>
    </svg>
  );
}

/* ---------------------------------- ícones ---------------------------------- */

const ICONES = {
  camera: (
    <>
      <path d="M3 7.5h11.5l4 3-4 3H3z" />
      <path d="M6.5 13.5v3.5H3" />
      <path d="M20.5 9v3" />
    </>
  ),
  ia: (
    <>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M7.5 12s1.8-3.2 4.5-3.2 4.5 3.2 4.5 3.2-1.8 3.2-4.5 3.2S7.5 12 7.5 12z" />
      <circle cx="12" cy="12" r="1.1" />
    </>
  ),
  central: (
    <>
      <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
      <rect x="3.5" y="13" width="4" height="6" rx="1.5" />
      <rect x="16.5" y="13" width="4" height="6" rx="1.5" />
      <path d="M18.5 19c0 1.4-1.9 2.3-4.5 2.3" />
    </>
  ),
  dispositivos: (
    <>
      <rect x="2.5" y="4.5" width="13.5" height="10" rx="1.5" />
      <path d="M6.5 18.5h5.5M9.25 14.5v4" />
      <rect x="16.5" y="9" width="5" height="10.5" rx="1.2" />
    </>
  ),
  conecta: (
    <>
      <path d="M9 7V3.5M15 7V3.5" />
      <path d="M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0z" />
      <path d="M12 16v4.5" />
    </>
  ),
  alerta: (
    <>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  painel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.8" />
      <path d="M3 9h18M9 9v11" />
    </>
  ),
  equipe: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M15.2 14.1a4.6 4.6 0 0 1 5.8 4.4" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3.5 19 6v5.5c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  local: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  busca: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5.5 5.5" />
      <path d="M8 10.5h5M10.5 8v5" />
    </>
  ),
  teste: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.8" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  expansao: (
    <>
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="5.5" r="2" />
      <circle cx="18" cy="12" r="2" />
      <circle cx="18" cy="18.5" r="2" />
      <path d="M8 11 16.1 6.4M8.2 12h7.8M8 13l8.1 4.6" />
    </>
  ),
  semTroca: (
    <>
      <path d="M3 6.5h11.5l4 3-4 3H3z" />
      <path d="M6.5 12.5v3H3" />
      <path d="m13 18 2 2 4-4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type NomeIcone = keyof typeof ICONES;

export function Icone({ nome, className = "h-7 w-7" }: { nome: NomeIcone; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {ICONES[nome]}
    </svg>
  );
}

/* ------------------------------ moldura HUD ------------------------------ */

/** Quadro de "tela de análise": cantos marcados, grade fraca e varredura lenta. */
function Hud({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-[#050607] ${className}`}>
      <div aria-hidden className="ap-grade opacity-40" style={{ backgroundSize: "28px 28px" }} />
      <div aria-hidden className="ap-varredura" style={{ "--t": "7s" } as React.CSSProperties} />
      <svg viewBox="0 0 320 180" aria-hidden className="relative block h-full w-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
      {/* cantos do visor */}
      <span aria-hidden className="absolute left-2 top-2 h-3 w-3 border-l border-t border-white/35" />
      <span aria-hidden className="absolute right-2 top-2 h-3 w-3 border-r border-t border-white/35" />
      <span aria-hidden className="absolute bottom-2 left-2 h-3 w-3 border-b border-l border-white/35" />
      <span aria-hidden className="absolute bottom-2 right-2 h-3 w-3 border-b border-r border-white/35" />
    </div>
  );
}

/** Cantos de uma caixa de detecção. */
function Caixa({ x, y, w, h, t = 10, cor = C }: { x: number; y: number; w: number; h: number; t?: number; cor?: string }) {
  const r = x + w;
  const b = y + h;
  return <path d={`M${x} ${y + t}V${y}h${t} M${r - t} ${y}h${t}v${t} M${r} ${b - t}v${t}h-${t} M${x + t} ${b}h-${t}v-${t}`} stroke={cor} strokeWidth="1.6" />;
}

function Visto({ x, y, cor = C }: { x: number; y: number; cor?: string }) {
  return <path d={`M${x - 3.5} ${y}l2.6 2.6 5-5.2`} stroke={cor} strokeWidth="1.5" />;
}

/** 01 · Fonte e fábrica: perímetro da fonte e colaborador com touca, máscara e luva conferidas. */
export function HudFonte() {
  return (
    <Hud className="aspect-[16/9]">
      <path d="M0 150h320" stroke={F} />
      <g className="ap-fade" style={d(150)}>
        <polygon points="26,46 136,30 158,128 40,150" stroke={F} strokeDasharray="5 6" />
        <polygon points="40,58 126,46 144,120 52,136" stroke={C} strokeOpacity="0.55" strokeDasharray="3 5" className="ap-respira" />
      </g>
      <g className="ap-fade" style={d(350)}>
        <circle cx="90" cy="90" r="16" stroke={C} strokeOpacity="0.9" />
        <circle cx="90" cy="90" r="16" stroke={C} className="ap-onda" />
        <circle cx="90" cy="90" r="4.5" fill={C} />
      </g>
      <g className="ap-fade" style={d(550)}>
        <circle cx="232" cy="66" r="11" stroke={L} />
        <path d="M219.5 62a12.5 12.5 0 0 1 25 0z" stroke={C} fill="rgb(95 211 255 / 0.12)" />
        <path d="M226 72h12" stroke={C} />
        <path d="M210 146v-30a22 22 0 0 1 44 0v30" stroke={L} />
        <path d="M205 132h7M252 132h7" stroke={C} strokeWidth="3" />
        <Caixa x={198} y={44} w={68} h={108} />
      </g>
      {[74, 98, 122].map((y, i) => (
        <g key={y} className="ap-acende" style={d(850 + i * 160)}>
          <circle cx="290" cy={y} r="8" stroke={C} />
          <Visto x={290} y={y - 0.5} />
        </g>
      ))}
    </Hud>
  );
}

/** 02 · Portaria e logística: caminhão chegando à cancela e leitura da placa. */
export function HudPortaria() {
  return (
    <Hud className="aspect-[16/9]">
      <path d="M0 156h320" stroke={F} />
      <g className="ap-fade" style={d(150)}>
        <rect x="34" y="96" width="8" height="60" rx="1" stroke={L} />
        <path d="M42 102h104" stroke={L} strokeWidth="2" />
        <path d="M60 99v6M82 99v6M104 99v6M126 99v6" stroke={F} />
      </g>
      <g className="ap-fade" style={d(300)}>
        <path d="M176 152v-36l10-18h26v54z" stroke={L} />
        <path d="M188 104h20v14h-28" stroke={F} />
        <rect x="212" y="78" width="92" height="74" rx="2" stroke={L} />
        <circle cx="196" cy="154" r="8" stroke={L} fill="#050607" />
        <circle cx="280" cy="154" r="8" stroke={L} fill="#050607" />
        <rect x="170" y="128" width="24" height="10" rx="1.5" stroke={C} />
        <Caixa x={164} y={122} w={36} h={22} t={6} />
      </g>
      <g className="ap-fade" style={d(550)}>
        <path d="M170 128 140 60" stroke={C} strokeOpacity="0.5" strokeDasharray="2 4" />
        <rect x="58" y="28" width="132" height="34" rx="3" stroke={C} />
        <svg x="58" y="28" width="132" height="34" overflow="hidden">
          <rect x="0" y="0" width="132" height="34" fill="none" />
          <g className="ap-varre-x">
            <path d="M66 2v30" stroke={C} strokeOpacity="0.55" />
          </g>
        </svg>
      </g>
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} className="ap-acende" style={d(800 + i * 90)} x={68 + i * 16.5 + (i > 2 ? 6 : 0)} y="37" width="11" height="16" rx="1.5" fill={C} fillOpacity="0.85" />
      ))}
    </Hud>
  );
}

/** 03 · Patrimônio: fábrica fechada, cerca virtual no muro e cruzamento detectado. */
export function HudPatrimonio() {
  return (
    <Hud className="aspect-[16/9]">
      <g className="ap-fade" style={d(150)}>
        <rect x="26" y="40" width="268" height="122" rx="2" stroke={L} />
        <path d="M70 150V96l26-16v16l26-16v16l26-16v16l26-16v70z" stroke={L} />
        <path d="M96 150v-26h20v26" stroke={F} />
        <path d="M146 150v-28h18v28" stroke={C} />
        <path d="M164 122l8 4v24" stroke={C} className="ap-respira" />
      </g>
      <g className="ap-fade" style={d(400)}>
        <rect x="32" y="46" width="256" height="110" rx="1" stroke={C} strokeOpacity="0.7" strokeDasharray="4 5" className="ap-respira" />
      </g>
      <g className="ap-fade" style={d(700)}>
        <circle cx="244" cy="22" r="6" stroke={L} />
        <path d="M234 40v-4a10 10 0 0 1 20 0v4" stroke={L} />
        <circle cx="244" cy="46" r="5" fill={C} />
        <circle cx="244" cy="46" r="5" stroke={C} className="ap-onda" />
        <Caixa x={226} y={8} w={36} h={44} t={7} />
      </g>
    </Hud>
  );
}

/** 04 · Vigilância e resposta: rota da ronda conferida, câmera fora do ar e busca visual. */
export function HudVigilancia() {
  const pontos: [number, number][] = [
    [44, 140],
    [44, 44],
    [176, 44],
    [176, 140],
  ];
  return (
    <Hud className="aspect-[16/9]">
      <g className="ap-fade" style={d(150)}>
        <rect x="24" y="24" width="172" height="136" rx="2" stroke={F} />
        <path d="M110 24v50M24 96h56M140 96h56" stroke={F} />
        <path d="M44 140V44h132v96z" stroke={L} strokeDasharray="3 5" />
      </g>
      {pontos.map(([x, y], i) => (
        <g key={i} className="ap-acende" style={d(450 + i * 220)}>
          <circle cx={x} cy={y} r="6" fill="#050607" stroke={C} />
          <circle cx={x} cy={y} r="2.2" fill={C} />
        </g>
      ))}
      <g className="ap-fade" style={d(500)}>
        <path d="M224 38h28l9 7-9 7h-28z" stroke={L} />
        <path d="M232 52v8h-8" stroke={L} />
        <path d="M218 64 268 30" stroke={C} />
        <circle cx="244" cy="46" r="20" stroke={C} className="ap-onda" />
      </g>
      <g className="ap-fade" style={d(800)}>
        <circle cx="252" cy="122" r="26" stroke={C} />
        <path d="m271 141 16 16" stroke={C} strokeWidth="2" />
        <circle cx="252" cy="112" r="6" stroke={L} />
        <path d="M241 134v-3a11 11 0 0 1 22 0v3" stroke={L} />
      </g>
    </Hud>
  );
}

/* --------------------------- telas de câmera (slide 4) --------------------------- */

/** Cena genérica em linha fina, só para lembrar uma imagem de câmera. */
function Cena({ i }: { i: number }) {
  const h = [62, 56, 70, 60, 66, 58, 64, 54, 68][i % 9];
  const fuga = [120, 70, 170, 100, 150, 80, 130, 190, 60][i % 9];
  return (
    <svg viewBox="0 0 240 135" preserveAspectRatio="xMidYMid slice" aria-hidden className="absolute inset-0 h-full w-full" fill="none" stroke="rgb(255 255 255 / 0.13)" strokeWidth="1">
      <path d={`M0 ${h}H240`} />
      {[-200, -80, 0, 90, 220, 360].map((x) => (
        <path key={x} d={`M${fuga} ${h}L${x} 135`} />
      ))}
      {i % 3 === 0 && <rect x="24" y={h - 34} width="34" height="34" />}
      {i % 3 === 1 && <path d={`M150 ${h}v-30h52v30`} />}
      {i % 3 === 2 && <path d={`M30 ${h}v-22h60v22M100 ${h}v-22h60v22`} />}
      {i % 4 === 1 && (
        <>
          <circle cx={fuga + 30} cy={h + 18} r="5" />
          <path d={`M${fuga + 22} ${h + 44}v-12a8 8 0 0 1 16 0v12`} />
        </>
      )}
    </svg>
  );
}

export function TelaCamera({ i }: { i: number }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-md border border-white/[0.09] bg-[#070809]">
      <Cena i={i} />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(0_0_0/0.65))]" />
      <span className="absolute left-2 top-1.5 flex items-center gap-1.5 text-[clamp(0.55rem,0.75vw,0.8rem)] font-medium tracking-[0.14em] text-white/70">
        <span className="ap-respira h-[0.5em] w-[0.5em] rounded-full bg-[#e5484d]" style={{ animationDelay: `${(i * 370) % 1600}ms` }} />
        REC
      </span>
    </div>
  );
}

/* ------------------------------ chat do assistente ------------------------------ */

const CONVERSA = [
  { p: "Quantos caminhões saíram hoje?", r: "Hoje saíram 47 caminhões. O último às 17h32." },
  { p: "Em qual turno tivemos mais ocorrências esta semana?", r: "No turno da noite: 9 ocorrências, 6 delas de EPI." },
];

const TECLA = 32; // ms por letra
const PENSA = 800; // "digitando..." antes da resposta
const PAUSA = 1100; // depois da resposta, antes da próxima pergunta

/** Linha do tempo da conversa: quando cada pergunta começa e quando a resposta chega. */
const ROTEIRO = (() => {
  let t = 700;
  return CONVERSA.map(({ p }) => {
    const inicio = t;
    const resposta = inicio + p.length * TECLA + PENSA;
    t = resposta + PAUSA;
    return { inicio, resposta };
  });
})();
const FIM = ROTEIRO[ROTEIRO.length - 1].resposta + 100;

/** Caixa do assistente de IA: as perguntas são digitadas e as respostas chegam em seguida. Uma vez só. */
export function ChatAssistente() {
  const ativo = useAtivo();
  const [t, setT] = useState(-1);

  useEffect(() => {
    if (!ativo) return;
    if (reduzido()) {
      setT(FIM);
      return;
    }
    const t0 = performance.now();
    const id = window.setInterval(() => {
      const agora = performance.now() - t0;
      setT(agora);
      if (agora >= FIM) window.clearInterval(id);
    }, 33);
    return () => window.clearInterval(id);
  }, [ativo]);

  return (
    <div className="ap-in overflow-hidden rounded-2xl border border-white/10 bg-[#07090b]" style={d(250)}>
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3.5">
        <LogoA className="h-4 text-white" />
        <span className="ap-pulso h-2 w-2 rounded-full bg-[#5FD3FF]" />
      </div>
      <div className="flex flex-col gap-3 p-5 ap-pequeno">
        {CONVERSA.map((c, i) => {
          const { inicio, resposta } = ROTEIRO[i];
          const letras = Math.max(0, Math.min(c.p.length, Math.floor((t - inicio) / TECLA)));
          const digitando = t >= inicio && letras < c.p.length;
          const pensando = t >= inicio + c.p.length * TECLA && t < resposta;
          return (
            <div key={i} className="flex flex-col gap-3">
              <div className={`ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-white/[0.09] px-4 py-2.5 text-white transition-opacity duration-300 ${t >= inicio ? "opacity-100" : "opacity-0"}`}>
                <span className="relative block">
                  <span className="invisible">{c.p}</span>
                  <span className="absolute inset-0">
                    {c.p.slice(0, letras)}
                    {digitando && <span className="ap-cursor ml-px inline-block h-[1em] w-px translate-y-[0.15em] bg-[#5FD3FF]" />}
                  </span>
                </span>
              </div>
              <div className="relative mr-auto max-w-[85%]">
                <div className={`rounded-2xl rounded-bl-md border border-[#5FD3FF]/25 bg-[#5FD3FF]/[0.06] px-4 py-2.5 text-white/90 transition-all duration-500 ${t >= resposta ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}>{c.r}</div>
                <div aria-hidden className={`absolute left-4 top-1/2 flex -translate-y-1/2 gap-1.5 transition-opacity duration-200 ${pensando ? "opacity-100" : "opacity-0"}`}>
                  {[0, 1, 2].map((k) => (
                    <span key={k} className="ap-pulso h-1.5 w-1.5 rounded-full bg-[#5FD3FF]" style={{ animationDelay: `${k * 160}ms`, animationDuration: "1s" }} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ painel ilustrativo (slide 11) ------------------------------ */

const KPIS = [
  { rotulo: "Câmeras ativas", valor: 64 },
  { rotulo: "Alertas hoje", valor: 12 },
  { rotulo: "Resolvidos", valor: 11 },
  { rotulo: "Veículos registrados", valor: 47 },
];

const FEED = [
  { hora: "02:14", local: "Fonte", tipo: "Movimento em área restrita", status: "Central acionada", aberto: true },
  { hora: "06:58", local: "Portaria", tipo: "Placa não cadastrada", status: "Verificado" },
  { hora: "09:42", local: "Envase, Linha 2", tipo: "Colaborador sem touca", status: "Resolvido" },
  { hora: "11:15", local: "Manutenção", tipo: "EPI ausente: capacete", status: "Resolvido" },
  { hora: "14:03", local: "Doca", tipo: "Câmera virada", status: "Técnico notificado", aberto: true },
  { hora: "19:20", local: "Muro leste", tipo: "Cerca virtual cruzada", status: "Em andamento", aberto: true },
];

const FEED_INICIO = 900;
const FEED_PASSO = 260;

/** Miniatura da câmera do envase com a caixa de detecção. */
function Miniatura() {
  return (
    <svg viewBox="0 0 160 90" aria-hidden className="block h-full w-full" fill="none" strokeLinecap="round">
      <rect width="160" height="90" fill="#0b0e10" />
      <path d="M0 58h160M20 58 0 90M60 58 46 90M100 58l14 32M140 58l20 32" stroke="rgb(255 255 255 / 0.14)" />
      <path d="M10 58V36h44v22M110 58V30h40v28" stroke="rgb(255 255 255 / 0.18)" />
      <circle cx="80" cy="34" r="7" stroke="rgb(255 255 255 / 0.7)" />
      <path d="M66 70V55a14 14 0 0 1 28 0v15" stroke="rgb(255 255 255 / 0.7)" />
      <Caixa x={61} y={22} w={38} h={52} t={7} />
    </svg>
  );
}

export function PainelIlustrativo() {
  return (
    <div className="lg:flex lg:items-end lg:gap-[clamp(1rem,1.6vw,1.75rem)]">
      <div className="ap-in relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#07090b]" style={d(150)}>
        <div aria-hidden className="ap-varredura" style={{ "--t": "11s" } as React.CSSProperties} />
        {/* topo */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-[clamp(0.9rem,1.4vw,1.5rem)] py-3">
          <div className="flex items-center gap-4">
            <LogoAIP className="h-[clamp(0.85rem,1.2vw,1.15rem)] text-white" />
            <div className="flex rounded-md border border-white/12 p-0.5 text-[clamp(0.7rem,0.85vw,0.95rem)]">
              {["Unidade 1", "Unidade 2", "Todas"].map((u) => (
                <span key={u} className={`rounded px-2.5 py-1 ${u === "Todas" ? "bg-[#5FD3FF]/15 text-[#5FD3FF]" : "text-white/55"}`}>
                  {u}
                </span>
              ))}
            </div>
          </div>
          <span className="flex items-center gap-2 text-[clamp(0.7rem,0.85vw,0.95rem)] font-medium uppercase tracking-[0.16em] text-white/80">
            <span className="relative flex h-2 w-2">
              <span className="ap-onda absolute inset-0 rounded-full bg-[#5FD3FF]" />
              <span className="relative h-2 w-2 rounded-full bg-[#5FD3FF]" />
            </span>
            Ao vivo
          </span>
        </div>
        {/* indicadores */}
        <div className="grid grid-cols-2 border-b border-white/10 sm:grid-cols-4">
          {KPIS.map((k, i) => (
            <div key={k.rotulo} className={`px-[clamp(0.9rem,1.4vw,1.5rem)] py-[clamp(0.6rem,1.6vh,1rem)] ${i % 2 ? "border-l border-white/10" : ""} ${i >= 2 ? "border-t border-white/10 sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}>
              <div className="text-[clamp(0.7rem,0.85vw,0.95rem)] text-white/55">{k.rotulo}</div>
              <Conta ate={k.valor} atraso={350 + i * 90} duracao={1300} className="ap-num block text-[clamp(1.75rem,min(2.6vw,4.6vh),3.25rem)] leading-none text-white" />
            </div>
          ))}
        </div>
        {/* feed de alertas */}
        <ul className="divide-y divide-white/[0.07] text-[clamp(0.78rem,min(0.98vw,1.8vh),1.1rem)]">
          {FEED.map((a, i) => (
            <li key={a.hora} className="ap-in grid grid-cols-[3.4em_1fr_auto] items-center gap-x-3 gap-y-0.5 px-[clamp(0.9rem,1.4vw,1.5rem)] py-[clamp(0.45rem,1.15vh,0.8rem)] md:grid-cols-[3.6em_minmax(0,0.9fr)_minmax(0,1.3fr)_auto]" style={d(FEED_INICIO + i * FEED_PASSO)}>
              <span className="ap-num text-white/55">{a.hora}</span>
              <span className="truncate text-white/90">{a.local}</span>
              <span className="col-start-2 truncate text-white/60 md:col-start-auto">{a.tipo}</span>
              <span
                className={`col-start-3 row-span-2 row-start-1 justify-self-end whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.85em] md:col-start-auto md:row-span-1 md:row-start-auto ${a.aberto ? "border-[#5FD3FF]/40 text-[#5FD3FF]" : "border-white/12 text-white/50"}`}
              >
                {a.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* celular com a notificação do WhatsApp (chega junto com o alerta das 09:42) */}
      <div className="ap-in mx-auto mt-6 w-[min(17rem,78vw)] shrink-0 lg:mx-0 lg:mb-[-1.5rem] lg:mt-0 lg:w-[clamp(10.5rem,13vw,15rem)]" style={d(FEED_INICIO + 2 * FEED_PASSO + 350)}>
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
                <p className="px-1 pb-0.5 pt-1.5">AIP | Alerta: Envase, Linha 2, colaborador sem touca, 09:42</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ anel dos 30 dias (slide 14) ------------------------------ */

/** "30" com um anel de 60 marcas que acendem em sequência, como um contador. */
export function Anel30() {
  const marcas = 60;
  return (
    <div className="relative mx-auto aspect-square w-[min(72vw,52vh,30rem)]">
      <svg viewBox="0 0 200 200" aria-hidden className="absolute inset-0 h-full w-full" fill="none" strokeLinecap="round">
        <circle cx="100" cy="100" r="76" stroke={F} />
        {Array.from({ length: marcas }, (_, i) => {
          const a = (i / marcas) * Math.PI * 2 - Math.PI / 2;
          // arredondado: servidor e navegador calculam seno/cosseno com diferenças mínimas
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
        <Conta ate={30} atraso={300} duracao={1440} className="ap-num font-bold leading-none text-white text-[min(30vw,22vh,12.5rem)]" />
      </div>
    </div>
  );
}

/* ------------------------------ linha do tempo (slide 15) ------------------------------ */

const ETAPAS: { n: string; titulo: string; frase: string; icone: NomeIcone }[] = [
  { n: "01", titulo: "Visita técnica", frase: "conhecemos a operação e as unidades.", icone: "local" },
  { n: "02", titulo: "Avaliação das câmeras", frase: "verificamos o que já existe e o que cada câmera pode monitorar.", icone: "busca" },
  { n: "03", titulo: "Teste de 30 dias", frase: "a AIP funcionando numa unidade, sem custo.", icone: "teste" },
  { n: "04", titulo: "Expansão", frase: "levamos para as demais unidades.", icone: "expansao" },
];

const LINHA_INICIO = 400;
const LINHA_DUR = 2400;
export const LINHA_FIM = LINHA_INICIO + LINHA_DUR;

/**
 * Quatro etapas ligadas por uma linha ciano que se desenha (horizontal no
 * desktop, vertical no celular). Cada etapa acende quando a linha chega nela;
 * no fim, a etapa 04 se ramifica em pontos (as outras unidades).
 */
export function LinhaDoTempo() {
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
              {i === ETAPAS.length - 1 && <Ramos />}
            </div>
            <div className="ap-acende min-w-0 lg:mt-5" style={d(quando(i))}>
              <div className="ap-num text-[clamp(1rem,1.4vw,1.6rem)] text-[#5FD3FF]">{e.n}</div>
              <div className="mt-1 font-titulo text-[clamp(1.4rem,min(2vw,3.6vh),2.4rem)] font-semibold leading-tight">{e.titulo}:</div>
              <p className="mt-1.5 text-white/70 ap-pequeno lg:mx-auto lg:max-w-[22ch]">{e.frase}</p>
              {i === ETAPAS.length - 1 && <RamosCelular />}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** A etapa 04 se ramifica: pequenos pontos (as demais unidades) acendendo depois que a linha termina. */
function Ramos() {
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
function RamosCelular() {
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
