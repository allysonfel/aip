"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Demonstração "Visão computacional aplicada à realidade": uma praça vista do
// alto e quatro camadas em SVG que se somam (detectar, rastrear, contar,
// interpretar). No desktop a imagem fica fixa à direita e a camada muda
// conforme o texto da etapa passa pelo meio da tela; no celular cada etapa
// tem a sua imagem acima do texto. Dados ilustrativos.

const L = 1792; // tamanho original da foto (praca-demo.jpg)
const A = 1344;
const CIANO = "#5CE1E6";

export const ETAPAS = [
  { titulo: "Detectar", texto: "Uma rede neural localiza as pessoas em cada quadro analisado." },
  { titulo: "Rastrear", texto: "Um algoritmo acompanha cada pessoa ao longo do trajeto, sem identificá-la." },
  { titulo: "Contar", texto: "Linhas virtuais registram quantas pessoas passam por cada ponto." },
  { titulo: "Interpretar", texto: "Os dados viram indicadores de fluxo, ocupação e uso dos espaços." },
];

// Pessoas na foto: centro (x, y), largura e altura da caixa, em pixels da
// imagem original, e o deslocamento de onde a trajetória começa (atrás dela).
const PESSOAS: { x: number; y: number; l: number; a: number; de: [number, number] }[] = [
  { x: 498, y: 297, l: 28, a: 60, de: [-70, -170] },
  { x: 926, y: 258, l: 26, a: 58, de: [70, -150] },
  { x: 1138, y: 187, l: 26, a: 54, de: [-120, -40] },
  { x: 1235, y: 177, l: 26, a: 52, de: [90, -60] },
  { x: 1134, y: 300, l: 28, a: 60, de: [130, -110] },
  { x: 1280, y: 281, l: 26, a: 58, de: [70, -150] },
  { x: 1121, y: 408, l: 28, a: 58, de: [150, -40] },
  { x: 1024, y: 462, l: 30, a: 68, de: [-60, -200] },
  { x: 1141, y: 453, l: 30, a: 64, de: [110, -170] },
  { x: 838, y: 593, l: 32, a: 74, de: [-150, -150] },
  { x: 962, y: 574, l: 32, a: 68, de: [40, -230] },
  { x: 1490, y: 597, l: 34, a: 74, de: [90, -190] },
  { x: 1492, y: 695, l: 32, a: 66, de: [60, -150] },
  { x: 893, y: 771, l: 38, a: 78, de: [-190, -120] },
  { x: 763, y: 806, l: 42, a: 82, de: [-90, -230] },
  { x: 1106, y: 881, l: 36, a: 76, de: [-210, -150] },
  { x: 1139, y: 903, l: 36, a: 76, de: [-230, -110] },
  { x: 322, y: 1200, l: 46, a: 78, de: [140, -170] },
];

// Linha virtual de contagem atravessando a praça.
const LINHA = { x1: 520, y1: 700, x2: 1600, y2: 520 };

// Manchas do mapa de calor (áreas mais movimentadas).
const CALOR = [
  { x: 960, y: 600, r: 300, f: 1 },
  { x: 1130, y: 420, r: 230, f: 0.85 },
  { x: 860, y: 800, r: 250, f: 0.8 },
  { x: 1120, y: 890, r: 180, f: 0.65 },
  { x: 1490, y: 650, r: 150, f: 0.5 },
];

const TOTAL = 1248;
const pct = (v: number, t: number) => `${(v / t) * 100}%`;

/** Liga quando o elemento entra na tela (uma vez). */
function useVisto<T extends Element>() {
  const ref = useRef<T>(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisto(true);
        obs.disconnect();
      }
    }, { threshold: 0.35 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visto] as const;
}

/** Contador que sobe até `alvo` quando `ligado`. */
function Contador({ ligado, instantaneo = false }: { ligado: boolean; instantaneo?: boolean }) {
  const [valor, setValor] = useState(instantaneo ? TOTAL : 0);
  useEffect(() => {
    if (instantaneo) return;
    if (!ligado) {
      setValor(0);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValor(TOTAL);
      return;
    }
    let quadro = 0;
    const inicio = performance.now();
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / 1800);
      setValor(Math.round(TOTAL * (1 - Math.pow(1 - t, 3))));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [ligado, instantaneo]);
  return <>{valor.toLocaleString("pt-BR")}</>;
}

const TRANSICAO = "transition-[opacity,stroke-dashoffset,transform] duration-700 ease-out motion-reduce:transition-none";

