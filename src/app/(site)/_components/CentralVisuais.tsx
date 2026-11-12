"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

/*
 * Mini-visuais dos cards da Central AIP (página Totem IA), no mesmo padrão
 * dos cards da seção Inovação da página Sobre: linha fina branca com detalhe
 * ciano. A entrada roda uma vez quando o card aparece (classes .mv-* com
 * .cartao-uso.ativo, ver site-theme.css); depois o visual fica no estado
 * final com um movimento contínuo e sutil, que pausa quando o card sai da
 * tela (.pausado). Com "reduzir movimento" o visual aparece pronto e parado.
 */

const C = "#5FD3FF";
const LINHA = "rgb(255 255 255 / 0.55)";
const SUAVE = "rgb(255 255 255 / 0.28)";
const FUNDO = "#111214";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Sinal de "✓". */
function Check({ x, y, s = 1, atraso }: { x: number; y: number; s?: number; atraso: number }) {
  return <path className="mv-linha" style={d(atraso)} d={`M${x - 3.2 * s} ${y}l${2.2 * s} ${2.4 * s}l${4.4 * s} ${-5 * s}`} stroke={C} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />;
}

/**
 * Linha tracejada que se desenha na entrada (máscara) e depois tem os traços
 * correndo devagar no sentido do caminho (fluxo de dados).
 */
function Fluxo({ id, caminho, atraso, w, h }: { id: string; caminho: string; atraso: number; w: number; h: number }) {
  return (
    <>
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
        <path className="mv-linha" style={d(atraso)} d={caminho} stroke="#fff" strokeWidth="3" pathLength={1} />
      </mask>
      <path className="mv-fluxo" d={caminho} mask={`url(#${id})`} stroke={C} strokeOpacity="0.75" strokeWidth="0.85" strokeDasharray="2 2.5" />
    </>
  );
}

/** 01 — Relógio: na entrada o ponteiro dá uma volta e o anel ciano se fecha; depois o ponteiro segue girando devagar e o centro pulsa. */
function Relogio() {
  const c = 40;
  const origem = { "--o": `${c}px ${c}px` } as CSSProperties;
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20" fill="none" aria-hidden>
      <circle className="mv-linha" style={d(0)} cx={c} cy={c} r="24" stroke={LINHA} strokeWidth="0.9" pathLength={1} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r1 = i % 3 === 0 ? 18.5 : 20.5;
        return <line key={i} className="mv-ponto" style={d(150 + i * 25)} x1={c + Math.sin(a) * r1} y1={c - Math.cos(a) * r1} x2={c + Math.sin(a) * 22} y2={c - Math.cos(a) * 22} stroke={SUAVE} strokeWidth="0.8" strokeLinecap="round" />;
      })}
      <circle className="mv-linha" style={d(350)} cx={c} cy={c} r="31" stroke={C} strokeWidth="1.1" strokeLinecap="round" pathLength={1} transform={`rotate(-90 ${c} ${c})`} />
      {/* ponteiro: uma volta na entrada (mv-gira) e depois giro lento contínuo */}
      <g className="mv-gira" style={{ ...d(300), ...origem }}>
        <g className="mv-gira-lento" style={{ ...origem, "--d": "2400ms" } as CSSProperties}>
          <line x1={c} y1={c} x2={c} y2={c - 17} stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
        </g>
      </g>
      <circle className="mv-pulso" style={{ animationDelay: "2200ms" }} cx={c} cy={c} r="2.2" stroke={C} strokeWidth="0.8" />
      <circle className="mv-ponto" style={d(1900)} cx={c} cy={c} r="2.2" fill={C} />
    </svg>
  );
}

/** Escudo genérico (sem brasão nem símbolo de órgão). */
const ESCUDO = "M0 -7.5l6 2.3v4.6c0 4-2.6 6.8-6 8.1c-3.4-1.3-6-4.1-6-8.1v-4.6z";

