"use client";

import { usePathname } from "next/navigation";

// Transição entre páginas do site (CSS: .pagina-entra). A chave pelo caminho
// faz a animação tocar também entre páginas da mesma rota dinâmica
// (/solucoes/a → /solucoes/b), que o template sozinho não remontaria.
export default function Template({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  return (
    <div key={caminho} className="pagina-entra">
      {children}
    </div>
  );
}
