import { LogoAIP } from "@/components/shopping/Logo";
import { CIDADE, EMAIL, INSTAGRAM, WHATSAPP } from "../_config/contato";
import { menu } from "../_config/navegacao";
import Link from "../_i18n/LinkI";
import SeletorIdioma from "../_i18n/SeletorIdioma";
import { i18n } from "../_i18n/servidor";

// Desktop: marca + 4 colunas (Produtos, Soluções, Institucional, Contato) pela
// largura toda. Tablet e celular: marca em cima e os grupos em 2 colunas.
// Contatos vazios em _config/contato.ts não aparecem.
export default async function Rodape() {
  const { idioma, d } = await i18n();
  const itens = menu(idioma);
  const COLUNAS = [
    { titulo: d.rodape.produtos, itens: itens.produtos },
    { titulo: d.rodape.solucoes, itens: itens.solucoes },
    {
      titulo: d.rodape.institucional,
      itens: [
        { href: "/sobre", rotulo: d.rodape.sobre },
        { href: "/contato", rotulo: d.rodape.contato },
        { href: "/privacidade", rotulo: d.rodape.privacidade },
      ],
    },
  ];
  return (
    <footer className="border-t border-linha">
      <div className="margem grid grid-cols-2 gap-x-6 gap-y-12 py-16 sm:gap-x-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr] lg:gap-x-12">
        <div className="col-span-2 flex flex-col items-start gap-8 lg:col-span-1">
          {/* Assinatura: o nome centralizado embaixo do AIP, no mesmo desenho das
              apresentações comerciais (texto com ~18% da altura do logo, espaçado). */}
          <Link
            href="/"
            aria-label={d.rodape.inicio}
            className="inline-flex flex-col items-center"
          >
            <LogoAIP className="h-11 text-white" />
            <span
              aria-hidden
              className="mt-[0.55em] whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.14em] text-white/70"
            >
              {d.comum.assinatura}
            </span>
          </Link>
          {/* Redes sociais: embaixo da marca, separadas dos canais de contato */}
          {INSTAGRAM && (
            <a
              href={`https://instagram.com/${INSTAGRAM}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${d.rodape.instagram}: @${INSTAGRAM}`}
              className="flex items-center gap-2 text-sm text-white/75 hover:text-white"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
              </svg>
              @{INSTAGRAM}
            </a>
          )}
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
          <h2 className="rotulo">{d.rodape.contatoTitulo}</h2>
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
            {d.comum.faleConosco}
          </Link>
        </div>
      </div>

      <div className="margem">
        <div className="flex flex-col gap-2 border-t border-linha py-8 text-sm text-cinza sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {d.rodape.direitos}
          </p>
          <SeletorIdioma />
          <p>
            {d.rodape.ecossistema}{" "}
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
