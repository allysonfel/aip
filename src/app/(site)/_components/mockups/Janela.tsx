import type { ReactNode } from "react";
import { LogoAIP } from "@/components/shopping/Logo";
import { Legenda } from "../Base";

// Moldura dos mockups do painel. Dados fictícios, marca da AIP.
export default function Janela({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <figure>
      <div aria-hidden className="overflow-hidden rounded-2xl border border-linha bg-[#0a0a0a] text-[13px]">
        <div className="flex items-center justify-between border-b border-linha px-4 py-2.5">
          <LogoAIP className="h-4 text-white" />
          <span className="text-xs text-cinza">{titulo}</span>
        </div>
        <div className="p-4">{children}</div>
      </div>
      <figcaption>
        <Legenda>Imagem ilustrativa, com dados fictícios</Legenda>
      </figcaption>
    </figure>
  );
}
