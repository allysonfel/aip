"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoAIP } from "@/components/shopping/Logo";

export const LINKS = [
  { href: "/cameras-ia", rotulo: "Câmeras IA" },
  { href: "/totem-ia", rotulo: "Totem IA" },
  { href: "/empresas", rotulo: "Empresas" },
  { href: "/setor-publico", rotulo: "Setor público" },
  { href: "/tecnologia", rotulo: "Tecnologia" },
  { href: "/sobre", rotulo: "Sobre" },
];

// Cápsula flutuante, fixa ao rolar. No celular abre um menu em tela cheia.
export default function Navegacao() {
  const [aberto, setAberto] = useState(false);
  const caminho = usePathname();
  const botao = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setAberto(false);
  }, [caminho]);

  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    if (!aberto) return;
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAberto(false);
        botao.current?.focus();
      }
    }
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <>
      <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4">
        <nav aria-label="Principal" className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4 rounded-2xl border border-white/10 bg-neutral-900/70 pl-5 pr-2 backdrop-blur-xl">
          <Link href="/" aria-label="AIP, página inicial" className="flex items-center">
            <LogoAIP className="h-6 text-white" />
          </Link>
          <ul className="hidden items-center gap-6 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={caminho === l.href ? "page" : undefined} className={`text-sm transition-colors hover:text-white ${caminho === l.href ? "text-white" : "text-white/70"}`}>
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1">
            <Link href="/contato" className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-white/85">
              Fale conosco
            </Link>
            <button ref={botao} type="button" aria-label={aberto ? "Fechar menu" : "Abrir menu"} aria-expanded={aberto} aria-controls="menu-movel" onClick={() => setAberto(!aberto)} className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden">
              <span className={`h-px w-5 bg-white transition-transform ${aberto ? "translate-y-[3.5px] rotate-45" : ""}`} />
              <span className={`h-px w-5 bg-white transition-transform ${aberto ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
            </button>
          </div>
        </nav>
      </header>

      <div id="menu-movel" hidden={!aberto} className="fixed inset-0 z-40 overflow-y-auto bg-black px-6 pb-10 pt-28 lg:hidden">
        <ul className="flex flex-col gap-5">
          {[{ href: "/", rotulo: "Início" }, ...LINKS, { href: "/contato", rotulo: "Contato" }].map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={() => setAberto(false)} className="font-titulo text-4xl font-semibold">
                {l.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
