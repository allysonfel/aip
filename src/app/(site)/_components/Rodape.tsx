import Link from "next/link";
import { LogoAIP } from "@/components/shopping/Logo";
import { EMAIL, WHATSAPP } from "../_config/contato";
import { PRODUTOS, SOLUCOES } from "../_config/navegacao";

const COLUNAS = [
  { titulo: "Produtos", itens: PRODUTOS },
  { titulo: "Soluções", itens: SOLUCOES },
  {
    titulo: "Institucional",
    itens: [
      { href: "/tecnologia", rotulo: "Tecnologia" },
      { href: "/sobre", rotulo: "Sobre" },
      { href: "/contato", rotulo: "Contato" },
      { href: "/privacidade", rotulo: "Política de privacidade" },
    ],
  },
];

export default function Rodape() {
  return (
    <footer className="border-t border-linha">
      <div className="margem grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <LogoAIP className="h-8 text-white" />
          <p className="mt-5 font-medium">AIP — Agência de Inteligência Patrimonial</p>
          <p className="mt-1 text-cinza">Transformando imagens em inteligência.</p>
          {(WHATSAPP || EMAIL) && (
            <div className="mt-5 flex flex-col gap-1 text-sm text-cinza">
              {WHATSAPP && <a href={`https://wa.me/${WHATSAPP}`} className="hover:text-white">WhatsApp</a>}
              {EMAIL && <a href={`mailto:${EMAIL}`} className="hover:text-white">{EMAIL}</a>}
            </div>
          )}
        </div>
        {COLUNAS.map((c) => (
          <div key={c.titulo}>
            <h2 className="rotulo">{c.titulo}</h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {c.itens.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/75 hover:text-white">{l.rotulo}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="margem pb-10 text-sm text-cinza">Uma empresa do ecossistema Logos Company.</div>
    </footer>
  );
}
