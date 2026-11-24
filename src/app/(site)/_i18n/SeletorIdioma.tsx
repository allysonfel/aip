"use client";

import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { useIdioma } from "./Contexto";
import { COOKIE_DURACAO, COOKIE_IDIOMA, comIdioma, HTML_LANG, IDIOMAS, semIdioma, SIGLA } from "./idiomas";

/**
 * PT · EN · RU: o atual em branco, os outros em cinza. Leva para a mesma
 * página no outro idioma (com o mesmo ?...) e grava a escolha no cookie, que
 * o proxy respeita. Navegação completa: o cookie já vale na próxima requisição.
 */
export default function SeletorIdioma({ className = "" }: { className?: string }) {
  const { idioma, d } = useIdioma();
  const base = semIdioma(usePathname()).caminho;
  return (
    <nav aria-label={d.menu.idioma} className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] ${className}`}>
      {IDIOMAS.map((i, n) => {
        const destino = comIdioma(i, base);
        return (
          <Fragment key={i}>
            {n > 0 && (
              <span aria-hidden className="text-white/30">
                ·
              </span>
            )}
            <a
              href={destino}
              hrefLang={HTML_LANG[i]}
              lang={HTML_LANG[i]}
              aria-current={i === idioma ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                document.cookie = `${COOKIE_IDIOMA}=${i}; path=/; max-age=${COOKIE_DURACAO}; samesite=lax`;
                window.location.assign(destino + window.location.search + window.location.hash);
              }}
              className={`px-0.5 py-1 transition-colors ${i === idioma ? "text-white" : "text-white/45 hover:text-white"}`}
            >
              {SIGLA[i]}
            </a>
          </Fragment>
        );
      })}
    </nav>
  );
}
