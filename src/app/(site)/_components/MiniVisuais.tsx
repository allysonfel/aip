import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

// Mini-visuais dos cards "Como a tecnologia é usada". Desenho em linha fina
// (branco ~70%) com um detalhe em ciano. A animação (uma vez, quando o card
// entra na tela) é só CSS: ver .mv-* em site-theme.css. O card pai recebe a
// classe "ativo" e cada elemento usa --d para o atraso.

export type VisualId = "V1" | "V2" | "V3" | "V4" | "V5" | "V6" | "V7" | "V8" | "V9" | "V10" | "V11" | "V12" | "V13" | "V14" | "V15" | "V16" | "V17" | "V18" | "V19" | "V20" | "V21" | "V22" | "V23" | "V24";

const L = "rgb(255 255 255 / 0.7)"; // linha
const F = "rgb(255 255 255 / 0.18)"; // linha de fundo
const C = "#5FD3FF"; // destaque
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 240 120" aria-hidden className="h-full w-full overflow-visible" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

/** V1 · Barras por hora */
function Barras() {
  const alturas = [28, 40, 34, 52, 64, 58, 86, 70, 46, 38];
  return (
    <Svg>
      <line x1="10" y1="108" x2="230" y2="108" stroke={F} strokeWidth="1" />
      {alturas.map((h, i) => (
        <rect key={i} className="mv-barra" style={d(i * 70)} x={16 + i * 21.5} y={108 - h} width="12" height={h} rx="2" fill={i === 6 ? C : "none"} stroke={i === 6 ? C : L} strokeWidth="1" />
      ))}
    </Svg>
  );
}

