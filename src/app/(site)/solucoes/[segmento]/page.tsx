import Link from "next/link";
import { notFound } from "next/navigation";
import { metadados } from "../../_config/metadados";
import { Acordeao, Botao, Encerramento, Hero, Lista } from "../../_components/Base";
import Carrossel from "../../_components/Carrossel";
import { CartaoClaro, CartaoSegmento } from "../../_components/Cartoes";
import Passos from "../../_components/Passos";
import Reveal from "../../_components/Reveal";
import { buscarSegmento, contatoSegmento, hrefSegmento, SEGMENTOS } from "../../_content/solucoes";

// Modelo único das páginas de Soluções: o conteúdo vem de _content/solucoes.

export const dynamicParams = false;

export function generateStaticParams() {
  return SEGMENTOS.map((s) => ({ segmento: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ segmento: string }> }) {
  const s = buscarSegmento((await params).segmento);
  return s ? metadados(hrefSegmento(s), s.nome, s.hero.texto) : {};
}

function Migalhas({ nome }: { nome: string }) {
  return (
    <nav aria-label="Você está em">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-white/65">
        <li>
          <Link href="/" className="hover:text-white">Início</Link>
        </li>
        <li aria-hidden>/</li>
        <li>Soluções</li>
        <li aria-hidden>/</li>
        <li aria-current="page" className="text-white">{nome}</li>
      </ol>
    </nav>
  );
}

export default async function PaginaSegmento({ params }: { params: Promise<{ segmento: string }> }) {
  const s = buscarSegmento((await params).segmento);
  if (!s) notFound();
  const contato = contatoSegmento(s);
  const outros = SEGMENTOS.filter((o) => o.slug !== s.slug);

  return (
    <>
      <Hero migalhas={<Migalhas nome={s.nome} />} titulo={s.hero.titulo} texto={s.hero.texto} botoes={<Botao href={contato}>Solicitar demonstração</Botao>} midia={{ foto: s.hero.foto, alt: s.hero.alt }} escurecer="bg-black/45" />

      <section className="secao overflow-hidden">
        <Reveal className="margem mb-10">
          <h2 className="titulo-secao">Como a tecnologia é usada</h2>
        </Reveal>
        <Reveal>
          <Carrossel rotulo={`Como a tecnologia é usada em ${s.nome}`} largura="w-[78vw] sm:w-[340px]" itens={s.usos.map((u) => ({ chave: u.titulo, conteudo: <CartaoClaro {...u} /> }))} />
        </Reveal>
      </section>

      <section className="secao border-t border-linha">
        <div className="margem grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <h2 className="titulo-tela">Como funciona na prática</h2>
            <p className="corpo mt-6 max-w-[30rem]">{s.pratica.texto}</p>
          </Reveal>
          <Passos passos={s.pratica.passos} />
        </div>
      </section>

      <section className="secao overflow-hidden border-t border-linha">
        <Reveal className="margem mb-10">
          <h2 className="titulo-secao">Soluções para outros segmentos</h2>
        </Reveal>
        <Reveal>
          <Carrossel rotulo="Outros segmentos" largura="w-[72vw] sm:w-[320px]" itens={outros.map((o) => ({ chave: o.slug, conteudo: <CartaoSegmento segmento={o} /> }))} />
        </Reveal>
      </section>

      {s.governanca && (
        <section className="secao border-y border-linha bg-painel">
          <div className="margem grid gap-10 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <h2 className="titulo-tela">Governança e responsabilidade.</h2>
              <p className="corpo mt-6">{s.governanca.texto}</p>
            </Reveal>
            <Reveal atraso={120}>
              <Lista itens={s.governanca.itens} />
            </Reveal>
          </div>
        </section>
      )}

      <div className={s.governanca ? "" : "border-t border-linha"}>
        <Acordeao itens={s.faq} />
      </div>
      <Encerramento titulo={s.encerramento.titulo} texto={s.encerramento.texto} cta={s.encerramento.cta} href={contato} />
    </>
  );
}
