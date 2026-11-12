"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PONTOS_MAPA } from "../_content/mapa-mundi";
import { CONTORNOS } from "../_content/contornos-paises";

const C = "#5FD3FF";

export function reduzido() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Liga uma vez quando o elemento entra na tela. */
export function useVisto<T extends Element>(limiar = 0.3) {
  const ref = useRef<T>(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisto(true);
          obs.disconnect();
        }
      },
      { threshold: limiar },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [limiar]);
  return [ref, visto] as const;
}

/**
 * Manifesto: as palavras começam em cinza escuro e acendem para branco, uma a
 * uma, acompanhando a rolagem. Com "reduzir movimento", o texto já vem branco.
 */
export function Manifesto({ texto }: { texto: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const palavras = texto.split(" ");
  const [acesas, setAcesas] = useState(0);

  useEffect(() => {
    if (reduzido()) {
      setAcesas(palavras.length);
      return;
    }
    let quadro = 0;
    const calcular = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Começa a acender quando o texto entra pelo terço de baixo da tela e
      // termina quando o fim dele passa do meio.
      const inicio = vh * 0.85;
      const fim = vh * 0.45;
      const p = (inicio - r.top) / (inicio - fim + r.height);
      setAcesas(Math.max(0, Math.min(palavras.length, Math.round(p * palavras.length))));
    };
    const rolar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(calcular);
    };
    calcular();
    window.addEventListener("scroll", rolar, { passive: true });
    window.addEventListener("resize", rolar);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", rolar);
      window.removeEventListener("resize", rolar);
    };
  }, [palavras.length]);

  return (
    <p ref={ref} className="max-w-[62rem] text-[1.75rem] font-light leading-[1.3] sm:text-4xl md:text-5xl md:leading-[1.2]">
      <span className="sr-only">{texto}</span>
      <span aria-hidden>
        {palavras.map((p, i) => (
          <span key={i} className={`transition-colors duration-300 ${i < acesas ? "text-white" : "text-white/20"}`}>
            {p}{" "}
          </span>
        ))}
      </span>
    </p>
  );
}

// Coordenadas no mapa (x = longitude + 180, y = 90 - latitude).
const BRASIL = { x: 142, y: 98 }; // Nordeste, na altura de Pernambuco
const ORIGENS = [
  { x: 82, y: 50, nome: "Estados Unidos" },
  { x: 180, y: 39, nome: "Europa" },
  { x: 196, y: 38, nome: "Europa" },
  { x: 274, y: 30, nome: "Rússia" },
  { x: 282, y: 54, nome: "China" },
  { x: 215, y: 58.5, nome: "Israel" },
];

/**
 * Mapa-múndi em pontos. Quando a seção aparece, linhas curvas saem da
 * Estados Unidos, da Europa, da Rússia, da China e de Israel e convergem para o Brasil, que acende
 * em ciano com um anel pulsando.
 */
export function MapaMundi() {
  const [ref, visto] = useVisto<HTMLDivElement>(0.35);
  return (
    <div ref={ref} className={`cartao-uso ${visto ? "ativo" : ""}`}>
      <svg viewBox="0 6 360 150" role="img" aria-label="Mapa-múndi com linhas saindo dos Estados Unidos, da Europa, da Rússia, da China e de Israel em direção ao Brasil" className="h-auto w-full overflow-visible" fill="none">
        <g fill="rgb(255 255 255 / 0.32)">
          {PONTOS_MAPA.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.05" />
          ))}
        </g>
        {ORIGENS.map((o, i) => {
          const cx = (o.x + BRASIL.x) / 2;
          const cy = Math.min(o.y, BRASIL.y) - 24;
          return (
            <g key={i}>
              <path className="mv-linha" style={{ "--d": `${200 + i * 180}ms` } as CSSProperties} d={`M${o.x} ${o.y} Q${cx} ${cy} ${BRASIL.x} ${BRASIL.y}`} stroke={C} strokeOpacity="0.75" strokeWidth="0.7" pathLength={1} />
              <circle className="mv-ponto" style={{ "--d": `${100 + i * 180}ms` } as CSSProperties} cx={o.x} cy={o.y} r="1.8" fill="#fff" />
            </g>
          );
        })}
        {/* Brasil */}
        <circle className="mv-ponto" style={{ "--d": "1400ms" } as CSSProperties} cx={BRASIL.x} cy={BRASIL.y} r="9" fill={C} fillOpacity="0.12" />
        <circle className="mv-ponto" style={{ "--d": "1400ms" } as CSSProperties} cx={BRASIL.x} cy={BRASIL.y} r="2.6" fill={C} />
        <circle className="mv-pulso" style={{ animationDelay: "1600ms" }} cx={BRASIL.x} cy={BRASIL.y} r="2.6" stroke={C} strokeWidth="0.8" />
      </svg>
    </div>
  );
}

