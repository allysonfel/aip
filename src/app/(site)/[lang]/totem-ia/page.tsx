import Image from "next/image";
import { metadados } from "../../_config/metadados";
import { Acordeao, Botao, Cabecalho, Encerramento } from "../../_components/Base";
import Carrossel from "../../_components/Carrossel";
import { CartaoFoto } from "../../_components/Cartoes";
import FotoEntra from "../../_components/FotoEntra";
import Reveal from "../../_components/Reveal";
import VisualCentral, { type TipoCentral } from "../../_components/CentralVisuais";
import TotemPorDentro, { type EtapaTotem } from "../../_components/TotemPorDentro";
import { i18n } from "../../_i18n/servidor";

export async function generateMetadata() {
  const { idioma, d } = await i18n();
  return metadados(idioma, "/totem-ia", d.meta.totem.titulo, d.meta.totem.descricao);
}

const CONTATO = "/contato?produto=totem-ia";
const M = "/site/media";

// Fotos e posições medidas em cada foto (em % da imagem); os textos vêm do dicionário (totem.etapas).
type Alt = "altFrente" | "altTopo" | "altTresQuartos" | "altLateral";
const ETAPAS_BASE: (Omit<EtapaTotem, "titulo" | "texto" | "alt"> & { alt: Alt })[] = [
  { foto: "totem-topo.jpg", alt: "altTopo", alvos: [{ x: 50.5, y: 24, w: 30, h: 17 }] },
  { foto: "totem-topo.jpg", alt: "altTopo", alvos: [{ x: 22, y: 49.5, w: 26, h: 13 }, { x: 78.5, y: 49.5, w: 26, h: 13 }] },
  { foto: "totem-frente.jpg", alt: "altFrente", alvos: [{ x: 43, y: 16, w: 9, h: 6 }, { x: 56.5, y: 16.2, w: 9, h: 6 }], zoom: 1.12 },
  { foto: "totem-tres-quartos.jpg", alt: "altTresQuartos", alvos: [{ x: 42, y: 16.8, w: 8, h: 5.5 }, { x: 58.5, y: 16.8, w: 7, h: 5.5 }], zoom: 1.12 },
  { foto: "totem-lateral.jpg", alt: "altLateral", alvos: [{ x: 46.3, y: 57, w: 5, h: 45, caixa: true }] },
  { foto: "totem-tres-quartos.jpg", alt: "altTresQuartos", alvos: [{ x: 50.3, y: 48, w: 25, h: 90, caixa: true }], zoom: 1 },
];

const CENTRAL_VISUAIS: TipoCentral[] = ["relogio", "agentes", "integracao"];
const APLICACOES_FOTOS = ["cenario-espacos-publicos.jpg", "cenario-vias.jpg", "cenario-eventos.jpg", "cenario-obras.jpg", "cenario-condominios.jpg"];

