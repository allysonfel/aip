import Image from "next/image";
import { metadados } from "../../_config/metadados";
import { Botao, Hero } from "../../_components/Base";
import Reveal from "../../_components/Reveal";
import { LinhaDoTempo, Manifesto, MapaMundi, Principios, VisualDestaque } from "../../_components/SobreAnimacoes";
import { i18n } from "../../_i18n/servidor";

const VISUAIS = ["globo", "paises", "bandeira"] as const;

export async function generateMetadata() {
  const { idioma, d } = await i18n();
  return metadados(idioma, "/sobre", d.meta.sobre.titulo, d.meta.sobre.descricao);
}

export default async function Sobre() {
  const { d } = await i18n();
  const t = d.sobre;
  const DESTAQUES = t.destaques.map((x, i) => ({ ...x, visual: VISUAIS[i] }));
  return (
    <>
      {/* 1. Hero */}
      <Hero sobretitulo={t.rotulo} titulo={t.heroTitulo} texto={t.heroTexto} midia={{ foto: "sobre-central-monitoramento.jpg", alt: t.heroAlt, foco: "72% 50%" }} />

      {/* 2. Inovação com raiz brasileira */}
      <section className="secao border-t border-linha">
        <div className="margem grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <p className="rotulo mb-4">{t.inovacaoRotulo}</p>
            {/* as palavras acendem conforme a página desce */}
            <Manifesto como="h2" className="titulo-secao" texto={t.inovacaoTitulo} />
            <div className="corpo mt-6 space-y-4">
              {t.inovacaoTextos.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
          <div className="order-1 lg:order-2">
            <MapaMundi />
          </div>
        </div>
        <div className="margem mt-16">
          <ol className="grid gap-4 md:grid-cols-3">
            {DESTAQUES.map((d, i) => (
              <li key={d.titulo}>
                <Reveal atraso={i * 90} className="h-full rounded-2xl border border-white/10 bg-[#111214] p-6 sm:p-7">
                  <VisualDestaque tipo={d.visual} />
                  <p className="mt-6 font-titulo text-sm font-medium tracking-[0.18em] text-white/45">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-titulo text-[1.625rem] font-bold leading-[1.05]">{d.titulo}</h3>
                  <p className="mt-2 leading-snug text-white/65">{d.texto}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Missão, visão e princípios */}
      <section className="secao border-t border-linha">
        <div className="margem">
          <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
            <Reveal>
              <p className="rotulo mb-5">{t.missaoRotulo}</p>
              <p className="titulo-tela">{t.missao}</p>
            </Reveal>
            <Reveal atraso={120} className="lg:pt-12">
              <p className="rotulo mb-5">{t.visaoRotulo}</p>
              <p className="text-2xl font-light leading-snug text-white/85 md:text-3xl">{t.visao}</p>
            </Reveal>
          </div>
          <div className="mt-20">
            <p className="rotulo mb-8">{t.principiosRotulo}</p>
            <Principios itens={t.principios} />
          </div>
        </div>
      </section>

      {/* 6. Como trabalhamos */}
      <section className="secao border-t border-linha">
        <div className="margem">
          <Reveal>
            <h2 className="titulo-secao">{t.etapasTitulo}</h2>
          </Reveal>
          <div className="mt-14">
            <LinhaDoTempo etapas={t.etapas} />
          </div>
        </div>
      </section>

      {/* 7. Compromisso com privacidade */}
      <section className="secao border-t border-linha">
        <div className="margem">
          <Reveal className="flex flex-col gap-8 rounded-2xl border border-white/10 bg-[#0d0e10] p-8 sm:p-12 md:flex-row md:items-start md:gap-12">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/15 text-[#5FD3FF]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <div>
              <h2 className="titulo-secao">{t.privacidadeTitulo}</h2>
              <p className="corpo mt-5 max-w-[48rem] text-lg">{t.privacidadeTexto}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 8. Ecossistema e encerramento */}
      <section className="secao border-t border-linha">
        <div className="margem">
          <Reveal className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
            <a href="https://logoscompany.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <Image src="/site/media/logos-company-simbolo.png" alt="" width={44} height={44} className="h-11 w-11" />
              <span className="text-2xl font-semibold tracking-[-0.01em]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, 'Segoe UI', Roboto, sans-serif" }}>Logos Company</span>
            </a>
            <p className="text-lg text-white/70">{t.ecossistema}</p>
          </Reveal>
          <div className="mt-14 border-t border-white/10 pt-16 text-center">
            <Reveal>
              <h2 className="titulo-tela mx-auto max-w-[48rem]">{t.encerramentoTitulo}</h2>
              <div className="mt-9">
                <Botao href="/contato">{t.encerramentoBotao}</Botao>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
