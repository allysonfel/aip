import { metadados } from "../_config/metadados";
import { Cabecalho, Encerramento, Foto, Hero, Lista, TelaDividida, Trio } from "../_components/Base";
import { CalibracaoIlustracao, DiagramaCamadas } from "../_components/Diagramas";
import Reveal from "../_components/Reveal";

export const metadata = metadados("/tecnologia", "Tecnologia", "Redes neurais, rastreamento multiobjeto e calibração por ambiente, operando sobre a estrutura de câmeras que já existe.");

const CAMADAS = [
  { titulo: "Captura", texto: "O sistema recebe os fluxos de vídeo pelo protocolo RTSP, direto das câmeras ou do gravador (NVR), e decodifica os quadros para análise." },
  { titulo: "Percepção", texto: "Uma rede neural de detecção localiza as pessoas em cada quadro analisado." },
  { titulo: "Continuidade", texto: "Um algoritmo de rastreamento liga as detecções de um quadro ao seguinte e mantém a identidade de cada pessoa ao longo do trajeto." },
  { titulo: "Geometria", texto: "Linhas, zonas e posição na planta, configuradas para cada câmera, transformam trajetórias em eventos: uma passagem, uma permanência, uma entrada em área." },
  { titulo: "Entrega", texto: "Os eventos são agregados em indicadores e enviados ao painel em tempo real, por conexão contínua com o servidor." },
];

const MODELOS = [
  { titulo: "Detecção", texto: "Rede neural de arquitetura transformer para detecção em tempo real. Analisa a imagem inteira de uma vez, o que favorece cenas com muitas pessoas e sobreposições." },
  { titulo: "Rastreamento", texto: "Algoritmo multiobjeto que combina a previsão do movimento de cada pessoa com a posição detectada. Isso reduz trocas de identidade quando alguém passa na frente de outra pessoa ou de um obstáculo." },
  { titulo: "Re-identificação por aparência", texto: "Uma rede neural converte a aparência de cada pessoa (cores, roupas, silhueta) num vetor numérico. Esse vetor ajuda a manter a identidade depois de uma oclusão e é a base da busca visual. Esse modelo não usa o rosto. O reconhecimento facial é um recurso à parte, sob projeto." },
];

const PROCESSAMENTO = [
  ["Processamento em servidores na nuvem", "As câmeras não precisam de hardware especial; a análise acontece no servidor."],
  ["Análise adaptativa", "Câmeras em observação no painel recebem taxa de análise maior; as demais seguem monitoradas em taxa reduzida, o que economiza processamento sem desligar nenhuma."],
  ["Aceleração por GPU", "Operações com muitas câmeras e análise completa em todas usam servidores com placa de vídeo dedicada à inferência."],
  ["Dimensionamento no projeto", "Número de câmeras, resolução e recursos contratados definem a capacidade de cada implantação."],
];

export default function Tecnologia() {
  return (
    <>
      <Hero titulo="Visão computacional aplicada à inteligência patrimonial." texto="Redes neurais, rastreamento multiobjeto e calibração por ambiente, operando sobre a estrutura de câmeras que já existe." midia={{ video: "cidade-noite.mp4", poster: "cidade-noite.jpg" }} escurecer="bg-black/25" />

      <section className="secao">
        <div className="margem">
          <Cabecalho titulo="Da câmera ao painel, em cinco camadas." />
          <DiagramaCamadas camadas={CAMADAS} />
        </div>
      </section>

      <section className="secao border-t border-linha">
        <div className="margem">
          <Cabecalho titulo="Três modelos trabalhando em conjunto." />
          <div className="mt-14">
            <Trio colunas={MODELOS} />
          </div>
        </div>
      </section>

      <TelaDividida
        titulo="Cada câmera é configurada para o espaço que ela vê."
        texto="Ângulo, altura, lente e iluminação mudam de uma câmera para outra. Por isso não existe configuração padrão. Em cada implantação, a equipe desenha as linhas de contagem e as zonas sobre a imagem real de cada câmera, posiciona cada câmera na planta do ambiente, ajusta os parâmetros de detecção à cena e compara o resultado do sistema com uma contagem de referência antes de liberar os indicadores."
        visual={
          <figure>
            <CalibracaoIlustracao />
          </figure>
        }
      />

      <TelaDividida titulo="Capacidade dimensionada pela operação." lado="direita" visual={<Foto src="servidores.jpg" alt="Sala de servidores com iluminação azul" className="aspect-[4/3]" />}>
        <dl className="border-t border-linha">
          {PROCESSAMENTO.map(([t, d]) => (
            <div key={t} className="border-b border-linha py-4">
              <dt className="font-medium">{t}</dt>
              <dd className="mt-1 text-cinza">{d}</dd>
            </div>
          ))}
        </dl>
      </TelaDividida>

      <section className="secao border-t border-linha">
        <div className="margem grid gap-16 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <h2 className="titulo-secao">O que o sistema guarda, e como.</h2>
            <div className="mt-8">
              <Lista itens={["Eventos e indicadores ficam em banco de dados relacional, separados por organização.", "Evidências em vídeo são trechos exportados com as marcações do sistema, guardados pelo prazo configurado.", "Acesso com senhas armazenadas em hash, sessões protegidas e comunicação por HTTPS.", "Auditoria das ações sensíveis, com autor e data."]} />
            </div>
          </Reveal>
          <Reveal atraso={120}>
            <h2 className="titulo-secao">O que influencia a precisão.</h2>
            <p className="corpo mt-8">Visão computacional depende da imagem que recebe. Os fatores que mais pesam são o ângulo da câmera, a iluminação, a resolução e a densidade de pessoas na cena. Grupos parados muito próximos são o cenário mais difícil para qualquer sistema de contagem. Por isso cada projeto começa por avaliação técnica das câmeras.</p>
          </Reveal>
        </div>
      </section>

      <Encerramento titulo="Tecnologia aplicada a problemas reais." cta="Solicitar avaliação técnica" href="/contato" />
    </>
  );
}
