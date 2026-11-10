"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoAIP } from "@/components/shopping/Logo";
import { PRODUTOS, SOLUCOES, type ItemMenu as Item } from "../_config/navegacao";

const GRUPOS = [
  { id: "produtos", rotulo: "Produtos", itens: PRODUTOS },
  { id: "solucoes", rotulo: "Soluções", itens: SOLUCOES },
] as const;

const SIMPLES: Item[] = [
  { href: "/tecnologia", rotulo: "Tecnologia" },
  { href: "/sobre", rotulo: "Sobre" },
];

type Grupo = (typeof GRUPOS)[number]["id"];

function Seta({ aberto }: { aberto: boolean }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className={`h-3 w-3 transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}>
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Barra transparente, fixa no topo: some ao rolar para baixo e volta ao rolar
// para cima. Produtos e Soluções abrem um painel suspenso (fecha ao clicar
// fora, com Esc ou quando o foco sai do menu). No celular, menu em tela cheia
// com os grupos expansíveis.
export default function Navegacao() {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const [suspenso, setSuspenso] = useState<Grupo | null>(null);
  const [expandido, setExpandido] = useState<Grupo | null>(null);
  const [escondido, setEscondido] = useState(false);
  const [noTopo, setNoTopo] = useState(true);
  const botao = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  const gatilhos = useRef<Partial<Record<Grupo, HTMLButtonElement | null>>>({});

  useEffect(() => {
    setAberto(false);
    setSuspenso(null);
    setExpandido(null);
  }, [caminho]);

  // Some ao rolar para baixo, volta ao rolar para cima. Pequenos movimentos
  // (menos de 6px) são ignorados para a barra não piscar.
  useEffect(() => {
    let anterior = window.scrollY;
    let quadro = 0;
    function rolar() {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        const y = window.scrollY;
        setNoTopo(y < 24);
        if (y < 80) setEscondido(false);
        else if (y - anterior > 6) setEscondido(true);
        else if (anterior - y > 6) setEscondido(false);
        if (Math.abs(y - anterior) > 6 || y < 80) anterior = y;
      });
    }
    rolar();
    window.addEventListener("scroll", rolar, { passive: true });
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", rolar);
    };
  }, []);

  // Painel suspenso do desktop
  useEffect(() => {
    if (!suspenso) return;
    const fora = (e: PointerEvent) => {
      if (!nav.current?.contains(e.target as Node)) setSuspenso(null);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      gatilhos.current[suspenso]?.focus();
      setSuspenso(null);
    };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [suspenso]);

  // Menu em tela cheia do celular
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

  const oculta = escondido && !aberto && !suspenso;
  const ativo = (href: string) => caminho === href;
  const grupoAtivo = (itens: readonly Item[]) => itens.some((i) => ativo(i.href));

  return (
    <>
      <header
        onFocus={() => setEscondido(false)}
        className={`fixed inset-x-0 top-0 z-50 transition-[opacity,visibility] duration-500 ease-out motion-reduce:transition-none ${oculta ? "invisible opacity-0" : "visible opacity-100"}`}
      >
        {/* Sombra suave atrás da barra quando a página já rolou, só para o texto ler bem. */}
        <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 via-black/30 to-transparent transition-opacity duration-500 ${noTopo || aberto ? "opacity-0" : "opacity-100"}`} />
        <nav
          ref={nav}
          aria-label="Principal"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setSuspenso(null);
          }}
          className="margem relative flex h-20 items-center justify-between gap-4"
        >
          <Link href="/" aria-label="AIP, página inicial" className="flex items-center">
            <LogoAIP className="h-6 text-white" />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {GRUPOS.map((g) => (
              <li key={g.id}>
                <button
                  ref={(el) => {
                    gatilhos.current[g.id] = el;
                  }}
                  type="button"
                  aria-expanded={suspenso === g.id}
                  aria-controls={`painel-${g.id}`}
                  onClick={() => setSuspenso(suspenso === g.id ? null : g.id)}
                  className={`flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm transition-colors hover:text-white ${suspenso === g.id || grupoAtivo(g.itens) ? "text-white" : "text-white/70"} ${suspenso === g.id ? "bg-white/10" : ""}`}
                >
                  {g.rotulo}
                  <Seta aberto={suspenso === g.id} />
                </button>
              </li>
            ))}
            {SIMPLES.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={ativo(l.href) ? "page" : undefined} className={`flex h-10 items-center px-3.5 text-sm transition-colors hover:text-white ${ativo(l.href) ? "text-white" : "text-white/70"}`}>
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link href="/contato" className="botao botao-claro botao-pequeno botao-simples min-h-10">
              Fale conosco
            </Link>
            <button ref={botao} type="button" aria-label={aberto ? "Fechar menu" : "Abrir menu"} aria-expanded={aberto} aria-controls="menu-movel" onClick={() => setAberto(!aberto)} className="-mr-2 flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden">
              <span className={`h-px w-6 bg-white transition-transform duration-300 ${aberto ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`h-px w-6 bg-white transition-opacity duration-200 ${aberto ? "opacity-0" : ""}`} />
              <span className={`h-px w-6 bg-white transition-transform duration-300 ${aberto ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </button>
          </div>

          {/* Painéis suspensos (desktop) */}
          {GRUPOS.map((g) => {
            const visivel = suspenso === g.id;
            return (
              <div
                key={g.id}
                id={`painel-${g.id}`}
                className={`absolute left-1/2 top-[calc(100%+0.5rem)] hidden -translate-x-1/2 rounded-2xl border border-white/10 bg-neutral-900/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl transition-[opacity,translate,visibility] duration-200 ease-out lg:block ${g.id === "solucoes" ? "w-[40rem]" : "w-[26rem]"} ${visivel ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0"}`}
              >
                <ul className={`grid gap-1 ${g.id === "solucoes" ? "grid-cols-2" : ""}`}>
                  {g.itens.map((i) => (
                    <li key={i.href}>
                      <Link href={i.href} aria-current={ativo(i.href) ? "page" : undefined} className="block rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.07] focus-visible:bg-white/[0.07]">
                        <span className={`block font-medium ${ativo(i.href) ? "text-visao" : "text-white"}`}>{i.rotulo}</span>
                        {i.descricao && <span className="mt-0.5 block text-sm leading-snug text-white/55">{i.descricao}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </header>

      <div id="menu-movel" hidden={!aberto} className="fixed inset-0 z-40 overflow-y-auto bg-black px-6 pb-12 pt-28 lg:hidden">
        <ul className="flex flex-col gap-6">
          {GRUPOS.map((g) => (
            <li key={g.id}>
              <button type="button" aria-expanded={expandido === g.id} aria-controls={`movel-${g.id}`} onClick={() => setExpandido(expandido === g.id ? null : g.id)} className="flex items-center gap-3 font-titulo text-4xl font-semibold">
                {g.rotulo}
                <Seta aberto={expandido === g.id} />
              </button>
              <ul id={`movel-${g.id}`} hidden={expandido !== g.id} className="mt-4 flex flex-col gap-3 pl-1">
                {g.itens.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} onClick={() => setAberto(false)} aria-current={ativo(i.href) ? "page" : undefined} className="text-xl text-white/80 hover:text-white">
                      <span aria-hidden className="mr-2 text-white/40">–</span>
                      {i.rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
          {[...SIMPLES, { href: "/contato", rotulo: "Contato" }].map((l) => (
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
