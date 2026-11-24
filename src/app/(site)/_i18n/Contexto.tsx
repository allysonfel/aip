"use client";

import { createContext, useContext, type ReactNode } from "react";
import { dicionario, type Dicionario } from "./dicionario";
import { comIdioma, PADRAO, type Idioma } from "./idiomas";

// Idioma e textos para os Client Components. Sem provedor (ex.: artes do
// Instagram que reaproveitam os mini gráficos), vale o português.
const Contexto = createContext<{ idioma: Idioma; d: Dicionario }>({ idioma: PADRAO, d: dicionario(PADRAO) });

export function ProvedorIdioma({ idioma, children }: { idioma: Idioma; children: ReactNode }) {
  return <Contexto.Provider value={{ idioma, d: dicionario(idioma) }}>{children}</Contexto.Provider>;
}

/** `const { idioma, d, l } = useIdioma()`: l("/contato") devolve o link no idioma. */
export function useIdioma() {
  const { idioma, d } = useContext(Contexto);
  return { idioma, d, l: (href: string) => comIdioma(idioma, href) };
}
