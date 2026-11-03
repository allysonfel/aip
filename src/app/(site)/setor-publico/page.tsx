import { metadados } from "../_config/metadados";
import { Botao, Cabecalho, Encerramento, Foto, Hero, Lista, TelaDividida } from "../_components/Base";
import Reveal from "../_components/Reveal";

export const metadata = metadados("/setor-publico", "Setor público", "Soluções de visão computacional para apoiar o monitoramento, a segurança e a gestão de espaços urbanos.");

const CONTATO = "/contato?tipo=publico";

export default function SetorPublico() {
  return (
    <>
      <Hero titulo="Inteligência visual para a gestão pública." texto="Soluções de visão computacional para apoiar o monitoramento, a segurança e a gestão de espaços urbanos." botoes={<Botao href="#aplicacoes">Conheça as soluções</Botao>} midia={{ foto: "praca-aerea-2.jpg", alt: "Praça e ruas de uma cidade vistas do alto" }} escurecer="bg-black/50" />

      <div id="aplicacoes">
        <TelaDividida titulo="Segurança urbana" visual={<Foto src="via-noite.jpg" alt="Avenida com trânsito à noite vista do alto" className="aspect-[4/3]" />}>
          <Lista itens={["Visualização de imagens em tempo real", "Busca visual de registros", "Apoio à localização de acontecimentos", "Leitura de placas em vias e acessos, conforme projeto", "Alertas em áreas e horários específicos, conforme projeto", "Apoio às equipes responsáveis por meio de imagens e registros identificados"]} />
        </TelaDividida>
        <TelaDividida titulo="Gestão dos espaços urbanos" lado="direita" visual={<Foto src="praca-aerea.jpg" alt="Parque urbano e rotatória vistos do alto" className="aspect-[4/3]" />}>
          <Lista itens={["Contagem de pessoas", "Indicadores de circulação e ocupação", "Comparação de movimentação entre períodos", "Identificação de áreas com maior ou menor utilização"]} />
        </TelaDividida>
        <TelaDividida titulo="Equipamentos e serviços públicos" visual={<Foto src="cidade-aerea.jpg" alt="Ruas de uma cidade à noite, vistas do alto" className="aspect-[4/3]" />}>
          <Lista itens={["Escolas", "Unidades de saúde", "Prédios públicos", "Terminais e áreas de circulação", "Outros equipamentos municipais"]} />
          <p className="mt-5 text-sm text-cinza">As aplicações dependem da finalidade, infraestrutura e requisitos técnicos de cada projeto.</p>
        </TelaDividida>
      </div>

      <section className="secao border-y border-linha bg-painel">
        <div className="margem grid gap-10 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <h2 className="titulo-tela">Governança e responsabilidade.</h2>
            <p className="corpo mt-6">O tratamento das informações deve respeitar a finalidade pública, os requisitos legais e as condições estabelecidas contratualmente.</p>
          </Reveal>
          <Reveal atraso={120}>
            <Lista itens={["Perfis e permissões de usuários", "Registros de atividades e auditoria", "Identificação de autor e data das ações registradas", "Definição de períodos de retenção e exclusão", "Não utiliza reconhecimento facial"]} />
          </Reveal>
        </div>
      </section>

      <TelaDividida
        titulo="Integração e expansão do monitoramento."
        texto="A AIP pode integrar câmeras e gravadores compatíveis com RTSP, mediante validação técnica. Para locais sem infraestrutura adequada ou que necessitam de cobertura adicional, o Totem IA pode ser avaliado como alternativa."
        lado="direita"
        visual={<Foto src="camera-poste.jpg" alt="Câmera de monitoramento instalada em um poste" className="aspect-[4/3]" />}
      />

      <section className="secao border-t border-linha">
        <div className="margem">
          <Cabecalho titulo="Contratação" texto="Cada projeto é avaliado conforme a infraestrutura, os objetivos e os requisitos técnicos e administrativos da instituição. As modalidades de contratação devem ser definidas com as equipes técnicas e jurídicas responsáveis, conforme a legislação aplicável." />
        </div>
      </section>

      <Encerramento titulo="Mais inteligência para os espaços públicos." cta="Fale com a equipe AIP" href={CONTATO} />
    </>
  );
}
