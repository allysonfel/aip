import type { Metadata } from "next";
import { Botao, Cabecalho, Encerramento, Hero, TelaDividida, TelaFoto } from "../_components/Base";
import Carrossel from "../_components/Carrossel";
import { CartaoSegmento } from "../_components/Cartoes";
import Reveal from "../_components/Reveal";
import VideoSecao from "../_components/VideoSecao";
import { metadados } from "../_config/metadados";
import { segmentos } from "../_content/solucoes";
import { i18n } from "../_i18n/servidor";

// Prévia de compartilhamento (WhatsApp, Instagram, LinkedIn, Google): posicionamento
// amplo da AIP, com a imagem de texto traduzido em cada idioma.
const IMAGEM = { pt: "https://aipbrasil.com/og-aip.jpg", en: "https://aipbrasil.com/og-aip-en.jpg", ru: "https://aipbrasil.com/og-aip-ru.jpg" };

export async function generateMetadata(): Promise<Metadata> {
  const { idioma, d } = await i18n();
  const m = d.meta.inicio;
  return metadados(idioma, "/", m.titulo, m.descricao, { tituloAbsoluto: true, imagem: { url: IMAGEM[idioma], width: 1200, height: 630, alt: m.imagemAlt } });
}

export default async function Inicio() {
  const { idioma, d } = await i18n();
  const t = d.inicio;
  return (
    <>
      <Hero
        titulo={t.heroTitulo}
        texto={t.heroTexto}
        botoes={<Botao href="/contato">{t.heroBotao}</Botao>}
        midia={{
          poster: "hero-inicio.jpg",
          fontes: [
            { src: "hero-inicio-av1-720.webm", tipo: 'video/webm; codecs="av01.0.08M.10"', celular: true },
            { src: "hero-inicio-av1.webm", tipo: 'video/webm; codecs="av01.0.09M.10"' },
            { src: "hero-inicio-hevc-720.mp4", tipo: 'video/mp4; codecs="hvc1.1.6.L120.90"', celular: true },
            { src: "hero-inicio-hevc.mp4", tipo: 'video/mp4; codecs="hvc1.1.6.L123.90"' },
          ],
          video: "hero-inicio-720.mp4",
        }}
        pelicula={0.08}
        fundoForte
      />

      <TelaDividida
        titulo={t.maisTitulo}
        texto={t.maisTexto}
        visual={
          <VideoSecao
            rotulo={t.videoRotulo}
            poster="/site/media/cameras-mais-v2.jpg"
            fontes={[
              { src: "/site/media/cameras-mais-v2-celular.webm", tipo: 'video/webm; codecs="av01.0.09M.10"', celular: true },
              { src: "/site/media/cameras-mais-v2.webm", tipo: 'video/webm; codecs="av01.0.09M.10"' },
              { src: "/site/media/cameras-mais-v2-celular.mp4", tipo: "video/mp4", celular: true },
              { src: "/site/media/cameras-mais-v2.mp4", tipo: "video/mp4" },
            ]}
          />
        }
      />

      <TelaFoto rotulo={d.comum.produto} foto="camera-ia-lente-limpa.jpg" original lateral foco="72% 50%" alt={t.camerasAlt} titulo={d.produtos.cameras.nome} texto={t.camerasTexto} acao={<Botao href="/cameras-ia">{t.camerasBotao}</Botao>} />
      <TelaFoto rotulo={d.comum.produto} foto="totem-aip.jpg" original alt={t.totemAlt} titulo={d.produtos.totem.nome} texto={t.totemTexto} acao={<Botao href="/totem-ia">{t.totemBotao}</Botao>} />

      <section id="solucoes" className="secao scroll-mt-24 overflow-hidden">
        <div className="margem mb-10">
          <Cabecalho titulo={t.segmentosTitulo} />
        </div>
        <Reveal>
          <Carrossel rotulo={d.comum.solucoesPorSegmento} largura="w-[78vw] sm:w-[360px]" itens={segmentos(idioma).map((s) => ({ chave: s.slug, conteudo: <CartaoSegmento segmento={s} linha={s.linhaCartao} cta={d.comum.verSolucao} /> }))} />
        </Reveal>
      </section>

      <Encerramento titulo={t.encerramentoTitulo} texto={t.encerramentoTexto} cta={t.encerramentoBotao} href="/contato" />
    </>
  );
}
