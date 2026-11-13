import type { ReactNode } from "react";

/* ---------------------------------- ícones ---------------------------------- */

const ICONES = {
  camera: (
    <>
      <path d="M3 7.5h11.5l4 3-4 3H3z" />
      <path d="M6.5 13.5v3.5H3" />
      <path d="M20.5 9v3" />
    </>
  ),
  ia: (
    <>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M7.5 12s1.8-3.2 4.5-3.2 4.5 3.2 4.5 3.2-1.8 3.2-4.5 3.2S7.5 12 7.5 12z" />
      <circle cx="12" cy="12" r="1.1" />
    </>
  ),
  dispositivos: (
    <>
      <rect x="2.5" y="4.5" width="13.5" height="10" rx="1.5" />
      <path d="M6.5 18.5h5.5M9.25 14.5v4" />
      <rect x="16.5" y="9" width="5" height="10.5" rx="1.2" />
    </>
  ),
  conecta: (
    <>
      <path d="M9 7V3.5M15 7V3.5" />
      <path d="M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0z" />
      <path d="M12 16v4.5" />
    </>
  ),
  alerta: (
    <>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  painel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.8" />
      <path d="M3 9h18M9 9v11" />
    </>
  ),
  equipe: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M15.2 14.1a4.6 4.6 0 0 1 5.8 4.4" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3.5 19 6v5.5c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  local: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  busca: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5.5 5.5" />
      <path d="M8 10.5h5M10.5 8v5" />
    </>
  ),
  teste: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.8" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  expansao: (
    <>
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="5.5" r="2" />
      <circle cx="18" cy="12" r="2" />
      <circle cx="18" cy="18.5" r="2" />
      <path d="M8 11 16.1 6.4M8.2 12h7.8M8 13l8.1 4.6" />
    </>
  ),
  semTroca: (
    <>
      <path d="M3 6.5h11.5l4 3-4 3H3z" />
      <path d="M6.5 12.5v3H3" />
      <path d="m13 18 2 2 4-4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type NomeIcone = keyof typeof ICONES;

export function Icone({ nome, className = "h-7 w-7" }: { nome: NomeIcone; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {ICONES[nome]}
    </svg>
  );
}
