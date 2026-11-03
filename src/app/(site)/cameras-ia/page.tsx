import { metadados } from "../_config/metadados";
import { Acordeao, Botao, Cabecalho, Encerramento, Hero, Legenda, Lista, TelaDividida } from "../_components/Base";
import MapaCalor from "../_components/MapaCalor";
import MenuAncoras from "../_components/MenuAncoras";
import Reveal from "../_components/Reveal";
import VisaoIA from "../_components/VisaoIA";
import { MockBusca, MockChat, MockMosaico, MockPlanta, MockSaude } from "../_components/mockups";

export const metadata = metadados("/cameras-ia", "Câmeras IA", "Transforme sua estrutura de monitoramento em uma ferramenta de análise, identificação e acompanhamento operacional.");

const CONTATO = "/contato?produto=cameras-ia";

const ANCORAS = [
  { id: "monitoramento", rotulo: "Monitoramento" },
  { id: "fluxo", rotulo: "Fluxo" },
  { id: "busca-visual", rotulo: "Busca visual" },
  { id: "integridade", rotulo: "Integridade" },
  { id: "assistente", rotulo: "Assistente" },
  { id: "sob-projeto", rotulo: "Sob projeto" },
];

const APLICACOES = [
  { titulo: "Localização de pessoas e acontecimentos", texto: "Encontre registros nas imagens utilizando características visuais, como vestimentas e outras informações disponíveis. Os resultados auxiliam a localização e exigem confirmação humana." },
  { titulo: "Acompanhamento de movimentações", texto: "Visualize e acompanhe trajetórias de pessoas nos ambientes monitorados." },
  { titulo: "Análise de fluxo e ocupação", texto: "Entenda horários de maior circulação, áreas mais movimentadas e padrões de utilização dos espaços." },
  { titulo: "Identificação de falhas", texto: "Acompanhe a integridade da estrutura e identifique câmeras offline, sem imagem, desfocadas, escuras ou fora de posição." },
  { titulo: "Acompanhamento de ocorrências", texto: "Visualize múltiplas câmeras em um painel e exporte trechos de vídeo identificados para análise." },
];

const FAQ = [
  { p: "Preciso trocar minhas câmeras atuais?", r: "Não necessariamente. Câmeras existentes podem ser utilizadas quando compatíveis com os requisitos técnicos." },
  { p: "A solução funciona à noite?", r: "O desempenho depende da câmera, iluminação e qualidade das imagens." },
  { p: "A AIP utiliza reconhecimento facial?", r: "Não. A busca visual utiliza características visuais para auxiliar na localização de registros." },
  { p: "Posso pesquisar uma pessoa nas gravações?", r: "É possível utilizar características visuais para localizar registros. Os resultados precisam ser confirmados por um operador." },
  { p: "Quanto tempo leva a implantação?", r: "Depende da quantidade de câmeras, infraestrutura e configuração necessária." },
  { p: "Quem pode acessar o sistema?", r: "O acesso é organizado por perfis e permissões de usuários." },
];

