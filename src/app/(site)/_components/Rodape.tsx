import Link from "next/link";
import { LogoAIP } from "@/components/shopping/Logo";
import { CIDADE, EMAIL, WHATSAPP } from "../_config/contato";
import { PRODUTOS, SOLUCOES } from "../_config/navegacao";

const COLUNAS = [
  { titulo: "Produtos", itens: PRODUTOS },
  { titulo: "Soluções", itens: SOLUCOES },
  {
    titulo: "Institucional",
    itens: [
      { href: "/sobre", rotulo: "Sobre" },
      { href: "/contato", rotulo: "Contato" },
      { href: "/privacidade", rotulo: "Política de privacidade" },
    ],
  },
];

// Desktop: marca + 4 colunas (Produtos, Soluções, Institucional, Contato) pela
// largura toda. Tablet e celular: marca em cima e os grupos em 2 colunas.
// Contatos vazios em _config/contato.ts não aparecem.
export default function Rodape() {
  return (
    <footer className="border-t border-linha">
      <div className="margem grid grid-cols-2 gap-x-6 gap-y-12 py-16 sm:gap-x-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr] lg:gap-x-12">
        <div className="col-span-2 lg:col-span-1">
          {/* Assinatura: o nome centralizado embaixo do AIP, no mesmo desenho das
              apresentações comerciais (texto com ~18% da altura do logo, espaçado). */}
          <Link
            href="/"
            aria-label="AIP — Agência de Inteligência Patrimonial, página inicial"
            className="inline-flex flex-col items-center"
          >
            <LogoAIP className="h-11 text-white" />
            <span
              aria-hidden
              className="mt-[0.55em] whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.14em] text-white/70"
            >
              Agência de Inteligência Patrimonial
            </span>
          </Link>
        </div>

        {COLUNAS.map((c) => (
          <div key={c.titulo}>
            <h2 className="rotulo">{c.titulo}</h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {c.itens.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/75 hover:text-white"
                  >
                    {l.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h2 className="rotulo">Contato</h2>
          {(EMAIL || WHATSAPP || CIDADE) && (
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {EMAIL && (
                <li>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="break-all text-white/75 hover:text-white"
                  >
                    {EMAIL}
                  </a>
                </li>
              )}
              {WHATSAPP && (
                <li>
                  <a
                    href={`https://wa.me/${WHATSAPP}`}
                    className="text-white/75 hover:text-white"
                  >
                    WhatsApp
                  </a>
                </li>
              )}
              {CIDADE && <li className="text-white/55">{CIDADE}</li>}
            </ul>
          )}
          <Link
            href="/contato"
            className="botao botao-claro botao-pequeno botao-simples mt-4"
          >
            Fale conosco
          </Link>
        </div>
      </div>

      <div className="margem">
        <div className="flex flex-col gap-2 border-t border-linha py-8 text-sm text-cinza sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} AIP — Agência de Inteligência
            Patrimonial
          </p>
          <p>
            Empresa do ecossistema{" "}
            <a
              href="https://logoscompany.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/75 underline-offset-4 hover:text-white hover:underline"
            >
              Logos Company
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
