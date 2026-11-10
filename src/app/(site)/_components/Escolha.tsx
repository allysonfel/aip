"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

export type OpcaoEscolha = { valor: string; rotulo: string; detalhe?: string; icone?: ReactNode };

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Seta() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className="h-3 w-3 shrink-0 text-white/60">
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Lista suspensa no estilo do site: abre logo abaixo do campo (sem ocupar a
 * tela toda, nem no celular), com rolagem, busca opcional e teclado
 * (setas, Enter, Esc). O valor vai para o formulário num campo oculto.
 */
export default function Escolha({
  nome,
  id,
  opcoes,
  valor,
  aoMudar,
  marcador = "Selecione",
  busca = false,
  desativado = false,
  invalido = false,
  rotuloAcessivel,
  gatilho,
  classeGatilho,
  classePainel = "w-full",
}: {
  nome: string;
  id?: string;
  opcoes: OpcaoEscolha[];
  valor: string;
  aoMudar: (valor: string) => void;
  marcador?: string;
  busca?: boolean;
  desativado?: boolean;
  invalido?: boolean;
  rotuloAcessivel?: string;
  /** Conteúdo próprio do botão (ex.: bandeira + código). */
  gatilho?: ReactNode;
  classeGatilho?: string;
  classePainel?: string;
}) {
  const base = useId();
  const [aberto, setAberto] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [ativo, setAtivo] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const campoBusca = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  const visiveis = useMemo(() => {
    const f = normalizar(filtro.trim());
    if (!f) return opcoes;
    // Primeiro quem começa com o texto digitado, depois quem só contém.
    const comeca: OpcaoEscolha[] = [];
    const contem: OpcaoEscolha[] = [];
    for (const o of opcoes) {
      const texto = normalizar(`${o.rotulo} ${o.detalhe ?? ""}`);
      if (normalizar(o.rotulo).startsWith(f)) comeca.push(o);
      else if (texto.includes(f)) contem.push(o);
    }
    return [...comeca, ...contem];
  }, [opcoes, filtro]);

  const atual = opcoes.find((o) => o.valor === valor);

  function abrir() {
    if (desativado) return;
    setFiltro("");
    setAtivo(Math.max(0, opcoes.findIndex((o) => o.valor === valor)));
    setAberto(true);
  }

  function fechar(focar = true) {
    setAberto(false);
    if (focar) botao.current?.focus();
  }

  function escolher(o: OpcaoEscolha) {
    aoMudar(o.valor);
    fechar();
  }

  // Foco na busca (ou na lista) ao abrir; fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;
    (busca ? campoBusca.current : lista.current)?.focus();
    const fora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) fechar(false);
    };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberto, busca]);

  // Mantém a opção ativa à vista ao navegar pelo teclado.
  useEffect(() => {
    if (!aberto) return;
    lista.current?.querySelector<HTMLElement>(`[data-indice="${ativo}"]`)?.scrollIntoView({ block: "nearest" });
  }, [ativo, aberto]);

  useEffect(() => setAtivo(0), [filtro]);

  function teclas(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((i) => Math.min(i + 1, visiveis.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setAtivo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setAtivo(visiveis.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (visiveis[ativo]) escolher(visiveis[ativo]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      fechar();
    } else if (e.key === "Tab") {
      fechar(false);
    }
  }

  const idLista = `${base}-lista`;
  const idOpcao = (i: number) => `${base}-op-${i}`;

  return (
    <div ref={raiz} className="relative">
      <input type="hidden" name={nome} value={valor} />
      <button
        ref={botao}
        id={id}
        type="button"
        disabled={desativado}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={idLista}
        aria-label={rotuloAcessivel}
        aria-invalid={invalido || undefined}
        onClick={() => (aberto ? fechar() : abrir())}
        onKeyDown={(e) => {
          if (!aberto && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            abrir();
          }
        }}
        className={
          classeGatilho ??
          `flex w-full items-center justify-between gap-3 rounded-xl border bg-white/[0.04] px-4 py-3 text-left outline-none transition-colors focus-visible:border-white disabled:cursor-not-allowed disabled:opacity-50 ${aberto || invalido ? "border-white" : "border-white/20 hover:border-white/50"}`
        }
      >
        {gatilho ?? (
          <span className={`flex min-w-0 items-center gap-2 truncate ${atual ? "text-white" : "text-white/40"}`}>
            {atual?.icone}
            <span className="truncate">{atual?.rotulo ?? marcador}</span>
          </span>
        )}
        <Seta />
      </button>

      {aberto && (
        <div className={`absolute left-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border border-white/15 bg-neutral-900 shadow-2xl shadow-black/70 ${classePainel}`}>
          {busca && (
            <div className="border-b border-white/10 p-2">
              <input
                ref={campoBusca}
                type="text"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                onKeyDown={teclas}
                placeholder="Buscar"
                aria-label="Buscar na lista"
                aria-controls={idLista}
                aria-activedescendant={visiveis[ativo] ? idOpcao(ativo) : undefined}
                autoComplete="off"
                className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:bg-white/[0.09]"
              />
            </div>
          )}
          <ul
            ref={lista}
            id={idLista}
            role="listbox"
            tabIndex={busca ? -1 : 0}
            aria-label={rotuloAcessivel}
            aria-activedescendant={!busca && visiveis[ativo] ? idOpcao(ativo) : undefined}
            onKeyDown={busca ? undefined : teclas}
            className="sem-barra max-h-64 overflow-y-auto overscroll-contain py-1 outline-none"
          >
            {visiveis.map((o, i) => (
              <li
                key={o.valor}
                id={idOpcao(i)}
                data-indice={i}
                role="option"
                aria-selected={o.valor === valor}
                onPointerMove={() => setAtivo(i)}
                onClick={() => escolher(o)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors ${i === ativo ? "bg-white/[0.08]" : ""} ${o.valor === valor ? "text-visao" : "text-white"}`}
              >
                {o.icone && <span aria-hidden className="shrink-0">{o.icone}</span>}
                <span className="min-w-0 flex-1 truncate">{o.rotulo}</span>
                {o.detalhe && <span className="shrink-0 text-white/50">{o.detalhe}</span>}
              </li>
            ))}
            {!visiveis.length && <li className="px-4 py-3 text-sm text-white/50">Nada encontrado</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
