import { notFound } from "next/navigation";
import { metadados } from "../../../_config/metadados";
import { Acordeao, Botao, Encerramento, Hero, Lista } from "../../../_components/Base";
import Carrossel from "../../../_components/Carrossel";
import { CartaoSegmento } from "../../../_components/Cartoes";
import CartaoUso from "../../../_components/CartaoUso";
import Passos from "../../../_components/Passos";
import Reveal from "../../../_components/Reveal";
import { buscarSegmento, contatoSegmento, hrefSegmento, segmentos, SLUGS } from "../../../_content/solucoes";
import { f } from "../../../_i18n/dicionario";
import Link from "../../../_i18n/LinkI";
import { i18n } from "../../../_i18n/servidor";

// Modelo único das páginas de Soluções: o conteúdo vem de _content/solucoes.

export const dynamicParams = false;

export function generateStaticParams() {
  return SLUGS.map((segmento) => ({ segmento }));
}

export async function generateMetadata({ params }: { params: Promise<{ segmento: string }> }) {
  const { idioma } = await i18n();
  const s = buscarSegmento((await params).segmento, idioma);
  return s ? metadados(idioma, hrefSegmento(s), s.nome, s.hero.texto) : {};
}

async function Migalhas({ nome }: { nome: string }) {
  const { d } = await i18n();
  return (
    <nav aria-label={d.segmento.voceEstaEm}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-white/65">
        <li>
          <Link href="/" className="hover:text-white">{d.segmento.inicio}</Link>
        </li>
        <li aria-hidden>/</li>
        <li>{d.segmento.solucoes}</li>
        <li aria-hidden>/</li>
        <li aria-current="page" className="text-white">{nome}</li>
      </ol>
    </nav>
  );
}

export default async function PaginaSegmento({ params }: { params: Promise<{ segmento: string }> }) {
  const { idioma, d } = await i18n();
  const s = buscarSegmento((await params).segmento, idioma);
  if (!s) notFound();
  const contato = contatoSegmento(s);
  const outros = segmentos(idioma).filter((o) => o.slug !== s.slug);

  return (
    <>
      <Hero migalhas={<Migalhas nome={s.nome} />} titulo={s.hero.titulo} texto={s.hero.texto} botoes={<Botao href={contato}>{d.comum.solicitarDemonstracao}</Botao>} midia={{ foto: s.hero.foto, alt: s.hero.alt }} />

      <section className="secao overflow-hidden">
        <Reveal className="margem mb-10">
          <h2 className="titulo-secao">{d.segmento.comoUsada}</h2>
        </Reveal>
        <Reveal>
          <Carrossel rotulo={f(d.segmento.comoUsadaEm, { nome: s.nome })} largura="w-[78vw] sm:w-[340px]" itens={s.usos.map((u, i) => ({ chave: u.titulo, conteudo: <CartaoUso indice={i + 1} {...u} /> }))} />
        </Reveal>
      </section>

      <section className="secao border-t border-linha">
        <div className="margem grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <h2 className="titulo-tela">{d.segmento.comoFunciona}</h2>
            <p className="corpo mt-6 max-w-[30rem]">{s.pratica.texto}</p>
          </Reveal>
          <Passos passos={s.pratica.passos} />
        </div>
      </section>

      {s.governanca && (
        <section className="secao border-y border-linha bg-painel">
          <div className="margem grid gap-10 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <h2 className="titulo-tela">{d.segmento.governanca}</h2>
              <p className="corpo mt-6">{s.governanca.texto}</p>
            </Reveal>
            <Reveal atraso={120}>
              <Lista itens={s.governanca.itens} />
            </Reveal>
          </div>
        </section>
      )}

      <div className={s.governanca ? "" : "border-t border-linha"}>
        <Acordeao titulo={d.comum.perguntasFrequentes} itens={s.faq} />
      </div>
      <Encerramento titulo={s.encerramento.titulo} texto={s.encerramento.texto} cta={s.encerramento.cta} href={contato} />

      <section className="secao overflow-hidden border-t border-linha">
        <Reveal className="margem mb-10">
          <h2 className="titulo-secao">{d.segmento.outros}</h2>
        </Reveal>
        <Reveal>
          <Carrossel rotulo={d.segmento.outrosRotulo} largura="w-[72vw] sm:w-[320px]" itens={outros.map((o) => ({ chave: o.slug, conteudo: <CartaoSegmento segmento={o} cta={d.comum.ver} /> }))} />
        </Reveal>
      </section>
    </>
  );
}
