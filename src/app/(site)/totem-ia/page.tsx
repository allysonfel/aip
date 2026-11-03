import { metadados } from "../_config/metadados";
import { Acordeao, Botao, Cabecalho, Encerramento, Foto, Legenda, Lista, TelaDividida } from "../_components/Base";
import Carrossel from "../_components/Carrossel";
import { TotemIlustracao } from "../_components/Diagramas";
import Reveal from "../_components/Reveal";

export const metadata = metadados("/totem-ia", "Totem IA", "Monitoramento inteligente para locais que precisam de cobertura adicional ou não possuem infraestrutura convencional.");

const CONTATO = "/contato?produto=totem-ia";

const APLICACOES = [
  { foto: "praca-aerea-2.jpg", alt: "Praça e ruas vistas do alto", titulo: "Espaços públicos", texto: "Monitoramento de praças, parques, áreas de convivência e espaços de circulação." },
  { foto: "via-noite.jpg", alt: "Avenida com trânsito à noite", titulo: "Vias e mobilidade", texto: "Acompanhamento de ruas, cruzamentos, acessos e pontos estratégicos." },
  { foto: "estacionamento-aereo.jpg", alt: "Estacionamento visto do alto", titulo: "Estacionamentos", texto: "Monitoramento de movimentações, entradas, saídas e ocupação." },
  { foto: "evento.jpg", alt: "Grande evento noturno visto do alto", titulo: "Eventos", texto: "Estrutura de monitoramento para locais com grande circulação de pessoas e necessidades temporárias." },
  { foto: "obra.jpg", alt: "Guindaste em uma obra à noite", titulo: "Obras e áreas operacionais", texto: "Acompanhamento de ambientes que exigem cobertura durante períodos específicos." },
  { foto: "condominio.jpg", alt: "Prédios residenciais à noite", titulo: "Condomínios e empreendimentos", texto: "Monitoramento de acessos, áreas externas e pontos de circulação." },
];

const ETAPAS = [
  { titulo: "Captura", texto: "As câmeras registram imagens do ambiente." },
  { titulo: "Processamento", texto: "A inteligência artificial interpreta as imagens conforme as aplicações configuradas." },
  { titulo: "Identificação", texto: "Informações e eventos relevantes são identificados." },
  { titulo: "Acompanhamento", texto: "Os dados podem ser encaminhados à plataforma AIP." },
];

const FAQ = [
  { p: "O Totem substitui uma instalação convencional?", r: "Pode reduzir a necessidade de infraestrutura convencional em determinadas aplicações. A viabilidade depende das condições do local." },
  { p: "Como funciona a conexão?", r: "As opções de conectividade são definidas conforme a disponibilidade e os requisitos do projeto." },
  { p: "Onde as imagens são processadas?", r: "O processamento e a transferência de dados dependem da configuração técnica e dos equipamentos utilizados." },
  { p: "Pode ser utilizado temporariamente?", r: "Aplicações temporárias, como eventos e obras, podem ser avaliadas conforme as condições de instalação." },
  { p: "Quais recursos estão disponíveis?", r: "Os recursos são definidos conforme os equipamentos e as aplicações contratadas." },
];

export default function TotemIA() {
  return (
    <>
      <section className="relative isolate flex min-h-svh items-center overflow-hidden pb-14 pt-28">
        <div className="margem grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div className="order-2 lg:order-1">
            <h1 className="titulo-hero">Segurança inteligente em qualquer lugar.</h1>
            <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-white/80">Monitoramento inteligente para locais que precisam de cobertura adicional ou não possuem infraestrutura convencional.</p>
            <div className="mt-8">
              <Botao href="#aplicacao">Conheça a solução</Botao>
            </div>
          </div>
          <figure className="order-1 mx-auto w-full max-w-[20rem] lg:order-2 lg:max-w-[28rem]">
            <TotemIlustracao className="w-full" />
            <figcaption className="text-center">
              <Legenda />
            </figcaption>
          </figure>
        </div>
      </section>

      <TelaDividida
        id="aplicacao"
        titulo="Monitoramento em locais que exigem uma estrutura diferente."
        texto="O Totem IA foi desenvolvido para ampliar a capacidade de monitoramento em ambientes nos quais a instalação convencional pode ser limitada ou complexa. Sua estrutura integrada reúne câmeras, processamento e conectividade em uma solução definida conforme as necessidades do local."
        visual={<Foto src="praca-aerea.jpg" alt="Parque urbano e rotatória vistos do alto" className="aspect-[4/3]" />}
      />

      <section className="secao overflow-hidden border-t border-linha">
        <div className="margem mb-12">
          <Cabecalho titulo="Uma estrutura para diferentes cenários." />
        </div>
        <Reveal>
          <Carrossel cartoes={APLICACOES} rotulo="Aplicações do Totem IA" />
        </Reveal>
      </section>

      <TelaDividida
        titulo="Mais do que captar imagens."
        texto="Conforme a configuração de cada projeto, o Totem IA pode incorporar:"
        lado="direita"
        visual={<Foto src="camera-poste-2.jpg" alt="Conjunto de câmeras de monitoramento em um poste" className="aspect-[4/5]" />}
      >
        <Lista
          itens={[
            "Câmeras integradas",
            "Contagem de pessoas",
            "Monitoramento de áreas e movimentações",
            <>Identificação de entrada em áreas restritas <span className="text-sm text-cinza">· sob projeto</span></>,
            <>Leitura de placas veiculares (LPR) <span className="text-sm text-cinza">· sob projeto</span></>,
            <>Geração e encaminhamento de alertas <span className="text-sm text-cinza">· sob projeto</span></>,
            "Integração com a plataforma AIP",
          ]}
        />
        <p className="mt-5 text-sm text-cinza">A disponibilidade depende dos equipamentos, das condições do ambiente e do escopo contratado.</p>
      </TelaDividida>

      <section className="secao border-t border-linha">
        <div className="margem">
          <Cabecalho titulo="Da captura ao acompanhamento." />
          <ol className="mt-16 grid gap-10 md:grid-cols-4 md:gap-0">
            {ETAPAS.map((e, i) => (
              <li key={e.titulo}>
                <Reveal atraso={i * 100} className="flex gap-5 md:block md:pr-8">
                  <div className="flex shrink-0 items-center md:mb-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 font-titulo text-xl font-semibold">{i + 1}</span>
                    <span aria-hidden className="ml-3 hidden h-px flex-1 bg-linha md:block" />
                  </div>
                  <div>
                    <h3 className="titulo-coluna">{e.titulo}</h3>
                    <p className="corpo mt-2">{e.texto}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="secao border-t border-linha">
        <div className="margem">
          <Cabecalho titulo="Cada ambiente exige uma configuração." texto="O projeto considera:" />
          <Reveal className="mt-8">
            <Lista colunas itens={["Quantidade e tipo de câmeras", "Altura e posicionamento dos equipamentos", "Capacidade de processamento", "Fonte de energia", "Conectividade disponível", "Condições ambientais", "Recursos de inteligência necessários"]} />
            <p className="corpo mt-8 max-w-[44rem]">Alimentação elétrica, conectividade, instalação e modelo de contratação são definidos conforme o projeto.</p>
            <div className="mt-8">
              <Botao href={CONTATO} contorno>Solicitar avaliação técnica</Botao>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="border-t border-linha">
        <Acordeao itens={FAQ} />
      </div>
      <Encerramento titulo="Leve inteligência a novos pontos de monitoramento." cta="Conversar sobre meu projeto" href={CONTATO} />
    </>
  );
}
