import { metadados } from "./_config/metadados";
import { Botao, Cabecalho, Encerramento, Hero, TelaDividida, TelaFoto } from "./_components/Base";
import Carrossel from "./_components/Carrossel";
import { CartaoSegmento } from "./_components/Cartoes";
import { SEGMENTOS } from "./_content/solucoes";
import Reveal from "./_components/Reveal";
import VideoSecao from "./_components/VideoSecao";

export const metadata = metadados("/", "Transformamos imagens em inteligência", "Inteligência artificial nas câmeras que você já tem: identificação de pessoas, análise de fluxos e acompanhamento da operação, sem trocar equipamento.");

export default function Inicio() {
  return (
    <>
      <Hero
        titulo="Inteligência Patrimonial para gestão e segurança."
        texto="Soluções de inteligência artificial que interpretam o que as câmeras registram e transformam imagens em informações úteis para ambientes públicos e privados."
        botoes={<Botao href="/contato">Solicitar uma consulta</Botao>}
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
        titulo="Suas câmeras podem fazer mais."
        texto="Imagens registram pessoas, veículos, acessos e movimentações. Com inteligência artificial, esses registros podem ser interpretados e convertidos em informações úteis. A AIP conecta monitoramento, análise visual e inteligência em uma única solução."
        visual={
          <VideoSecao
            rotulo="Vídeo da AIP apresentando as Câmeras IA: análise de vídeo, contagem de pessoas e horários de maior movimento"
            poster="/site/media/cameras-mais.jpg"
            fontes={[
              { src: "/site/media/cameras-mais-celular.webm", tipo: 'video/webm; codecs="av01.0.09M.10"', celular: true },
              { src: "/site/media/cameras-mais.webm", tipo: 'video/webm; codecs="av01.0.09M.10"' },
              { src: "/site/media/cameras-mais-celular.mp4", tipo: "video/mp4", celular: true },
              { src: "/site/media/cameras-mais.mp4", tipo: "video/mp4" },
            ]}
          />
        }
      />

      <TelaFoto rotulo="Produto" foto="camera-ia-lente-limpa.jpg" original lateral foco="72% 50%" alt="Lente de uma câmera de segurança refletindo uma via com pessoas e veículos marcados pela inteligência artificial" titulo="Câmeras IA" texto="Inteligência artificial aplicada às câmeras que você já tem ou a uma nova estrutura planejada com a AIP, para identificar movimentações, analisar fluxos, localizar registros e acompanhar sua operação." acao={<Botao href="/cameras-ia">Conheça as Câmeras IA</Botao>} />
      <TelaFoto rotulo="Produto" foto="totem-aip.jpg" original alt="Totem IA da AIP instalado em frente a um prédio comercial" titulo="Totem IA" texto="Uma estrutura integrada de monitoramento inteligente para ampliar a cobertura em locais públicos e privados." acao={<Botao href="/totem-ia">Conheça o Totem IA</Botao>} />

      <section className="secao overflow-hidden">
        <div className="margem mb-10">
          <Cabecalho titulo="Diferentes ambientes. Novas possibilidades." />
        </div>
        <Reveal>
          <Carrossel rotulo="Soluções por segmento" largura="w-[78vw] sm:w-[360px]" itens={SEGMENTOS.map((s) => ({ chave: s.slug, conteudo: <CartaoSegmento segmento={s} linha={s.linhaCartao} cta="Ver solução" /> }))} />
        </Reveal>
      </section>


      <Encerramento titulo="Descubra novas possibilidades para suas câmeras." texto="Conheça as soluções da AIP." cta="Fale com nossa equipe" href="/contato" />
    </>
  );
}