export default function CamerasIA() {
  return (
    <>
      <Hero
        titulo="Suas câmeras mais inteligentes."
        texto="Transforme sua estrutura de monitoramento em uma ferramenta de análise, identificação e acompanhamento operacional."
        botoes={<Botao href={CONTATO}>Solicitar demonstração</Botao>}
        midia={{ video: "praca-hero.mp4", poster: "praca-hero.jpg" }}
        sobreposicao={<VisaoIA semente={21} quantidade={14} />}
        legenda="Imagem ilustrativa, com detecções simuladas"
        escurecer="bg-black/55"
      />
      <MenuAncoras itens={ANCORAS} />

      <section className="secao">
        <div className="margem">
          <Cabecalho
            titulo="Mais informação sobre o que acontece no seu ambiente."
            texto="Acompanhar muitas câmeras simultaneamente é um desafio. Encontrar acontecimentos específicos, identificar falhas e compreender padrões de movimentação também pode exigir muito trabalho manual. A AIP utiliza inteligência artificial para ampliar a capacidade de análise das imagens e facilitar essas atividades."
          />
        </div>
      </section>

      <section className="secao border-t border-linha">
        <div className="margem">
          <Cabecalho titulo="Segurança, monitoramento e análise operacional." />
          <div className="mt-14 grid gap-x-12 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {APLICACOES.map((a, i) => (
              <Reveal key={a.titulo} atraso={i * 70}>
                <h3 className="titulo-coluna">{a.titulo}</h3>
                <p className="corpo mt-3">{a.texto}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-linha pt-[clamp(5rem,11vw,10rem)]">
        <div className="margem">
          <Cabecalho titulo="Um conjunto de ferramentas em um único ambiente." />
        </div>
      </section>

      <TelaDividida id="monitoramento" rotulo="Monitoramento" titulo="Muitas câmeras, uma única visão." visual={<MockMosaico />}>
        <Lista itens={["Visualização simultânea de câmeras", "Rastreamento visual", "Exportação de trechos de vídeo"]} />
      </TelaDividida>
      <TelaDividida id="fluxo" rotulo="Análise de fluxo" titulo="Como as pessoas usam os espaços." lado="direita" visual={<MockPlanta />}>
        <Lista itens={["Contagem de pessoas por entrada, corredor ou área", "Indicadores de ocupação", "Mapas de calor e rotas de circulação", "Comparação de períodos", "Identificação de áreas pouco utilizadas", "Visualização em planta, mapa ou formato híbrido"]} />
      </TelaDividida>
      <TelaDividida id="busca-visual" rotulo="Busca visual" titulo="Localize registros por características." visual={<MockBusca />}>
        <Lista itens={["Pesquisa por características visuais", "Localização de registros e movimentações", "Resultados sujeitos à confirmação humana"]} />
      </TelaDividida>
      <TelaDividida id="integridade" rotulo="Integridade das câmeras" titulo="Saiba quando uma câmera falha." lado="direita" visual={<MockSaude />}>
        <Lista itens={["Identificação de câmeras sem conexão", "Detecção de ausência ou comprometimento da imagem"]} />
      </TelaDividida>
      <TelaDividida id="assistente" rotulo="Assistente de IA" titulo="Pergunte aos seus dados." visual={<MockChat />}>
        <Lista itens={["Consultas em linguagem natural sobre os dados disponíveis", "Perguntas sobre horários de maior movimento, áreas menos utilizadas e indicadores da operação", "Limite diário de utilização por usuário e registro de consultas"]} />
      </TelaDividida>

      <section className="relative flex min-h-svh items-center overflow-hidden border-y border-linha py-20">
        <div className="margem grid items-center gap-12 lg:grid-cols-[1fr_1.5fr]">
          <Reveal>
            <p className="rotulo mb-4">Exemplo de aplicação</p>
            <h2 className="titulo-tela">Inteligência para entender a circulação.</h2>
            <p className="corpo mt-6">Em um shopping center, a plataforma pode identificar quais entradas concentram maior fluxo, os horários de maior movimento e as áreas com menor circulação. Essas informações podem apoiar decisões sobre organização de equipes, utilização dos espaços e planejamento operacional.</p>
            <p className="corpo mt-4">O mesmo princípio pode ser aplicado a lojas, indústrias, estacionamentos e condomínios.</p>
          </Reveal>
          <Reveal atraso={120}>
            <MapaCalor className="w-full" />
            <Legenda>Imagem ilustrativa: planta genérica, com dados simulados</Legenda>
          </Reveal>
        </div>
      </section>

      <section id="sob-projeto" className="secao">
        <div className="margem">
          <Reveal className="rounded-2xl border border-dashed border-white/30 p-8 md:p-14">
            <span className="rotulo rounded-full border border-white/30 px-3 py-1.5">Sob projeto</span>
            <p className="titulo-secao mt-8 max-w-[44rem]">Algumas aplicações dependem de configuração e validação técnica específicas.</p>
            <div className="mt-8 max-w-[44rem]">
              <Lista itens={["Leitura de placas veiculares (LPR)", "Detecção de invasão e entrada em áreas restritas", "Alertas inteligentes personalizados"]} />
            </div>
            <div className="mt-8">
              <Botao href={CONTATO} contorno>Consultar aplicações para meu projeto</Botao>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="secao border-t border-linha">
        <div className="margem grid gap-16 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <h2 className="titulo-secao">Aproveite sua estrutura atual.</h2>
            <div className="mt-8">
              <Lista itens={["Integração com câmeras compatíveis com RTSP", "Validação de integração com gravadores Intelbras NVR", "Acesso pelo navegador", "Perfis de usuários e permissões", "Configuração de horários de operação", "Retenção de dados definida conforme o projeto"]} />
            </div>
            <p className="corpo mt-6">A implantação depende da quantidade de câmeras, infraestrutura, qualidade das imagens e capacidade de processamento necessária.</p>
          </Reveal>
          <Reveal atraso={120}>
            <h2 className="titulo-secao">Segurança e controle.</h2>
            <div className="mt-8">
              <Lista itens={["Perfis de acesso administrativos e operacionais", "Registro de atividades e auditoria", "Controle de permissões", "Configuração de retenção de dados", "Não utiliza reconhecimento facial"]} />
            </div>
          </Reveal>
        </div>
      </section>

      <div className="border-t border-linha">
        <Acordeao itens={FAQ} />
      </div>
      <Encerramento titulo="Aproveite melhor as informações que suas câmeras registram." cta="Solicitar demonstração" href={CONTATO} />
    </>
  );
}
