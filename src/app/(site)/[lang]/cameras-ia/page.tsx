import type { ReactNode } from "react";
import { metadados } from "../../_config/metadados";
import { Acordeao, Botao, Cabecalho, Encerramento, Hero } from "../../_components/Base";
import Calculadora from "../../_components/Calculadora";
import Carrossel from "../../_components/Carrossel";
import { CartaoSegmento } from "../../_components/Cartoes";
import ComoFunciona from "../../_components/ComoFunciona";
import Reveal from "../../_components/Reveal";
import { segmentos } from "../../_content/solucoes";
import { f } from "../../_i18n/dicionario";
import { LOCALE } from "../../_i18n/idiomas";
import Link from "../../_i18n/LinkI";
import { i18n } from "../../_i18n/servidor";
import { faixaPreco } from "../../_config/economia";

export async function generateMetadata() {
  const { idioma, d } = await i18n();
  return metadados(idioma, "/cameras-ia", d.meta.cameras.titulo, d.meta.cameras.descricao);
}

const CONTATO = "/contato?produto=cameras-ia";

// Ícones em linha fina dos destaques da economia.
const ICONES: Record<string, ReactNode> = {
  obra: <path d="M4 20h16 M6 20V10l6-5 6 5v10 M10 20v-5h4v5 M3 3l18 18" />,
  cabo: <path d="M4 12h5 M15 12h5 M9 9v6 M15 9v6 M9 12h6 M3 3l18 18" />,
  rapido: <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" />,
};

function Destaques({ itens }: { itens: [keyof typeof ICONES, string][] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-3">
      {itens.map(([icone, texto], i) => (
        <li key={texto}>
          <Reveal atraso={i * 90} className="flex items-center gap-4 border-t border-white/10 pt-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-[#5FD3FF]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {ICONES[icone]}
              </svg>
            </span>
            <span className="font-medium text-white/90">{texto}</span>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

export default async function CamerasIA() {
  const { idioma, d } = await i18n();
  const t = d.cameras;
  const preco = faixaPreco(idioma);
  const moeda = (v: number) => new Intl.NumberFormat(LOCALE[idioma], { style: "currency", currency: preco.moeda, maximumFractionDigits: 0 }).format(v);
  const FAQ = t.faq.map((q) => ({
    p: q.p,
    r:
      "link" in q && q.link ? (
        <p>
          {q.r}{" "}
          <Link href={CONTATO} className="text-white underline underline-offset-4 hover:text-[#5FD3FF]">
            {q.link}
          </Link>
        </p>
      ) : (
        q.r
      ),
  }));
  return (
    <>
      {/* 1. Hero */}
      <Hero
        titulo={t.heroTitulo}
        texto={t.heroTexto}
        botoes={<Botao href={CONTATO}>{d.comum.solicitarDemonstracao}</Botao>}
        midia={{ foto: "camera-ia-lente-limpa.jpg", alt: t.heroAlt, foco: "72% 50%" }}
      />

      {/* 2. Como funciona */}
      <section className="secao">
        <div className="margem">
          <Cabecalho titulo={t.comoFuncionaTitulo} />
          <ComoFunciona />
        </div>
      </section>

      {/* 3. Investimento e economia */}
      <section className="secao border-t border-linha">
        <div className="margem grid items-start gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-32">
            <p className="rotulo mb-4">{t.economiaRotulo}</p>
            <h2 className="titulo-secao">{t.economiaTitulo}</h2>
            <p className="corpo mt-6">
              {f(t.economiaTexto, { min: moeda(preco.minimo), max: moeda(preco.maximo) })}
            </p>
            <div className="mt-8">
              <Botao href={CONTATO}>{t.economiaBotao}</Botao>
            </div>
          </Reveal>
          <Reveal atraso={120}>
            <Calculadora />
            <p className="mt-4 text-xs leading-relaxed text-white/55">
              {t.economiaNota}
              {idioma !== "pt" && ` ${d.comum.notaMoeda}`}
            </p>
          </Reveal>
        </div>
        <div className="margem mt-16">
          <Destaques itens={[["obra", t.destaques[0]], ["cabo", t.destaques[1]], ["rapido", t.destaques[2]]]} />
        </div>
      </section>

      {/* 4. Soluções para cada segmento */}
      <section className="secao overflow-hidden border-t border-linha">
        <div className="margem mb-10">
          <Cabecalho titulo={t.segmentosTitulo} texto={t.segmentosTexto} />
        </div>
        <Reveal>
          <Carrossel rotulo={d.comum.solucoesPorSegmento} largura="w-[78vw] sm:w-[360px]" itens={segmentos(idioma).map((s) => ({ chave: s.slug, conteudo: <CartaoSegmento segmento={s} linha={s.linhaCartao} cta={d.comum.verSolucao} /> }))} />
        </Reveal>
      </section>

      {/* 5. Perguntas frequentes */}
      <div className="border-t border-linha">
        <Acordeao titulo={d.comum.perguntasFrequentes} itens={FAQ} />
      </div>

      {/* 6. Encerramento */}
      <Encerramento titulo={t.encerramentoTitulo} cta={d.comum.solicitarDemonstracao} href={CONTATO} />
    </>
  );
}