export default async function TotemIA() {
  const { d } = await i18n();
  const t = d.totem;
  const ALT_FRENTE = t.altFrente;
  const ETAPAS: EtapaTotem[] = ETAPAS_BASE.map((e, i) => ({ ...e, alt: t[e.alt], titulo: t.etapas[i].titulo, texto: t.etapas[i].texto }));
  const CENTRAL = t.central.map((c, i) => ({ ...c, visual: CENTRAL_VISUAIS[i] }));
  const APLICACOES = t.aplicacoes.map((a, i) => ({ ...a, foto: APLICACOES_FOTOS[i] }));
  return (
    <>
      {/* 1. Hero: texto à esquerda, totem à direita sobre o fundo preto. */}
      <section className="relative isolate overflow-hidden pb-16 pt-24 lg:flex lg:min-h-[calc(var(--vh-fixo,1svh)*100)] lg:items-center lg:py-0">
        <div className="margem grid items-center gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          <div className="order-2 lg:order-1">
            <h1 className="entra-1 titulo-hero">{t.heroTitulo}</h1>
            <p className="entra-2 mt-6 max-w-[36rem] text-lg leading-relaxed text-white/80">{t.heroTexto}</p>
          </div>
          <div className="relative order-1 mx-auto aspect-[4/5] h-[calc(var(--vh-fixo,1svh)*52)] max-h-[30rem] funde-preto-leve lg:order-2 lg:h-[calc(var(--vh-fixo,1svh)*88)] lg:max-h-[56rem]">
            <FotoEntra src={`${M}/totem-frente.jpg`} alt={ALT_FRENTE} fill priority sizes="(min-width: 1024px) 45vw, 80vw" quality={85} className="object-contain" />
          </div>
        </div>
      </section>

      {/* 2. O totem por dentro */}
      <TotemPorDentro id="por-dentro" titulo={t.porDentroTitulo} etapas={ETAPAS} fotoFixa={{ src: "totem-frente.jpg", alt: ALT_FRENTE }} />

      {/* 3. Feito para resistir ao tempo: foto em tela cheia no desktop; no celular, foto em cima e texto embaixo. */}
      <section className="relative isolate border-t border-linha lg:flex lg:min-h-[calc(var(--vh-fixo,1svh)*100)] lg:items-center lg:overflow-hidden lg:border-0">
        <div className="relative aspect-[4/3] w-full lg:absolute lg:inset-0 lg:-z-20 lg:aspect-auto">
          <Image src={`${M}/totem-chuva.jpg`} alt={t.tempoAlt} fill sizes="100vw" quality={85} style={{ objectPosition: "68% 50%" }} className="object-cover" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent lg:hidden" />
        </div>
        <div aria-hidden className="absolute inset-y-0 left-0 -z-10 hidden w-[45%] bg-gradient-to-r from-black/85 via-black/55 via-50% to-transparent lg:block" />
        <Reveal className="margem pb-20 pt-8 lg:py-28">
          <div className="max-w-[34rem] lg:[text-shadow:0_1px_2px_rgb(0_0_0/0.55),0_2px_24px_rgb(0_0_0/0.6)]">
            <h2 className="titulo-tela">{t.tempoTitulo}</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/85">{t.tempoTexto}</p>
            <div className="mt-8">
              <Botao href={CONTATO}>{t.tempoBotao}</Botao>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 4. Central AIP 24 horas: foto inteira e o texto num bloco embaixo dela. */}
      <section className="relative">
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:max-h-[calc(var(--vh-fixo,1svh)*92)] lg:min-h-[32rem]">
          <Image src={`${M}/central-24h.jpg`} alt={t.centralAlt} fill sizes="100vw" quality={85} style={{ objectPosition: "50% 40%" }} className="object-cover" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>
        <div className="margem relative -mt-6 pb-24 sm:-mt-10 lg:pb-32">
          <Reveal className="max-w-[52rem]">
            <p className="rotulo mb-4">{t.centralRotulo}</p>
            <h2 className="titulo-tela">{t.centralTitulo}</h2>
            <p className="corpo mt-6 text-lg">{t.centralTexto}</p>
          </Reveal>
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {CENTRAL.map((d, i) => (
              <li key={d.titulo}>
                <Reveal atraso={i * 90} className="h-full rounded-2xl border border-white/10 bg-[#111214] p-6 sm:p-7">
                  <VisualCentral tipo={d.visual} />
                  <p className="mt-6 font-titulo text-sm font-medium tracking-[0.18em] text-white/45">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-titulo text-[1.625rem] font-bold leading-[1.05]">{d.titulo}</h3>
                  <p className="mt-2 leading-snug text-white/65">{d.texto}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Cenários */}
      <section className="secao overflow-hidden border-t border-linha">
        <div className="margem mb-12">
          <Cabecalho titulo={t.cenariosTitulo} />
        </div>
        <Reveal>
          <Carrossel rotulo={t.cenariosRotulo} itens={APLICACOES.map((a) => ({ chave: a.titulo, conteudo: <CartaoFoto {...a} /> }))} />
        </Reveal>
      </section>

      {/* 6. Perguntas frequentes */}
      <div className="border-t border-linha">
        <Acordeao titulo={d.comum.perguntasFrequentes} itens={t.faq} />
      </div>

      {/* 7. Encerramento */}
      <Encerramento titulo={t.encerramentoTitulo} cta={t.encerramentoBotao} href={CONTATO} />
    </>
  );
}