/** Sinal de notificação: aparece quando a linha chega e depois pisca suave. */
function Notificacao({ x, y, atraso, fase }: { x: number; y: number; atraso: number; fase: number }) {
  return (
    <g className="mv-ponto" style={d(atraso)}>
      <g className="mv-notifica" style={d(fase)}>
        <circle cx={x} cy={y} r="3.4" fill={FUNDO} stroke={C} strokeWidth="0.8" />
        <circle cx={x} cy={y} r="1.5" fill={C} />
      </g>
    </g>
  );
}

/**
 * 02 — Agentes próprios: central (operador diante do monitor; a detecção
 * vermelha recebe o ✓) e notificação (linhas em leque até as autoridades e o
 * responsável pelo local, que recebem um sinal).
 */
function Agentes() {
  const id = useId().replace(/:/g, "");
  const W = 214;
  const saida = { x: 66, y: 28 };
  const autoridade = { x: 172, y: 20 };
  const responsavel = { x: 172, y: 58 };
  const linhaA = `M${saida.x} ${saida.y}C104 ${saida.y} 128 ${autoridade.y} ${autoridade.x - 13} ${autoridade.y}`;
  const linhaR = `M${saida.x} ${saida.y}C104 ${saida.y} 124 ${responsavel.y} ${responsavel.x - 16} ${responsavel.y}`;
  return (
    <svg viewBox={`0 0 ${W} 80`} className="h-20 w-auto max-w-full" fill="none" aria-hidden>
      {/* Etapa 1: central */}
      <g transform="translate(-16 0)">
        <rect className="mv-linha" style={d(0)} x="22" y="6" width="76" height="44" rx="2.5" stroke={LINHA} strokeWidth="0.9" pathLength={1} />
        <path className="mv-ponto" style={d(250)} d="M60 50v5M50 55h20" stroke={SUAVE} strokeWidth="0.9" strokeLinecap="round" />
        <path className="mv-ponto" style={d(300)} d="M28 40h64" stroke={SUAVE} strokeWidth="0.6" />
        <g className="mv-ponto" style={d(350)} stroke={LINHA} strokeWidth="0.8" strokeLinecap="round">
          <circle cx="47" cy="22" r="2.2" />
          <path d="M47 24.5v8M47 32.5l-2.5 6M47 32.5l2.5 6M44 27.5l3-1.5 3 1.5" />
        </g>
        <rect className="mv-alerta-caixa" x="41" y="16.5" width="12" height="24" rx="1" strokeWidth="1" />
        <circle className="mv-ponto" style={d(1500)} cx="84" cy="15" r="6" fill={FUNDO} stroke={C} strokeWidth="0.9" />
        <Check x={84} y={15.4} s={0.85} atraso={1600} />
        <g className="mv-ponto" style={d(100)}>
          <path d="M38 80c0-12 9-19 22-19s22 7 22 19" fill={FUNDO} stroke={LINHA} strokeWidth="0.9" />
          <circle cx="60" cy="54" r="8" fill={FUNDO} stroke={LINHA} strokeWidth="0.9" />
          <path d="M51.2 54a8.8 8.8 0 0 1 17.6 0" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
          <rect x="49.4" y="52.5" width="3" height="5" rx="1.2" fill={FUNDO} stroke="#fff" strokeWidth="0.9" />
          <rect x="67.6" y="52.5" width="3" height="5" rx="1.2" fill={FUNDO} stroke="#fff" strokeWidth="0.9" />
          <path d="M51 57.5c0 4 3 5.5 6 5.5" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      </g>

      {/* Etapa 2: notificação, em leque */}
      <Fluxo id={`${id}-a`} caminho={linhaA} atraso={1900} w={W} h={80} />
      <Fluxo id={`${id}-r`} caminho={linhaR} atraso={2100} w={W} h={80} />

      {/* Autoridades: escudo genérico */}
      <g className="mv-ponto" style={d(1800)}>
        <path d={ESCUDO} transform={`translate(${autoridade.x} ${autoridade.y}) scale(1.25)`} stroke={LINHA} strokeWidth="0.75" strokeLinejoin="round" />
      </g>
      <Notificacao x={autoridade.x + 9} y={autoridade.y - 9} atraso={3000} fase={3600} />

      {/* Responsável pelo local: pessoa + pequeno prédio */}
      <g className="mv-ponto" style={d(1800)} stroke={LINHA} strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
        <circle cx={responsavel.x - 6} cy={responsavel.y - 5} r="3" />
        <path d={`M${responsavel.x - 12} ${responsavel.y + 9}c0-5 2.7-8 6-8s6 3 6 8`} />
        <rect x={responsavel.x + 3} y={responsavel.y - 9} width="11" height="18" rx="0.8" />
        <path d={`M${responsavel.x + 6} ${responsavel.y - 5}h1.5M${responsavel.x + 9.5} ${responsavel.y - 5}h1.5M${responsavel.x + 6} ${responsavel.y - 1}h1.5M${responsavel.x + 9.5} ${responsavel.y - 1}h1.5M${responsavel.x + 6} ${responsavel.y + 3}h1.5M${responsavel.x + 9.5} ${responsavel.y + 3}h1.5`} strokeWidth="0.8" />
      </g>
      <Notificacao x={responsavel.x + 16} y={responsavel.y - 10} atraso={3200} fase={4800} />
    </svg>
  );
}

