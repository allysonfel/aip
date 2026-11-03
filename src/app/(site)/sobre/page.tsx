import { metadados } from "../_config/metadados";
import { Hero } from "../_components/Base";
import Reveal from "../_components/Reveal";

export const metadata = metadados("/sobre", "Sobre", "A AIP desenvolve soluções de inteligência artificial e visão computacional para transformar imagens em informações úteis.");

function Frase({ rotulo, texto }: { rotulo: string; texto: string }) {
  return (
    <section className="flex min-h-[85svh] items-center border-t border-linha py-24">
      <Reveal className="margem">
        <h2 className="rotulo mb-6">{rotulo}</h2>
        <p className="titulo-tela max-w-[64rem]">{texto}</p>
      </Reveal>
    </section>
  );
}

export default function Sobre() {
  return (
    <>
      <Hero titulo="Toda imagem carrega informações." texto="A AIP desenvolve soluções de inteligência artificial e visão computacional para transformar imagens em informações úteis para a proteção, compreensão e melhoria de ambientes e operações." midia={{ foto: "cidade-aerea.jpg", alt: "Ruas de uma cidade à noite, vistas do alto" }} escurecer="bg-black/45" />

      <section className="secao">
        <Reveal className="margem">
          <h2 className="rotulo mb-6">Nossa atuação</h2>
          <p className="max-w-[60rem] text-2xl font-light leading-snug md:text-4xl">Atuamos com soluções voltadas à segurança, inteligência operacional e gestão de espaços privados e públicos. Com visão computacional, imagens podem ser interpretadas, organizadas e transformadas em indicadores, registros e informações relevantes.</p>
        </Reveal>
      </section>

      <Frase rotulo="Missão" texto="Transformar imagens em inteligência aplicável à segurança, à operação e à tomada de decisão." />
      <Frase rotulo="Visão" texto="Contribuir para um cenário em que imagens não sejam apenas armazenadas, mas também compreendidas e utilizadas para gerar conhecimento." />

      <section className="secao border-t border-linha">
        <div className="margem">
          <h2 className="rotulo mb-12">Princípios</h2>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[["Precisão", "Informações confiáveis."], ["Discrição", "Tecnologia aplicada de forma adequada."], ["Responsabilidade", "Respeito à privacidade e ao controle dos dados."], ["Aplicabilidade", "Soluções voltadas a problemas reais."]].map(([t, d], i) => (
              <Reveal key={t} atraso={i * 80}>
                <h3 className="font-titulo text-4xl font-semibold">{t}</h3>
                <p className="corpo mt-3">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="secao border-t border-linha">
        <div className="margem grid gap-12 md:grid-cols-2 md:gap-20">
          <Reveal>
            <h2 className="rotulo mb-5">Presença</h2>
            <p className="text-2xl font-light leading-snug">Atendimento a projetos em todo o Brasil, com implantação presencial e suporte remoto conforme as necessidades.</p>
          </Reveal>
          <Reveal atraso={120}>
            <h2 className="rotulo mb-5">Ecossistema</h2>
            <p className="text-2xl font-light leading-snug">A AIP integra o ecossistema Logos Company, mantendo identidade e atuação especializadas em inteligência patrimonial e visão computacional.</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