/** V2 · Mapa de calor com rota */
function MapaCalor() {
  const id = useId();
  return (
    <Svg>
      <defs>
        <radialGradient id={`${id}-g`}>
          <stop offset="0%" stopColor={C} stopOpacity="0.55" />
          <stop offset="60%" stopColor={C} stopOpacity="0.15" />
          <stop offset="100%" stopColor={C} stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-m`}>
          <path className="mv-linha" style={d(300)} d="M24 96 C70 96 70 40 118 40 S170 82 214 30" stroke="#fff" strokeWidth="4" pathLength={1} />
        </mask>
      </defs>
      <rect x="10" y="10" width="220" height="100" rx="6" stroke={L} strokeWidth="1" />
      <path d="M90 10 V48 M150 72 V110 M10 64 H62" stroke={F} strokeWidth="1" />
      <ellipse className="mv-ponto" style={d(100)} cx="122" cy="52" rx="58" ry="36" fill={`url(#${id}-g)`} />
      <path mask={`url(#${id}-m)`} d="M24 96 C70 96 70 40 118 40 S170 82 214 30" stroke={C} strokeWidth="1.5" strokeDasharray="4 5" />
      <circle className="mv-ponto" style={d(1300)} cx="214" cy="30" r="3" fill={C} />
    </Svg>
  );
}

/** V3 · Zonas pouco usadas */
function Zonas() {
  const zonas = [0, 1, 2, 3, 4, 5];
  return (
    <Svg>
      {zonas.map((z) => {
        const x = 12 + (z % 3) * 74;
        const y = 12 + Math.floor(z / 3) * 50;
        const fraca = z === 5;
        return (
          <rect
            key={z}
            className="mv-ponto"
            style={d(z * 110)}
            x={x}
            y={y}
            width="68"
            height="44"
            rx="4"
            stroke={fraca ? "rgb(255 255 255 / 0.35)" : L}
            strokeDasharray={fraca ? "3 4" : undefined}
            strokeWidth="1"
            fill={fraca ? "none" : z === 1 ? "rgb(95 211 255 / 0.22)" : "rgb(255 255 255 / 0.05)"}
          />
        );
      })}
      <circle className="mv-ponto" style={d(800)} cx="194" cy="84" r="2.5" fill={C} />
    </Svg>
  );
}

/** V4 · Comparativo (linha cheia e tracejada) */
function Comparativo() {
  const id = useId();
  const tracejada = "M12 92 L50 80 L88 84 L126 66 L164 72 L202 58 L228 62";
  return (
    <Svg>
      <defs>
        <mask id={`${id}-m`}>
          <path className="mv-linha" style={d(250)} d={tracejada} stroke="#fff" strokeWidth="4" pathLength={1} />
        </mask>
      </defs>
      <path d="M12 108 H228 M12 74 H228 M12 40 H228" stroke={F} strokeWidth="1" />
      <path mask={`url(#${id}-m)`} d={tracejada} stroke={L} strokeWidth="1.25" strokeDasharray="4 4" />
      <path className="mv-linha" d="M12 96 L50 70 L88 76 L126 44 L164 52 L202 22 L228 30" stroke={C} strokeWidth="1.5" pathLength={1} />
      <circle className="mv-ponto" style={d(1100)} cx="202" cy="22" r="3" fill={C} />
    </Svg>
  );
}

/** V5 · Busca visual */
function Busca() {
  return (
    <Svg>
      <rect x="10" y="12" width="132" height="22" rx="11" stroke={L} strokeWidth="1" />
      <circle cx="26" cy="23" r="5" stroke={L} strokeWidth="1" />
      <path d="M30 27 L33 30" stroke={L} strokeWidth="1" />
      <path className="mv-linha" style={d(200)} d="M42 23 H104" stroke="rgb(255 255 255 / 0.45)" strokeWidth="2" pathLength={1} />
      <path className="mv-cursor" d="M110 17 V29" stroke={C} strokeWidth="1.5" />
      <g className="mv-ponto" style={d(500)}>
        <circle cx="190" cy="34" r="9" stroke={L} strokeWidth="1" />
        <path d="M174 110 V70 Q174 52 190 50 Q206 52 206 70 V110" stroke={L} strokeWidth="1" />
        <path d="M182 110 V84 M198 110 V84" stroke={F} strokeWidth="1" />
      </g>
      <g className="mv-ponto" style={d(900)}>
        <rect x="171" y="56" width="38" height="24" rx="3" stroke={C} strokeWidth="1.25" />
        <path d="M171 68 H150" stroke={C} strokeWidth="1" strokeDasharray="2 3" />
      </g>
      <g className="mv-ponto" style={d(1150)}>
        <rect x="175" y="86" width="30" height="22" rx="3" stroke={C} strokeWidth="1.25" />
        <path d="M175 97 H150" stroke={C} strokeWidth="1" strokeDasharray="2 3" />
      </g>
    </Svg>
  );
}

/** V6 · Circulação em 3 áreas */
function Circulacao() {
  const areas = [12, 86, 160];
  const pontos = [
    { a: 0, x: 40, y: 40, dx: -14, dy: 18 },
    { a: 0, x: 26, y: 86, dx: 16, dy: -8 },
    { a: 1, x: 112, y: 64, dx: -12, dy: -16 },
    { a: 1, x: 130, y: 96, dx: 10, dy: -14 },
    { a: 1, x: 100, y: 30, dx: 14, dy: 10 },
    { a: 2, x: 196, y: 50, dx: -16, dy: 12 },
    { a: 2, x: 210, y: 92, dx: -10, dy: -16 },
  ];
  return (
    <Svg>
      {areas.map((x) => (
        <rect key={x} x={x} y="12" width="68" height="96" rx="5" stroke={L} strokeWidth="1" />
      ))}
      {pontos.map((p, i) => (
        <g key={i}>
          <path className="mv-linha" style={d(150 + i * 90)} d={`M${p.x - p.dx} ${p.y - p.dy} L${p.x} ${p.y}`} stroke={i === 3 ? C : "rgb(255 255 255 / 0.4)"} strokeWidth="1" strokeDasharray="2 3" pathLength={1} />
          <circle className="mv-move" style={{ ...d(150 + i * 90), "--dx": `${-p.dx}px`, "--dy": `${-p.dy}px` } as CSSProperties} cx={p.x} cy={p.y} r="3" fill={i === 3 ? C : "#fff"} />
        </g>
      ))}
    </Svg>
  );
}

/** V7 · Área restrita */
function AreaRestrita() {
  return (
    <Svg>
      <rect className="mv-ponto" x="12" y="14" width="150" height="92" rx="6" stroke={L} strokeWidth="1" strokeDasharray="5 5" />
      <path d="M12 60 H162" stroke={F} strokeWidth="1" />
      <circle cx="200" cy="38" r="20" stroke={L} strokeWidth="1" />
      <path className="mv-ponteiro" d="M200 38 V24" stroke={L} strokeWidth="1.25" />
      <path d="M200 38 L210 44" stroke={L} strokeWidth="1.25" />
      <circle className="mv-ponto" style={d(700)} cx="106" cy="44" r="4" fill={C} />
      <circle className="mv-pulso" style={d(700)} cx="106" cy="44" r="4" stroke={C} strokeWidth="1.25" />
      <path className="mv-ponto" style={d(900)} d="M190 92 L200 76 L210 92 Z" stroke={C} strokeWidth="1.25" />
      <path className="mv-ponto" style={d(900)} d="M200 82 V86" stroke={C} strokeWidth="1.25" />
    </Svg>
  );
}

/** V8 · Leitura de placa */
function Placa() {
  return (
    <Svg>
      <rect x="40" y="26" width="160" height="62" rx="6" stroke={L} strokeWidth="1" />
      <rect x="46" y="32" width="148" height="10" rx="2" stroke={F} strokeWidth="1" />
      <text x="120" y="76" textAnchor="middle" fill="rgb(255 255 255 / 0.8)" fontFamily="var(--font-barlow-condensed), sans-serif" fontSize="26" fontWeight="600" letterSpacing="3">
        ABC1D23
      </text>
      <g className="mv-scan">
        <path d="M40 20 V94" stroke={C} strokeWidth="1.5" />
        <rect x="40" y="20" width="14" height="74" fill={C} opacity="0.12" />
      </g>
      <path d="M28 18 V30 M28 18 H40 M212 18 V30 M212 18 H200 M28 102 V90 M28 102 H40 M212 102 V90 M212 102 H200" stroke={C} strokeWidth="1.25" />
    </Svg>
  );
}

/** V9 · Medidor */
function Medidor({ pct = 64 }: { pct?: number }) {
  const arco = "M30 100 A90 90 0 0 1 210 100";
  return (
    <Svg>
      <path d={arco} stroke={F} strokeWidth="6" transform="translate(0 6) scale(1 0.95)" />
      <path className="mv-arco" style={{ "--p": `${1 - pct / 100}` } as CSSProperties} d={arco} stroke={C} strokeWidth="6" pathLength={1} strokeDasharray="1" transform="translate(0 6) scale(1 0.95)" />
      <path d="M120 106 V96 M30 106 H44 M196 106 H210" stroke={L} strokeWidth="1" />
    </Svg>
  );
}

/** V10 · Áreas comuns (piscina, academia, salão, playground) */
function AreasComuns() {
  const itens = [
    { x: 14, ocup: 0.72, icone: <path d="M10 22 q5 -4 10 0 t10 0 t10 0 M10 30 q5 -4 10 0 t10 0 t10 0 M18 18 V8 h8" /> },
    { x: 72, ocup: 0.45, icone: <path d="M12 20 H38 M8 15 V25 M42 15 V25 M14 12 V28 M36 12 V28" /> },
    { x: 130, ocup: 0.3, icone: <path d="M10 30 H40 M14 30 V16 H36 V30 M18 16 L25 8 L32 16" /> },
    { x: 188, ocup: 0.58, icone: <path d="M12 30 L22 10 L32 30 M16 22 H28 M36 30 V12 M36 16 Q42 18 40 26" /> },
  ];
  return (
    <Svg>
      {itens.map((it, i) => (
        <g key={i} transform={`translate(${it.x} 14)`}>
          <rect width="50" height="50" rx="8" stroke={L} strokeWidth="1" />
          <g stroke={i === 0 ? C : L} strokeWidth="1.25">{it.icone}</g>
          <rect y="66" width="50" height="5" rx="2.5" fill={F} />
          <rect className="mv-largura" style={d(200 + i * 120)} y="66" width={50 * it.ocup} height="5" rx="2.5" fill={i === 0 ? C : "rgb(255 255 255 / 0.7)"} />
        </g>
      ))}
    </Svg>
  );
}

/** V11 · Linha do tempo de vídeo */
function LinhaVideo() {
  return (
    <Svg>
      <rect x="12" y="18" width="216" height="56" rx="6" stroke={L} strokeWidth="1" />
      <path d="M112 36 L132 46 L112 56 Z" stroke={L} strokeWidth="1" />
      <rect x="12" y="92" width="216" height="6" rx="3" fill={F} />
      <rect className="mv-largura" style={d(300)} x="96" y="92" width="58" height="6" rx="3" fill={C} />
      {[52, 110, 186].map((x, i) => (
        <path key={x} className="mv-ponto" style={d(500 + i * 150)} d={`M${x} 86 L${x - 4} 80 H${x + 4} Z`} fill={i === 1 ? C : "rgb(255 255 255 / 0.7)"} />
      ))}
      <path className="mv-play" d="M96 86 V104" stroke="#fff" strokeWidth="1.5" />
    </Svg>
  );
}

/** V12 · Acesso por perfil */
function Perfis() {
  const camadas = ["Síndico", "Administração", "Portaria"];
  return (
    <Svg>
      {camadas.map((nome, i) => (
        <g key={nome} className="mv-ponto" style={d(i * 180)} transform={`translate(${18 + i * 18} ${12 + i * 32})`}>
          <rect width="168" height="28" rx="5" stroke={i === 0 ? C : L} strokeWidth="1" fill="rgb(0 0 0 / 0.6)" />
          <text x="12" y="18" fill="rgb(255 255 255 / 0.75)" fontFamily="var(--font-barlow), sans-serif" fontSize="11">
            {nome}
          </text>
          <rect x="144" y="12" width="12" height="9" rx="2" stroke={i === 0 ? C : L} strokeWidth="1" />
          <path d="M146.5 12 V9.5 a3.5 3.5 0 0 1 7 0 V12" stroke={i === 0 ? C : L} strokeWidth="1" />
        </g>
      ))}
    </Svg>
  );
}

/** V13 · Mesas vistas de cima */
function Mesas() {
  const ocupadas = [0, 2, 3, 5, 6];
  return (
    <Svg>
      <rect x="10" y="8" width="220" height="104" rx="6" stroke={F} strokeWidth="1" />
      {Array.from({ length: 8 }, (_, i) => {
        const cx = 40 + (i % 4) * 54;
        const cy = 36 + Math.floor(i / 4) * 48;
        const ocupada = ocupadas.includes(i);
        return (
          <g key={i} className="mv-ponto" style={d(i * 90)}>
            <circle cx={cx} cy={cy} r="12" stroke={ocupada ? C : L} strokeWidth="1" fill={ocupada ? "rgb(95 211 255 / 0.25)" : "none"} />
            {[0, 90, 180, 270].map((a) => (
              <circle key={a} cx={cx + Math.cos((a * Math.PI) / 180) * 19} cy={cy + Math.sin((a * Math.PI) / 180) * 19} r="3" stroke={ocupada ? C : F} strokeWidth="1" />
            ))}
          </g>
        );
      })}
    </Svg>
  );
}

/** V14 · Prédios públicos */
function Predios() {
  const itens = [
    { x: 14, icone: <path d="M4 40 V18 L22 6 L40 18 V40 M14 40 V28 H30 V40 M4 18 H40" />, ok: true },
    { x: 92, icone: <path d="M4 40 V8 H40 V40 M22 14 V30 M14 22 H30" />, ok: true },
    { x: 170, icone: <path d="M2 40 H42 M6 40 V20 M16 40 V20 M28 40 V20 M38 40 V20 M2 20 L22 6 L42 20 Z" />, ok: false },
  ];
  return (
    <Svg>
      {itens.map((it, i) => (
        <g key={i} className="mv-ponto" style={d(i * 200)} transform={`translate(${it.x} 30)`}>
          <rect x="-6" y="-14" width="68" height="76" rx="8" stroke={F} strokeWidth="1" />
          <g transform="translate(6 2)" stroke={L} strokeWidth="1.25">
            {it.icone}
          </g>
          <circle cx="50" cy="-4" r="4" fill={it.ok ? C : "none"} stroke={C} strokeWidth="1.25" />
        </g>
      ))}
    </Svg>
  );
}


/** V15 · Identificação facial (malha abstrata, sem rosto realista) */
function Facial() {
  // Pontos de uma malha oval simples; linhas ligam vizinhos.
  const p: [number, number][] = [
    [80, 14], [62, 22], [98, 22], [52, 40], [108, 40], [66, 42], [94, 42], [80, 52],
    [50, 62], [110, 62], [70, 66], [90, 66], [80, 78], [58, 84], [102, 84], [80, 98], [68, 92], [92, 92],
  ];
  const l: [number, number][] = [
    [0, 1], [0, 2], [1, 3], [2, 4], [1, 5], [2, 6], [5, 7], [6, 7], [3, 8], [4, 9], [5, 10], [6, 11], [7, 10], [7, 11],
    [8, 13], [9, 14], [10, 12], [11, 12], [13, 16], [14, 17], [16, 15], [17, 15], [12, 16], [12, 17], [3, 5], [4, 6], [8, 10], [9, 11],
  ];
  return (
    <Svg>
      <g stroke="rgb(255 255 255 / 0.45)" strokeWidth="0.9">
        {l.map(([a, b], i) => (
          <line key={i} className="mv-ponto" style={d(i * 25)} x1={p[a][0]} y1={p[a][1]} x2={p[b][0]} y2={p[b][1]} />
        ))}
      </g>
      {p.map(([x, y], i) => (
        <circle key={i} className="mv-ponto" style={d(i * 30)} cx={x} cy={y} r={i === 5 || i === 6 ? 2.6 : 1.8} fill={i === 5 || i === 6 ? C : "#fff"} />
      ))}
      <path d="M36 8 H46 M36 8 V18 M124 8 H114 M124 8 V18 M36 108 H46 M36 108 V98 M124 108 H114 M124 108 V98" stroke={C} strokeWidth="1.25" />
      <path className="mv-varre" d="M38 12 H122" stroke={C} strokeWidth="1.5" />
      <g className="mv-ponto" style={d(1100)}>
        <path d="M134 58 H150" stroke={C} strokeWidth="1" strokeDasharray="2 3" />
        <rect x="152" y="40" width="80" height="36" rx="5" stroke={L} strokeWidth="1" />
        <ellipse cx="166" cy="52" rx="6" ry="2.5" stroke={C} strokeWidth="1" />
        <path d="M160 52 V63 Q166 66 172 63 V52 M160 57.5 Q166 60.5 172 57.5" stroke={C} strokeWidth="1" />
        <text x="180" y="55" fill="rgb(255 255 255 / 0.8)" fontFamily="var(--font-barlow), sans-serif" fontSize="9">Base</text>
        <text x="180" y="66" fill="rgb(255 255 255 / 0.8)" fontFamily="var(--font-barlow), sans-serif" fontSize="9">integrada</text>
      </g>
    </Svg>
  );
}

/** Número que sobe até `alvo` quando `ligado` (usado no V16). */
function Contagem({ alvo, ligado }: { alvo: number; ligado: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!ligado) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(alvo);
      return;
    }
    let q = 0;
    const t0 = performance.now();
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / 1400);
      setV(Math.round(alvo * (1 - Math.pow(1 - k, 3))));
      if (k < 1) q = requestAnimationFrame(passo);
    };
    q = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(q);
  }, [alvo, ligado]);
  return <>{v.toLocaleString("pt-BR")}</>;
}

