import { metadados } from "./_config/metadados";
import { Botao, Cabecalho, Encerramento, Foto, Hero, TelaDividida, TelaFoto, Trio } from "./_components/Base";
import Carrossel from "./_components/Carrossel";
import { CartaoSegmento } from "./_components/Cartoes";
import { SEGMENTOS } from "./_content/solucoes";
import Reveal from "./_components/Reveal";
import VisaoIA from "./_components/VisaoIA";

export const metadata = metadados("/", "Transformamos imagens em inteligência", "Inteligência artificial nas câmeras que você já tem: identificação de pessoas, análise de fluxos e acompanhamento da operação, sem trocar equipamento.");

export default function Inicio() {
  return (
    <>
      <Hero
        sobretitulo="AIP — Agência de Inteligência Patrimonial"
        titulo="Inteligência Patrimonial para gestão e segurança."
        texto="Soluções de inteligência artificial que interpretam o que as câmeras registram e transformam imagens em informações úteis para ambientes públicos e privados."
        botoes={<Botao href="#produtos">Conheça nossos produtos</Botao>}
        midia={{ video: "praca-hero.mp4", poster: "praca-hero.jpg" }}
        sobreposicao={<VisaoIA />}
        escurecer="bg-black/50"
      />

      <TelaDividida
        titulo="Suas câmeras podem fazer mais."
        texto="Imagens registram pessoas, veículos, acessos e movimentações. Com inteligência artificial, esses registros podem ser interpretados e convertidos em informações úteis. A AIP conecta monitoramento, análise visual e inteligência em uma única solução."
        visual={<Foto src="camera-poste.jpg" alt="Câmera de monitoramento instalada em um poste" className="aspect-[4/5] lg:aspect-[5/6]" />}
      />

      <section id="produtos" className="pb-16 pt-8">
        <div className="margem">
          <Cabecalho titulo="Inteligência aplicada ao seu ambiente." />
        </div>
      </section>
      <TelaFoto rotulo="Produto" foto="via-noite.jpg" alt="Avenida com trânsito à noite vista do alto" titulo="Câmeras IA" texto="Inteligência artificial aplicada às câmeras que você já tem ou a uma nova estrutura planejada com a AIP, para identificar movimentações, analisar fluxos, localizar registros e acompanhar sua operação." acao={<Botao href="/cameras-ia">Conheça as Câmeras IA</Botao>} />
      <TelaFoto rotulo="Produto" foto="camera-solar.jpg" alt="Câmera com painel solar no alto de um poste, sob o céu" titulo="Totem IA" texto="Uma estrutura integrada de monitoramento inteligente para ampliar a cobertura em locais públicos e privados." acao={<Botao href="/totem-ia">Conheça o Totem IA</Botao>} />

      <section className="secao overflow-hidden">
        <div className="margem mb-10">
          <Cabecalho titulo="Diferentes ambientes. Novas possibilidades." />
        </div>
        <Reveal>
          <Carrossel rotulo="Soluções por segmento" largura="w-[78vw] sm:w-[360px]" itens={SEGMENTOS.map((s) => ({ chave: s.slug, conteudo: <CartaoSegmento segmento={s} linha={s.linhaCartao} cta="Ver solução" fotoDoHero /> }))} />
        </Reveal>
      </section>

      <section className="secao border-t border-linha">
        <div className="margem">
          <Cabecalho titulo="Visão computacional aplicada à realidade." texto="Nossa tecnologia utiliza inteligência artificial para detectar, rastrear, contar e interpretar elementos presentes nas imagens." />
          <div className="mt-16">
            <Trio
              colunas={[
                { titulo: "Detectar", texto: "Uma rede neural localiza as pessoas em cada quadro analisado." },
                { titulo: "Rastrear", texto: "Um algoritmo mantém a identidade de cada pessoa ao longo do trajeto." },
                { titulo: "Interpretar", texto: "Linhas e zonas transformam trajetórias em eventos e indicadores." },
              ]}
            />
          </div>
          <Reveal className="mt-14">
            <Botao href="/tecnologia" contorno>Conheça nossa tecnologia</Botao>
          </Reveal>
        </div>
      </section>

      <Encerramento titulo="Descubra novas possibilidades para suas câmeras." texto="Conheça as soluções da AIP." cta="Fale com nossa equipe" href="/contato" />
    </>
  );
}
