"use client";

import { useRef } from "react";
import Image from "next/image";

export type Cartao = { foto: string; alt: string; titulo: string; texto: string };

// Cartões arrastáveis: toque nativo no celular, ponteiro no desktop, setas
// redondas embaixo. O teclado alcança a faixa, que rola com as setas.
export default function Carrossel({ cartoes, rotulo }: { cartoes: Cartao[]; rotulo: string }) {
  const faixa = useRef<HTMLUListElement>(null);
  const arraste = useRef<{ x: number; inicio: number } | null>(null);

  function mover(direcao: 1 | -1) {
    const el = faixa.current;
    const cartao = el?.querySelector("li");
    if (!el || !cartao) return;
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direcao * (cartao.clientWidth + 20), behavior: reduzido ? "auto" : "smooth" });
  }

  return (
    <div>
      <ul
        ref={faixa}
        tabIndex={0}
        aria-label={rotulo}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") arraste.current = { x: e.clientX, inicio: faixa.current?.scrollLeft ?? 0 };
        }}
        onPointerMove={(e) => {
          if (arraste.current && faixa.current) faixa.current.scrollLeft = arraste.current.inicio - (e.clientX - arraste.current.x);
        }}
        onPointerUp={() => (arraste.current = null)}
        onPointerLeave={() => (arraste.current = null)}
        className="sem-barra flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-[clamp(1.25rem,4vw,3.5rem)] px-[clamp(1.25rem,4vw,3.5rem)] active:cursor-grabbing active:snap-none"
      >
        {cartoes.map((c) => (
          <li key={c.titulo} className="w-[82vw] shrink-0 snap-start sm:w-[420px]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-painel">
              <Image src={`/site/media/${c.foto}`} alt={c.alt} fill draggable={false} sizes="(min-width: 640px) 420px, 82vw" className="object-cover" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{c.titulo}</h3>
            <p className="mt-1 leading-snug text-cinza">{c.texto}</p>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex justify-center gap-3">
        {([[-1, "Anterior", "M15 5l-7 7 7 7"], [1, "Próximo", "M9 5l7 7-7 7"]] as const).map(([d, nome, caminho]) => (
          <button key={nome} type="button" aria-label={nome} onClick={() => mover(d)} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 transition-colors hover:bg-white hover:text-black">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden>
              <path d={caminho} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