/** V16 · Densidade de público numa praça */
function Densidade({ alvo = 0, ativo = false }: { alvo?: number; ativo?: boolean }) {
  // Grade 5 x 3 sobre a praça; quanto mais pessoas na célula, mais ciano.
  const dens = [
    [0.1, 0.25, 0.4, 0.2, 0.05],
    [0.2, 0.55, 0.9, 0.5, 0.15],
    [0.05, 0.3, 0.45, 0.25, 0.1],
  ];
  const pontos: [number, number][] = [];
  dens.forEach((linha, r) =>
    linha.forEach((v, c) => {
      const n = Math.round(v * 7);
      for (let k = 0; k < n; k++) pontos.push([23 + c * 30 + ((k * 13 + r * 7) % 24), 18 + r * 30 + ((k * 11 + c * 5) % 22)]);
    }),
  );
  return (
    <Svg>
      <rect x="14" y="10" width="162" height="100" rx="14" stroke={L} strokeWidth="1" />
      <circle cx="95" cy="60" r="12" stroke={F} strokeWidth="1" />
      <path d="M14 60 H83 M107 60 H176 M95 10 V48 M95 72 V110" stroke={F} strokeWidth="1" />
      {dens.map((linha, r) =>
        linha.map((v, c) => (
          <rect key={`${r}-${c}`} className="mv-ponto" style={d(900 + (r * 5 + c) * 30)} x={20 + c * 30} y={14 + r * 30} width="28" height="28" rx="2" fill={C} fillOpacity={v * 0.45} stroke="rgb(255 255 255 / 0.08)" strokeWidth="0.75" />
        )),
      )}
      {pontos.map(([x, y], i) => (
        <circle key={i} className="mv-ponto" style={d((i * 37) % 900)} cx={x} cy={y} r="1.6" fill="#fff" />
      ))}
      <text x="230" y="64" textAnchor="end" fill="#fff" fontFamily="var(--font-barlow-condensed), sans-serif" fontSize="20" fontWeight="600">
        <Contagem alvo={alvo} ligado={ativo} />
      </text>
      <text x="230" y="78" textAnchor="end" fill="rgb(255 255 255 / 0.5)" fontFamily="var(--font-barlow), sans-serif" fontSize="8" letterSpacing="1">
        PESSOAS
      </text>
    </Svg>
  );
}

