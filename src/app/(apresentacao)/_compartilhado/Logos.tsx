"use client";

import { useEffect, useRef, useState } from "react";
import { LogoAIP, LogoA } from "@/components/shopping/Logo";

export { LogoAIP, LogoA };


/** Logo da AIP com o nome por extenso logo abaixo, centralizado. */
export function LogoAIPNome({ logo, nome }: { logo: string; nome: string }) {
  return (
    <span className="inline-flex flex-col items-center">
      <LogoAIP className={`${logo} text-white`} />
      <span className={`mt-[0.55em] whitespace-nowrap font-medium uppercase tracking-[0.14em] text-white/70 ${nome}`}>Agência de Inteligência Patrimonial</span>
    </span>
  );
}

/**
 * Logo de cliente em branco sobre o fundo escuro (filtro brightness+invert:
 * serve para logos coloridos com fundo transparente). Sem o arquivo, mostra
 * um marcador discreto com o nome do cliente.
 */
export function LogoCliente({ src, alt, reserva, className = "" }: { src: string; alt: string; reserva: string; className?: string }) {
  const img = useRef<HTMLImageElement>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setErro(true);
  }, []);

  if (erro)
    return (
      <span className={`inline-flex items-center justify-center rounded-lg border border-dashed border-white/25 px-[1em] text-center font-titulo text-[clamp(0.8rem,1.6vh,1.1rem)] font-semibold uppercase tracking-[0.14em] text-white/55 ${className}`}>
        {reserva}
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element -- logo do cliente com filtro, sem otimização.
  return <img ref={img} src={src} alt={alt} onError={() => setErro(true)} className={`w-auto select-none brightness-0 invert ${className}`} draggable={false} />;
}
