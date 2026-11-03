import { metadados } from "../_config/metadados";
import { Botao, Cabecalho, Encerramento, Foto, Hero, Lista, TelaDividida } from "../_components/Base";
import Reveal from "../_components/Reveal";

export const metadata = metadados("/empresas", "Empresas", "Utilize suas câmeras para compreender melhor a circulação, a ocupação e as movimentações do seu negócio.");

const CONTATO = "/contato?tipo=empresa";

const SEGMENTOS = [
  { titulo: "Shopping centers e varejo", foto: "shopping.jpg", alt: "Escadas rolantes no interior de um shopping", itens: ["Fluxo de pessoas por entrada e corredor", "Horários de maior circulação", "Mapas de calor e rotas", "Identificação de áreas pouco utilizadas", "Apoio à distribuição de equipes e organização dos espaços", "Busca visual de registros"] },
  { titulo: "Indústria e logística", foto: "armazem.jpg", alt: "Corredor de prateleiras em um armazém", itens: ["Contagem e acompanhamento de pessoas", "Monitoramento de câmeras", "Identificação de movimentações em áreas restritas, conforme projeto", "Aplicações envolvendo veículos, conforme projeto", "Indicadores de circulação"] },
  { titulo: "Condomínios e edifícios empresariais", foto: "condominio.jpg", alt: "Prédios residenciais à noite", itens: ["Acompanhamento de áreas comuns", "Indicadores de ocupação", "Monitoramento de câmeras", "Leitura de placas e alertas em áreas restritas, conforme projeto", "Controle de acesso à plataforma"] },
  { titulo: "Estacionamentos", foto: "estacionamento.jpg", alt: "Estacionamento subterrâneo vazio", itens: ["Fluxo de entrada e saída", "Indicadores de ocupação", "Análise de movimentações por período", "Leitura de placas, conforme projeto"] },
];

const COMPARATIVO = [
  ["Revisão manual de gravações", "Busca visual de registros"],
  ["Falhas percebidas tardiamente", "Identificação de problemas nas câmeras"],
  ["Estimativa de movimentação", "Indicadores de fluxo e ocupação"],
  ["Análise visual limitada", "Mapas de calor e rotas"],
  ["Relatórios manuais", "Consultas aos dados disponíveis"],
];

export default function Empresas() {
  return (
    <>
      <Hero titulo="Da segurança à inteligência operacional." texto="Utilize suas câmeras para compreender melhor a circulação, a ocupação e as movimentações do seu negócio." botoes={<Botao href="#segmentos">Conheça as aplicações</Botao>} midia={{ foto: "estacionamento-aereo.jpg", alt: "Estacionamento visto do alto" }} escurecer="bg-black/45" />

      <section className="secao">
        <div className="margem">
          <Cabecalho titulo="Suas câmeras registram mais do que acontecimentos." texto="Entradas, saídas, circulação de pessoas e utilização dos espaços geram informações que podem apoiar a segurança e a gestão. A AIP transforma esses registros em dados visuais organizados e acessíveis." />
        </div>
      </section>

      <div id="segmentos" className="border-t border-linha">
        {SEGMENTOS.map((s, i) => (
          <TelaDividida key={s.titulo} titulo={s.titulo} lado={i % 2 ? "direita" : "esquerda"} visual={<Foto src={s.foto} alt={s.alt} className="aspect-[4/3]" />}>
            <Lista itens={s.itens} />
          </TelaDividida>
        ))}
      </div>

      <section className="secao border-t border-linha">
        <div className="margem">
          <Cabecalho titulo="De registros isolados a informações organizadas." />
          <Reveal className="mt-14">
            <div className="grid grid-cols-2 gap-4 border-b border-linha pb-4 md:gap-12">
              <p className="rotulo">Convencional</p>
              <p className="rotulo text-white">Com a AIP</p>
            </div>
            <ul>
              {COMPARATIVO.map(([antes, depois]) => (
                <li key={antes} className="grid grid-cols-2 gap-4 border-b border-linha py-6 md:gap-12">
                  <span className="leading-snug text-cinza md:text-xl">{antes}</span>
                  <span className="font-titulo text-xl font-semibold leading-tight md:text-3xl">{depois}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <Encerramento titulo="Sua estrutura de câmeras pode oferecer mais informações para o negócio." cta="Solicitar demonstração" href={CONTATO} />
    </>
  );
}
