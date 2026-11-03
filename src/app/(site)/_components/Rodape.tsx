import Link from "next/link";
import { LogoAIP } from "@/components/shopping/Logo";
import { EMAIL, WHATSAPP } from "../_config/contato";

const NAVEGACAO = [
  { href: "/", rotulo: "Início" },
  { href: "/cameras-ia", rotulo: "Câmeras IA" },
  { href: "/totem-ia", rotulo: "Totem IA" },
  { href: "/empresas", rotulo: "Empresas" },
  { href: "/setor-publico", rotulo: "Setor público" },
  { href: "/tecnologia", rotulo: "Tecnologia" },
  { href: "/sobre", rotulo: "Sobre" },
  { href: "/contato", rotulo: "Contato" },
];

export default function Rodape() {
  return (
    <footer className="border-t border-linha">
      <div className="margem grid gap-12 py-16 md:grid-cols-[1.6fr_1fr_1fr]">
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
        <div>
          <h2 className="rotulo">Navegação</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-1">
            {NAVEGACAO.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/75 hover:text-white">{l.rotulo}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="rotulo">Institucional</h2>
          <ul className="mt-4 text-sm">
            <li>
              <Link href="/privacidade" className="text-white/75 hover:text-white">Política de Privacidade</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="margem pb-10 text-sm text-cinza">Uma empresa do ecossistema Logos Company.</div>
    </footer>
  );
}