/**
 * A praça com as camadas até `nivel` (0 = só detectar ... 3 = tudo).
 * `estatico`: tudo já desenhado, sem animação (versão curta da página inicial).
 */
export function Praca({ nivel, ligado = true, prioridade = false, estatico = false }: { nivel: number; ligado?: boolean; prioridade?: boolean; estatico?: boolean }) {
  const mostra = (n: number) => ligado && nivel >= n;
  return (
    <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-painel ${estatico ? "[&_*]:!transition-none" : ""}`}>
      <Image src="/site/media/praca-demo.jpg" alt="Praça vista do alto com pessoas caminhando" fill priority={prioridade} sizes="(min-width: 1024px) 55vw, 100vw" quality={85} className="object-cover" />

      <svg viewBox={`0 0 ${L} ${A}`} aria-hidden className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="aip-calor">
            <stop offset="0%" stopColor="#ffb547" stopOpacity="0.7" />
            <stop offset="45%" stopColor="#ff8a3d" stopOpacity="0.32" />
            <stop offset="75%" stopColor={CIANO} stopOpacity="0.08" />
            <stop offset="100%" stopColor={CIANO} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 4. Interpretar: mapa de calor (fica por baixo das outras camadas) */}
        <g className={TRANSICAO} style={{ opacity: mostra(3) ? 1 : 0, transitionDuration: "1200ms", mixBlendMode: "screen" }}>
          {CALOR.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="url(#aip-calor)" opacity={c.f} />
          ))}
        </g>

        {/* 2. Rastrear: trajetórias se desenhando atrás de cada pessoa */}
        <g fill="none" stroke={CIANO} strokeWidth="1.25" strokeLinecap="round" vectorEffect="non-scaling-stroke">
          {PESSOAS.map((p, i) => {
            const pe = { x: p.x, y: p.y + p.a / 2 };
            const ini = { x: pe.x + p.de[0], y: pe.y + p.de[1] };
            const ctrl = { x: (ini.x + pe.x) / 2 + p.de[1] * 0.1, y: (ini.y + pe.y) / 2 - p.de[0] * 0.1 };
            return (
              <path
                key={i}
                d={`M${ini.x} ${ini.y} Q${ctrl.x} ${ctrl.y} ${pe.x} ${pe.y}`}
                pathLength={1}
                strokeDasharray="1"
                strokeOpacity="0.7"
                vectorEffect="non-scaling-stroke"
                className={TRANSICAO}
                style={{ strokeDashoffset: mostra(1) ? 0 : 1, transitionDuration: "1400ms", transitionDelay: mostra(1) ? `${i * 45}ms` : "0ms" }}
              />
            );
          })}
        </g>

        {/* 3. Contar: linha virtual com marcas de direção */}
        <g className={TRANSICAO} style={{ opacity: mostra(2) ? 1 : 0 }}>
          <line {...LINHA} stroke="#fff" strokeWidth="1.5" strokeDasharray="10 8" vectorEffect="non-scaling-stroke" />
          <circle cx={LINHA.x1} cy={LINHA.y1} r="7" fill="#fff" />
          <circle cx={LINHA.x2} cy={LINHA.y2} r="7" fill="#fff" />
        </g>

        {/* 1. Detectar: caixas finas em volta de cada pessoa */}
        <g fill="none" stroke={CIANO} strokeWidth="1.25">
          {PESSOAS.map((p, i) => (
            <rect
              key={i}
              x={p.x - p.l / 2}
              y={p.y - p.a / 2}
              width={p.l}
              height={p.a}
              rx="3"
              vectorEffect="non-scaling-stroke"
              className={TRANSICAO}
              style={{ opacity: mostra(0) ? 1 : 0, transform: mostra(0) ? "scale(1)" : "scale(1.35)", transformOrigin: `${p.x}px ${p.y}px`, transformBox: "view-box", transitionDelay: mostra(0) ? `${i * 40}ms` : "0ms" }}
            />
          ))}
        </g>

        {/* 2. Rastrear: número de cada pessoa */}
        <g fontFamily="var(--font-barlow), system-ui, sans-serif" fontSize="22" fontWeight="500">
          {PESSOAS.map((p, i) => (
            <g key={i} className={TRANSICAO} style={{ opacity: mostra(1) ? 1 : 0, transitionDelay: mostra(1) ? `${300 + i * 45}ms` : "0ms" }}>
              <rect x={p.x - p.l / 2} y={p.y - p.a / 2 - 30} width="52" height="26" rx="3" fill={CIANO} />
              <text x={p.x - p.l / 2 + 26} y={p.y - p.a / 2 - 11} textAnchor="middle" fill="#001417">
                #{String(i + 1).padStart(2, "0")}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* 3. Contar: contador junto à linha */}
      <div
        // No celular fica no canto de cima (vazio); no desktop, junto ao início da linha.
        className={`absolute left-[3%] top-[4%] rounded-md border border-white/25 bg-black/55 px-2.5 py-1.5 backdrop-blur-sm transition-opacity duration-700 motion-reduce:transition-none lg:left-[var(--x)] lg:top-[var(--y)] lg:px-3 lg:py-2 ${mostra(2) ? "opacity-100" : "opacity-0"}`}
        style={{ "--x": pct(LINHA.x1 - 70, L), "--y": pct(LINHA.y1 + 40, A) } as React.CSSProperties}
      >
        <p className="text-[9px] uppercase tracking-[0.12em] text-white/60 lg:text-[11px]">Passagens</p>
        <p className="font-titulo text-base font-semibold leading-none text-white tabular-nums lg:text-2xl">
          <Contador ligado={mostra(2)} instantaneo={estatico} />
        </p>
      </div>

      {/* 4. Interpretar: painel de indicadores */}
      <div
        className={`absolute bottom-[4%] right-[3%] rounded-md border border-white/20 bg-black/60 px-2.5 py-2 text-[9px] backdrop-blur-sm transition-[opacity,transform] duration-700 motion-reduce:transition-none lg:px-4 lg:py-3 lg:text-xs ${mostra(3) ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"}`}
      >
        <p className="mb-1 uppercase tracking-[0.12em] text-white/55 lg:mb-1.5">Indicadores</p>
        <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 lg:gap-x-4 lg:gap-y-1">
          <dt className="text-white/65">Pico</dt>
          <dd className="text-right text-white">18h</dd>
          <dt className="text-white/65">Área mais usada</dt>
          <dd className="text-right text-white">centro</dd>
          <dt className="text-white/65">Ocupação</dt>
          <dd className="text-right text-white">64%</dd>
        </dl>
      </div>
    </div>
  );
}

/** Etapa no celular: imagem com a sua camada, acima do texto. */
function EtapaMovel({ indice }: { indice: number }) {
  const [ref, visto] = useVisto<HTMLLIElement>();
  const e = ETAPAS[indice];
  return (
    <li ref={ref}>
      <Praca nivel={indice} ligado={visto} />
      <p className="mt-5 font-titulo text-sm font-semibold tracking-[0.12em] text-visao">{String(indice + 1).padStart(2, "0")}</p>
      <h3 className="titulo-coluna mt-1">{e.titulo}</h3>
      <p className="corpo mt-2">{e.texto}</p>
    </li>
  );
}

export default function DemonstracaoVisao() {
  const [ativa, setAtiva] = useState(-1);
  const blocos = useRef<(HTMLLIElement | null)[]>([]);

  // Desktop: a etapa cujo texto cruza o meio da tela vira a ativa.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) setAtiva(Number((e.target as HTMLElement).dataset.indice));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    blocos.current.forEach((b) => b && obs.observe(b));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* Desktop */}
      <div className="hidden gap-16 lg:grid lg:grid-cols-[1fr_1.35fr]">
        <ol>
          {ETAPAS.map((e, i) => (
            <li
              key={e.titulo}
              ref={(el) => {
                blocos.current[i] = el;
              }}
              data-indice={i}
              className={`flex min-h-[70vh] flex-col justify-center transition-opacity duration-500 ${ativa === i ? "opacity-100" : "opacity-35"}`}
            >
              <p className="font-titulo text-sm font-semibold tracking-[0.12em] text-visao">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="titulo-tela mt-2">{e.titulo}</h3>
              <p className="corpo mt-4 max-w-[26rem] text-lg">{e.texto}</p>
            </li>
          ))}
        </ol>
        <div>
          <div className="sticky top-[max(6rem,calc(50vh-15.5rem))]">
            <Praca nivel={ativa} ligado={ativa >= 0} />
          </div>
        </div>
      </div>

      {/* Celular */}
      <ol className="flex flex-col gap-14 lg:hidden">
        {ETAPAS.map((e, i) => (
          <EtapaMovel key={e.titulo} indice={i} />
        ))}
      </ol>
    </>
  );
}