/** V17 · Aglomeração (pontos se aproximando; anel muda de ciano para vermelho) */
function Aglomeracao() {
  const cx = 120;
  const cy = 60;
  const pontos = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const r = 10 + (i % 3) * 6;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.8;
    return { x, y, dx: Math.cos(a) * 70, dy: Math.sin(a) * 40 };
  });
  return (
    <Svg>
      <path d="M20 108 H220" stroke={F} strokeWidth="1" />
      {pontos.map((p, i) => (
        <circle key={i} className="mv-move" style={{ ...d(i * 50), "--dx": `${p.dx}px`, "--dy": `${p.dy}px` } as CSSProperties} cx={p.x} cy={p.y} r="2.4" fill="#fff" />
      ))}
      <circle className="mv-anel" cx={cx} cy={cy} r="34" strokeWidth="1.5" />
      <circle className="mv-anel mv-anel-pulso" cx={cx} cy={cy} r="34" strokeWidth="1.25" />
    </Svg>
  );
}

/** V18 · Perímetro (cerca virtual e um ponto cruzando) */
function Perimetro() {
  const id = useId();
  return (
    <Svg>
      <defs>
        <mask id={`${id}-m`}>
          <path className="mv-linha" d="M60 112 L150 8" stroke="#fff" strokeWidth="4" pathLength={1} />
        </mask>
      </defs>
      <path mask={`url(#${id}-m)`} d="M60 112 L150 8" stroke={C} strokeWidth="1.5" strokeDasharray="5 5" />
      {[0.15, 0.35, 0.55, 0.75, 0.95].map((t) => (
        <circle key={t} cx={60 + 90 * t} cy={112 - 104 * t} r="1.8" fill={C} />
      ))}
      <path className="mv-linha" style={d(500)} d="M40 40 C70 44 100 52 128 70" stroke="rgb(255 255 255 / 0.4)" strokeWidth="1" strokeDasharray="2 3" pathLength={1} />
      <circle className="mv-move" style={{ ...d(500), "--dx": "-88px", "--dy": "-30px" } as CSSProperties} cx="128" cy="70" r="4" fill="#fff" />
      <g className="mv-ponto" style={d(1350)}>
        <path d="M176 64 L196 30 L216 64 Z" stroke={C} strokeWidth="1.25" />
        <path d="M196 42 V52 M196 57 V58" stroke={C} strokeWidth="1.5" />
      </g>
      <circle className="mv-pulso" style={d(1350)} cx="128" cy="70" r="4" stroke={C} strokeWidth="1.25" />
    </Svg>
  );
}

