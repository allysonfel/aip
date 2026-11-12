/** Totem genérico, com o campo de visão das câmeras em linhas finas. */
export function TotemIlustracao({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 760" role="img" aria-label="Ilustração de um totem de monitoramento com câmeras no topo e o campo de visão indicado por linhas finas" className={className}>
      <defs>
        <linearGradient id="corpo" x1="0" x2="1">
          <stop offset="0" stopColor="#3a3a3a" />
          <stop offset=".55" stopColor="#1d1d1d" />
          <stop offset="1" stopColor="#0c0c0c" />
        </linearGradient>
        <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--aip-visao)" stopOpacity=".22" />
          <stop offset="1" stopColor="var(--aip-visao)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points="222,112 10,620 150,690" fill="url(#cone)" />
      <polygon points="298,112 510,620 370,690" fill="url(#cone)" />
      <g stroke="var(--aip-visao)" strokeWidth="1" fill="none" opacity=".8" strokeDasharray="5 6">
        <path d="M222 112 L10 620 M222 112 L150 690 M298 112 L510 620 M298 112 L370 690" />
      </g>
      <ellipse cx="260" cy="706" rx="190" ry="26" fill="none" stroke="rgb(255 255 255 / .16)" />
      <rect x="192" y="690" width="136" height="20" rx="3" fill="#161616" stroke="rgb(255 255 255 / .2)" />
      <rect x="226" y="200" width="68" height="490" rx="6" fill="url(#corpo)" stroke="rgb(255 255 255 / .16)" />
      <rect x="238" y="430" width="44" height="120" rx="3" fill="none" stroke="rgb(255 255 255 / .16)" />
      <circle className="pulso" cx="260" cy="415" r="3" fill="var(--aip-visao)" />
      <rect x="240" y="110" width="40" height="92" rx="4" fill="#1a1a1a" stroke="rgb(255 255 255 / .16)" />
      <rect x="178" y="84" width="164" height="32" rx="8" fill="#262626" stroke="rgb(255 255 255 / .2)" />
      <circle cx="218" cy="100" r="9" fill="#050505" stroke="rgb(255 255 255 / .45)" />
      <circle cx="302" cy="100" r="9" fill="#050505" stroke="rgb(255 255 255 / .45)" />
      <rect x="248" y="50" width="24" height="34" rx="3" fill="#1a1a1a" stroke="rgb(255 255 255 / .16)" />
    </svg>
  );
}
