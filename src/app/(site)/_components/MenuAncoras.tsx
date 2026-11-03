"use client";

import { useEffect, useState } from "react";

// Menu de seções, fixo abaixo da navegação, marcando a seção em tela.
export default function MenuAncoras({ itens }: { itens: { id: string; rotulo: string }[] }) {
  const [ativo, setAtivo] = useState("");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setAtivo(e.target.id);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    for (const i of itens) {
      const el = document.getElementById(i.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [itens]);

  return (
    <nav aria-label="Seções da página" className="sticky top-[4.75rem] z-30 border-b border-linha bg-black/85 backdrop-blur-md sm:top-20">
      <ul className="sem-barra margem flex gap-6 overflow-x-auto whitespace-nowrap py-3.5 text-sm lg:justify-center lg:gap-10">
        {itens.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} aria-current={ativo === i.id ? "true" : undefined} className={`transition-colors hover:text-white ${ativo === i.id ? "text-white" : "text-cinza"}`}>
              {i.rotulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