/** V19 · Permanência suspeita (anel de tempo em volta de um ponto parado) */
function Permanencia() {
  return (
    <Svg>
      <rect x="46" y="10" width="148" height="100" rx="6" stroke={L} strokeWidth="1" strokeDasharray="5 5" />
      <circle cx="120" cy="60" r="26" stroke={F} strokeWidth="3" />
      <circle className="mv-arco" style={{ "--p": "0.08" } as CSSProperties} cx="120" cy="60" r="26" stroke={C} strokeWidth="3" pathLength={1} strokeDasharray="1" transform="rotate(-90 120 60)" />
      <circle cx="120" cy="60" r="4.5" fill="#fff" />
      <path d="M120 34 V40 M146 60 H140 M120 86 V80 M94 60 H100" stroke="rgb(255 255 255 / 0.35)" strokeWidth="1" />
    </Svg>
  );
}

/** V20 · Circulação operacional: galpão com 3 setores e pessoas indo de um a outro pelos corredores */
function CirculacaoOperacional({ ativo = false }: { ativo?: boolean }) {
  const grupo = useRef<SVGGElement>(null);
  // Uma rota entre cada par de setores, pelo corredor central.
  const rotas = ["M52 84 V60 H112 V30", "M150 30 V60 H168 V90", "M122 90 V60 H40 V34"];
  useEffect(() => {
    if (!ativo || !grupo.current) return;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    grupo.current.querySelectorAll("animateMotion").forEach((a, i) => {
      // Sem movimento: a animação dura ~0 e congela no fim da rota.
      if (reduzido) a.setAttribute("dur", "0.001s");
      (a as SVGAnimationElement).beginElementAt(reduzido ? 0 : i * 0.25);
    });
  }, [ativo]);
  return (
    <Svg>
      <rect x="10" y="10" width="220" height="100" rx="6" stroke={L} strokeWidth="1" />
      {/* Doca (esquerda), Estoque (cima), Linha de produção (baixo) */}
      <rect x="16" y="16" width="56" height="88" rx="3" stroke={F} strokeWidth="1" />
      <rect x="84" y="16" width="140" height="30" rx="3" stroke={F} strokeWidth="1" />
      <path d="M92 23 H136 M92 30 H136 M92 37 H136" stroke={F} strokeWidth="1" />
      <rect x="84" y="76" width="140" height="28" rx="3" stroke={F} strokeWidth="1" />
      <path d="M92 97 H150" stroke={F} strokeWidth="1" strokeDasharray="5 4" />
      <path d="M16 60 H224" stroke="rgb(255 255 255 / 0.1)" strokeWidth="10" />
      <g ref={grupo}>
        {rotas.map((r, i) => (
          <g key={i}>
            <path className="mv-linha" style={d(i * 250)} d={r} stroke={i === 0 ? C : "rgb(255 255 255 / 0.3)"} strokeWidth="1" pathLength={1} />
            <circle className="mv-ponto" style={d(i * 250)} r="3.4" fill={i === 0 ? C : "#fff"} cx="0" cy="0">
              <animateMotion path={r} dur="1.3s" begin="indefinite" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.22 1 0.36 1" />
            </circle>
          </g>
        ))}
      </g>
      <g fontFamily="var(--font-barlow), sans-serif" fontSize="8.5" fill="rgb(255 255 255 / 0.6)">
        <text className="mv-ponto" style={d(1000)} x="20" y="100">Doca 12</text>
        <text className="mv-ponto" style={d(1100)} x="218" y="40" textAnchor="end">Estoque 34</text>
        <text className="mv-ponto" style={d(1200)} x="218" y="98" textAnchor="end">Linha 40</text>
      </g>
    </Svg>
  );
}

