import Image from "next/image";
import Reveal from "./Reveal";

export type Camada = { titulo: string; texto: string };

/** Arquitetura em camadas: um pulso desce da câmera ao painel. */
export function DiagramaCamadas({ camadas }: { camadas: Camada[] }) {
  return (
    <ol className="relative mt-14">
      <span aria-hidden className="absolute bottom-6 left-[1.45rem] top-6 w-px bg-linha">
        <span className="fluxo absolute -left-[3px] h-[7px] w-[7px] rounded-full bg-visao shadow-[0_0_14px_var(--aip-visao)]" />
      </span>
      {camadas.map((c, i) => (
        <li key={c.titulo}>
          <Reveal atraso={i * 80} className="relative grid gap-2 border-b border-linha py-8 pl-16 md:grid-cols-[16rem_1fr] md:gap-10">
            <span className="absolute left-0 top-7 flex h-12 w-12 items-center justify-center rounded-full border border-linha bg-black font-titulo text-xl font-semibold">{i + 1}</span>
            <h3 className="titulo-coluna md:text-4xl">{c.titulo}</h3>
            <p className="corpo">{c.texto}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

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

/** Linhas e zonas desenhadas sobre a imagem de uma câmera. */
export function CalibracaoIlustracao() {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-painel">
      <Image src="/site/media/praca-hero.jpg" alt="Vista do alto de uma praça, como a imagem de uma câmera" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover brightness-[.55]" />
      <svg viewBox="0 0 160 90" className="absolute inset-0 h-full w-full" aria-hidden>
        <g fill="none" stroke="var(--aip-visao)" strokeWidth=".45">
          <polygon points="42,30 92,30 100,62 30,62" fill="var(--aip-visao)" fillOpacity=".13" />
          <polygon points="105,22 128,22 138,44 112,44" strokeDasharray="1.6 1.2" />
          <line x1="16" y1="72" x2="108" y2="72" strokeWidth=".8" />
          <path d="M60 68 v8 m-2 -2 l2 2 l2 -2" strokeWidth=".5" />
        </g>
        <g fill="var(--aip-visao)" fontSize="3" fontFamily="sans-serif" fontWeight="600">
          <text x="43" y="28">ZONA A</text>
          <text x="106" y="20">ZONA B</text>
          <text x="16" y="70">LINHA DE CONTAGEM</text>
        </g>
      </svg>
    </div>
  );
}