/** Princípios em colunas com linhas finas verticais que se desenham ao aparecer. */
export function Principios({ itens }: { itens: { titulo: string; texto: string }[] }) {
  const [ref, visto] = useVisto<HTMLOListElement>(0.25);
  return (
    <ol ref={ref} className="grid gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
      {itens.map((p, i) => (
        <li key={p.titulo} className="relative pl-6 pr-4 sm:pl-8">
          <span aria-hidden className="absolute bottom-0 left-0 top-0 w-px origin-top bg-white/20 transition-transform duration-[1200ms] ease-out motion-reduce:transition-none" style={{ transform: visto ? "scaleY(1)" : "scaleY(0)", transitionDelay: `${i * 150}ms` }} />
          <p className="font-titulo text-sm font-medium tracking-[0.18em] text-white/45">{String(i + 1).padStart(2, "0")}</p>
          <h3 className="mt-3 font-titulo text-[1.75rem] font-bold leading-[1.05]">{p.titulo}</h3>
          <p className="corpo mt-3">{p.texto}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * Linha do tempo: horizontal no desktop, vertical no celular. A linha se
 * desenha e cada ponto acende em ciano quando ela chega nele.
 */
export function LinhaDoTempo({ etapas }: { etapas: { titulo: string; texto: string }[] }) {
  const [ref, visto] = useVisto<HTMLOListElement>(0.3);
  const dur = 1600;
  const n = etapas.length;
  return (
    <ol ref={ref} className="relative grid gap-10 md:grid-cols-4 md:gap-6">
      {/* trilho + linha que se desenha */}
      <span aria-hidden className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-white/10 md:left-0 md:right-0 md:top-[7px] md:h-px md:w-auto" />
      <span aria-hidden className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px origin-top bg-[#5FD3FF] transition-transform ease-linear motion-reduce:transition-none md:left-0 md:right-[calc(25%-1.125rem-7px)] md:top-[7px] md:h-px md:w-auto md:origin-left" style={{ transform: visto ? "scale(1)" : "scale(0)", transitionDuration: `${dur}ms` }} />
      {etapas.map((e, i) => {
        const atraso = n > 1 ? (i / (n - 1)) * dur : 0;
        return (
          <li key={e.titulo} className="relative pl-9 md:pl-0 md:pt-10">
            <span aria-hidden className={`absolute left-0 top-0.5 h-[15px] w-[15px] rounded-full border transition-colors duration-500 motion-reduce:transition-none md:top-0 ${visto ? "border-[#5FD3FF] bg-[#5FD3FF] shadow-[0_0_14px_#5FD3FF]" : "border-white/30 bg-black"}`} style={{ transitionDelay: visto ? `${atraso}ms` : "0ms" }} />
            <p className="font-titulo text-sm font-medium tracking-[0.18em] text-white/45">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="mt-2 font-titulo text-[1.75rem] font-bold leading-[1.05]">{e.titulo}</h3>
            <p className="corpo mt-2 max-w-[18rem]">{e.texto}</p>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Mini-visuais dos destaques da seção Inovação ---------- */

const R_GLOBO = 26;
const GIRO = 24; // segundos por volta

/** Valores de uma volta inteira para um ponto na longitude `lon` (graus). */
function volta(lon: number, f: (a: number) => number, passos = 36) {
  return Array.from({ length: passos + 1 }, (_, i) => f(((lon + (i / passos) * 360) * Math.PI) / 180).toFixed(2)).join(";");
}

/** 01 — Globo em linhas finas girando devagar, com pontos que acendem em ciano. */
function Globo({ mover }: { mover: boolean }) {
  const c = 32;
  const lats = [-60, -30, 0, 30, 60];
  const meridianos = [0, 45, 90, 135];
  const pontos = [
    { lon: 20, lat: 25 },
    { lon: 110, lat: -15 },
    { lon: 200, lat: 40 },
    { lon: 290, lat: -35 },
  ];
  return (
    <svg viewBox="0 0 64 64" className="h-20 w-20" fill="none" aria-hidden>
      <circle className="mv-linha" cx={c} cy={c} r={R_GLOBO} stroke="rgb(255 255 255 / 0.55)" strokeWidth="0.8" pathLength={1} />
      {lats.map((la, i) => {
        const y = c - R_GLOBO * Math.sin((la * Math.PI) / 180);
        const w = R_GLOBO * Math.cos((la * Math.PI) / 180);
        return <path key={la} className="mv-linha" style={{ "--d": `${150 + i * 80}ms` } as CSSProperties} d={`M${c - w} ${y}H${c + w}`} stroke="rgb(255 255 255 / 0.3)" strokeWidth="0.6" pathLength={1} />;
      })}
      {meridianos.map((m, i) => (
        <ellipse key={m} className="mv-ponto" style={{ "--d": `${300 + i * 80}ms` } as CSSProperties} cx={c} cy={c} rx={Math.abs(R_GLOBO * Math.sin((m * Math.PI) / 180))} ry={R_GLOBO} stroke="rgb(255 255 255 / 0.3)" strokeWidth="0.6">
          {mover && <animate attributeName="rx" dur={`${GIRO}s`} repeatCount="indefinite" values={volta(m, (a) => Math.abs(R_GLOBO * Math.sin(a)))} />}
        </ellipse>
      ))}
      {pontos.map((p, i) => {
        const k = R_GLOBO * Math.cos((p.lat * Math.PI) / 180);
        const y = c - R_GLOBO * Math.sin((p.lat * Math.PI) / 180);
        const a0 = (p.lon * Math.PI) / 180;
        return (
          <g key={i} className="mv-ponto" style={{ "--d": `${800 + i * 220}ms` } as CSSProperties}>
            <circle cx={c + k * Math.sin(a0)} cy={y} r="1.9" fill={C} opacity={Math.cos(a0) > 0 ? 1 : 0.15}>
              {mover && (
                <>
                  <animate attributeName="cx" dur={`${GIRO}s`} repeatCount="indefinite" values={volta(p.lon, (a) => c + k * Math.sin(a))} />
                  <animate attributeName="opacity" dur={`${GIRO}s`} repeatCount="indefinite" values={volta(p.lon, (a) => (Math.cos(a) > 0 ? 1 : 0.15))} />
                </>
              )}
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

/** 02 — Contornos de EUA, Europa, Rússia, China e Israel; uma linha passa por eles e termina no Brasil. */
function Paises() {
  const passo = 50;
  const fim = CONTORNOS.length * passo + 14;
  return (
    <svg viewBox={`0 0 ${fim + 8} 40`} className="h-20 w-auto max-w-full" fill="none" role="img" aria-label="Contornos dos Estados Unidos, da Europa, da Rússia, da China e de Israel, ligados por uma linha até o Brasil">
      <path className="mv-linha" style={{ "--d": "500ms" } as CSSProperties} d={`M2 20H${fim}`} stroke={C} strokeOpacity="0.6" strokeWidth="0.7" pathLength={1} />
      {CONTORNOS.map((p, i) => (
        <g key={p.nome} className="mv-ponto" style={{ "--d": `${i * 140}ms` } as CSSProperties} transform={`translate(${2 + i * passo} 5)`}>
          <path d={p.d} fill="none" stroke="rgb(255 255 255 / 0.6)" strokeWidth="0.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
      <circle className="mv-ponto" style={{ "--d": "1500ms" } as CSSProperties} cx={fim} cy="20" r="3" fill={C} />
      <circle className="mv-pulso" style={{ animationDelay: "1700ms" }} cx={fim} cy="20" r="3" stroke={C} strokeWidth="0.8" />
    </svg>
  );
}

/** 03 — Bandeira do Brasil (desenho oficial, sem alterações) com um leve brilho ao aparecer. */
function Bandeira({ visto }: { visto: boolean }) {
  return (
    <span className="relative block h-[49px] w-[70px] overflow-hidden rounded-[2px] transition-[opacity,filter] duration-1000 motion-reduce:transition-none" style={{ opacity: visto ? 1 : 0, filter: visto ? "drop-shadow(0 0 10px rgb(95 211 255 / 0.25))" : "none" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/site/media/bandeira-brasil.svg" alt="Bandeira do Brasil" width={70} height={49} className="block h-full w-full" />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-[1400ms] ease-out motion-reduce:hidden" style={{ transform: visto ? "translateX(200%) skewX(-20deg)" : "translateX(0) skewX(-20deg)", transitionDelay: "400ms" }} />
    </span>
  );
}

export function VisualDestaque({ tipo }: { tipo: "globo" | "paises" | "bandeira" }) {
  const [ref, visto] = useVisto<HTMLDivElement>(0.4);
  const [mover, setMover] = useState(false);
  useEffect(() => setMover(!reduzido()), []);
  return (
    <div ref={ref} className={`cartao-uso flex h-16 items-center ${visto ? "ativo" : ""}`}>
      {tipo === "globo" && <Globo mover={mover} />}
      {tipo === "paises" && <Paises />}
      {tipo === "bandeira" && <Bandeira visto={visto} />}
    </div>
  );
}