/** V21 · Controle de EPI: colete detectado (ciano), capacete ausente (vermelho, com alerta) */
function Epi() {
  const V = "#ff5a5f";
  const fonte = { fontFamily: "var(--font-barlow), sans-serif", fontSize: 9 };
  return (
    <Svg>
      {/* Silhueta de corpo inteiro */}
      <g stroke={L} strokeWidth="1.1">
        <circle cx="96" cy="24" r="8" />
        <path d="M84 40 Q96 34 108 40 L112 70 H80 Z" />
        <path d="M84 42 L74 66 M108 42 L118 66" />
        <path d="M86 70 L84 108 M106 70 L108 108 M96 72 V96" />
      </g>
      {/* 1) Colete detectado */}
      <rect className="mv-ponto" style={d(250)} x="72" y="34" width="48" height="40" rx="3" stroke={C} strokeWidth="1.25" />
      <g className="mv-ponto" style={d(450)}>
        <path d="M120 54 H134" stroke={C} strokeWidth="1" strokeDasharray="2 3" />
        <text x="138" y="57" fill={C} {...fonte}>✓ colete</text>
      </g>
      {/* 2) Capacete ausente: a caixa entra em ciano e fica vermelha */}
      <rect className="mv-alerta-caixa" x="83" y="11" width="26" height="26" rx="3" strokeWidth="1.25" />
      <g className="mv-ponto" style={d(1300)}>
        <path d="M109 24 H134" stroke={V} strokeWidth="1" strokeDasharray="2 3" />
        <text x="138" y="27" fill={V} {...fonte}>✕ capacete</text>
      </g>
      <circle className="mv-ponto" style={d(1400)} cx="194" cy="24" r="3.5" fill={V} />
      <circle className="mv-pulso" style={{ animationDelay: "1600ms" }} cx="194" cy="24" r="3.5" stroke={V} strokeWidth="1.25" />
    </Svg>
  );
}

