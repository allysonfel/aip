// Mapa de calor animado sobre uma planta genérica (não é de nenhum cliente).
const FOCOS = [
  { x: 180, y: 300, r: 130, atraso: 0 },
  { x: 500, y: 290, r: 170, atraso: 1.6 },
  { x: 830, y: 310, r: 120, atraso: 3 },
  { x: 500, y: 110, r: 90, atraso: 4.2 },
  { x: 500, y: 480, r: 85, atraso: 2.4 },
  { x: 950, y: 150, r: 45, atraso: 5.1 },
];

const LOJAS = [
  [50, 40, 150, 130], [220, 40, 130, 130], [370, 40, 70, 130], [560, 40, 70, 130], [650, 40, 130, 130], [800, 40, 150, 130],
  [50, 420, 150, 130], [220, 420, 130, 130], [370, 420, 70, 130], [560, 420, 70, 130], [650, 420, 130, 130], [800, 420, 150, 130],
];

const TRAJETOS = ["M40 300 C 220 260, 330 340, 500 295 S 800 270, 960 310", "M500 180 C 480 260, 530 330, 500 420", "M120 340 C 300 370, 410 240, 500 290 S 620 190, 500 175"];

export default function MapaCalor({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1000 590" role="img" aria-label="Planta genérica de um ambiente com mapa de calor e trajetos de circulação" className={className}>
      <defs>
        <radialGradient id="foco">
          <stop offset="0%" stopColor="var(--aip-visao)" stopOpacity="0.8" />
          <stop offset="55%" stopColor="var(--aip-visao)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--aip-visao)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="20" y="15" width="960" height="560" rx="14" fill="none" stroke="rgb(255 255 255 / .28)" />
      {LOJAS.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="4" fill="rgb(255 255 255 / .035)" stroke="rgb(255 255 255 / .16)" />
      ))}
      {FOCOS.map((f) => (
        <circle key={f.x + "-" + f.y} className="calor" cx={f.x} cy={f.y} r={f.r} fill="url(#foco)" style={{ animationDelay: `${f.atraso}s` }} />
      ))}
      {TRAJETOS.map((d, i) => (
        <path key={d} className="trajeto" d={d} pathLength={1} fill="none" stroke="var(--aip-visao)" strokeWidth="1.5" style={{ animationDelay: `${i * 2}s` }} />
      ))}
      {[[40, 262, 40, 338], [960, 272, 960, 348]].map(([a, b, c, d]) => (
        <line key={a} x1={a} y1={b} x2={c} y2={d} stroke="var(--aip-visao)" strokeWidth="2.5" />
      ))}
    </svg>
  );
}