/** 03 — Totem à esquerda; linhas tracejadas chegam a 4 escudos, que acendem e depois pulsam em sequência. */
function Integracao() {
  const id = useId().replace(/:/g, "");
  const escudos = [
    { x: 74, y: 16 },
    { x: 104, y: 16 },
    { x: 74, y: 52 },
    { x: 104, y: 52 },
  ];
  const origem = { x: 26, y: 18 };
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-auto" fill="none" aria-hidden>
      <g className="mv-ponto" style={d(0)} stroke={LINHA} strokeWidth="0.9" strokeLinejoin="round">
        <rect x="21" y="18" width="10" height="50" rx="1.5" />
        <path d="M23 18v-5h6v5" />
        <path d="M18.5 15h3M30.5 15h3" strokeLinecap="round" />
        <path d="M17 72h18l-2-4H19z" />
      </g>
      <rect className="mv-ponto" style={d(100)} x="24.5" y="9" width="3" height="3" rx="1" fill={C} />
      <path className="mv-ponto" style={d(150)} d="M23.5 30v22" stroke={C} strokeOpacity="0.7" strokeWidth="0.8" />
      {escudos.map((e, i) => {
        const caminho = `M${origem.x + 7} ${origem.y + 6}C${50} ${origem.y + 6} ${48} ${e.y} ${e.x - 9} ${e.y}`;
        const atraso = 300 + i * 420;
        return (
          <g key={i}>
            <Fluxo id={`${id}-m${i}`} caminho={caminho} atraso={atraso} w={120} h={80} />
            <g transform={`translate(${e.x} ${e.y})`}>
              <path className="mv-halo" style={d(2800 + i * 600)} d={ESCUDO} stroke={C} strokeWidth="0.8" strokeLinejoin="round" />
              <path className="mv-acende" style={d(atraso + 700)} d={ESCUDO} strokeWidth="0.9" strokeLinejoin="round" />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export type TipoCentral = "relogio" | "agentes" | "integracao";

/**
 * Liga o .ativo na primeira vez que o card aparece (a entrada roda uma vez) e
 * marca .pausado sempre que ele sai da tela (o movimento contínuo para).
 */
export default function VisualCentral({ tipo }: { tipo: TipoCentral }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(false);
  const [naTela, setNaTela] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        setNaTela(e.isIntersecting);
        if (e.isIntersecting) setAtivo(true);
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`cartao-uso flex h-20 items-center ${ativo ? "ativo" : ""} ${naTela ? "" : "pausado"}`}>
      {tipo === "relogio" && <Relogio />}
      {tipo === "agentes" && <Agentes />}
      {tipo === "integracao" && <Integracao />}
    </div>
  );
}