/** V22 · Conexão: câmera existente ligada à AIP por uma linha que se desenha */
function Conexao() {
  return (
    <Svg>
      <g stroke={L} strokeWidth="1.1">
        <rect x="18" y="40" width="54" height="30" rx="5" />
        <path d="M72 48 L88 42 V68 L72 62" />
        <path d="M40 70 V86 M28 86 H52" />
      </g>
      <circle cx="31" cy="55" r="5" stroke={C} strokeWidth="1.1" />
      <path className="mv-linha" style={d(200)} d="M92 55 C120 55 124 30 150 30 H170" stroke={C} strokeWidth="1.25" strokeDasharray="1" pathLength={1} />
      <path className="mv-linha" style={d(400)} d="M92 55 C120 55 124 80 150 80 H170" stroke="rgb(255 255 255 / 0.35)" strokeWidth="1" pathLength={1} />
      <g className="mv-ponto" style={d(1000)}>
        <rect x="172" y="34" width="52" height="44" rx="8" stroke={C} strokeWidth="1.25" />
        <text x="198" y="61" textAnchor="middle" fill="#fff" fontFamily="var(--font-barlow-condensed), sans-serif" fontSize="15" fontWeight="600" letterSpacing="1">AIP</text>
      </g>
      <circle className="mv-ponto" style={d(900)} cx="170" cy="30" r="2.5" fill={C} />
    </Svg>
  );
}

/** V23 · Análise: quadro de imagem com caixas de detecção aparecendo */
function Analise() {
  const caixas = [
    { x: 52, y: 42, l: 18, a: 40 },
    { x: 96, y: 50, l: 16, a: 36 },
    { x: 140, y: 38, l: 20, a: 46 },
    { x: 178, y: 56, l: 14, a: 32 },
  ];
  return (
    <Svg>
      <rect x="20" y="10" width="200" height="100" rx="6" stroke={L} strokeWidth="1" />
      <path d="M20 92 L80 70 L140 82 L220 64" stroke={F} strokeWidth="1" />
      {caixas.map((c, i) => (
        <g key={i} className="mv-ponto" style={d(200 + i * 220)}>
          <circle cx={c.x + c.l / 2} cy={c.y + 7} r="4" stroke="rgb(255 255 255 / 0.5)" strokeWidth="1" />
          <path d={`M${c.x + c.l / 2} ${c.y + 12} V${c.y + c.a - 4}`} stroke="rgb(255 255 255 / 0.5)" strokeWidth="1" />
          <rect x={c.x} y={c.y} width={c.l} height={c.a} rx="2" stroke={C} strokeWidth="1.25" />
          <rect x={c.x} y={c.y - 9} width="16" height="7" rx="1.5" fill={C} />
        </g>
      ))}
      <circle className="mv-ponto" style={d(1200)} cx="206" cy="20" r="3" fill={C} />
    </Svg>
  );
}

/** V24 · Painel no notebook e no celular, com o mesmo gráfico se desenhando */
function Painel() {
  const grafico = (dx: number, dy: number, w: number, h: number, atraso: number) => {
    // Mesmo gráfico, ajustado ao tamanho de cada tela.
    const pts = [0.92, 0.7, 0.78, 0.42, 0.55, 0.2, 0.32];
    const d2 = pts.map((v, k) => `${k ? "L" : "M"}${dx + (w * k) / (pts.length - 1)} ${dy + h * v}`).join(" ");
    return <path className="mv-linha" style={d(atraso)} d={d2} stroke={C} strokeWidth="1.4" pathLength={1} />;
  };
  return (
    <Svg>
      {/* Notebook */}
      <rect x="22" y="12" width="150" height="88" rx="5" stroke={L} strokeWidth="1" />
      <path d="M8 104 H186 L180 110 H14 Z" stroke={L} strokeWidth="1" />
      <path d="M34 26 H76 M34 33 H58" stroke="rgb(255 255 255 / 0.35)" strokeWidth="2" />
      <path d="M34 88 H160" stroke={F} strokeWidth="1" />
      {grafico(34, 44, 126, 40, 250)}
      {/* Celular, um pouco à frente */}
      <g className="mv-ponto" style={d(150)}>
        <rect x="160" y="30" width="54" height="86" rx="8" fill="#111214" stroke={L} strokeWidth="1.1" />
        <path d="M180 35 H194" stroke="rgb(255 255 255 / 0.35)" strokeWidth="1.5" />
        <path d="M168 48 H190 M168 54 H182" stroke="rgb(255 255 255 / 0.35)" strokeWidth="1.5" />
        <path d="M168 104 H206" stroke={F} strokeWidth="1" />
      </g>
      {grafico(168, 64, 38, 34, 450)}
      <circle className="mv-ponto" style={d(1300)} cx="139" cy="52" r="2.6" fill={C} />
    </Svg>
  );
}

export function MiniVisual({ id, pct, alvo, ativo }: { id: VisualId; pct?: number; alvo?: number; ativo?: boolean }) {
  switch (id) {
    case "V1":
      return <Barras />;
    case "V2":
      return <MapaCalor />;
    case "V3":
      return <Zonas />;
    case "V4":
      return <Comparativo />;
    case "V5":
      return <Busca />;
    case "V6":
      return <Circulacao />;
    case "V7":
      return <AreaRestrita />;
    case "V8":
      return <Placa />;
    case "V9":
      return <Medidor pct={pct} />;
    case "V10":
      return <AreasComuns />;
    case "V11":
      return <LinhaVideo />;
    case "V12":
      return <Perfis />;
    case "V13":
      return <Mesas />;
    case "V14":
      return <Predios />;
    case "V15":
      return <Facial />;
    case "V16":
      return <Densidade alvo={alvo} ativo={ativo} />;
    case "V17":
      return <Aglomeracao />;
    case "V18":
      return <Perimetro />;
    case "V19":
      return <Permanencia />;
    case "V20":
      return <CirculacaoOperacional ativo={ativo} />;
    case "V21":
      return <Epi />;
    case "V22":
      return <Conexao />;
    case "V23":
      return <Analise />;
    case "V24":
      return <Painel />;
  }
}
