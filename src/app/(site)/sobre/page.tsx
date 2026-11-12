import Image from "next/image";
import { metadados } from "../_config/metadados";
import { Botao, Hero } from "../_components/Base";
import Reveal from "../_components/Reveal";
import { LinhaDoTempo, Manifesto, MapaMundi, Principios, VisualDestaque } from "../_components/SobreAnimacoes";

const TITULO = "Tecnologia brasileira para defender e entender patrimônios.";
const DESCRICAO =
  "A AIP — Agência de Inteligência Patrimonial — desenvolve soluções de inteligência artificial e visão computacional para empresas, condomínios e o setor público. Transformamos as imagens das câmeras em segurança, monitoramento avançado e eficiência para cada operação.";

export const metadata = metadados(
  "/sobre",
  "Sobre a AIP: tecnologia brasileira para defender e entender patrimônios",
  "A AIP desenvolve soluções de inteligência artificial e visão computacional que transformam as imagens das câmeras em segurança, monitoramento avançado e eficiência.",
);

const DESTAQUES: { visual: "globo" | "paises" | "bandeira"; titulo: string; texto: string }[] = [
  { visual: "globo", titulo: "Pesquisa própria", texto: "Estudos da nossa equipe de especialistas em visão computacional." },
  { visual: "paises", titulo: "Referências internacionais", texto: "Tecnologias usadas por empresas, serviços de inteligência e governos no mundo todo." },
  { visual: "bandeira", titulo: "Soberania digital", texto: "Tecnologia desenvolvida no Brasil, para quem opera no Brasil." },
];

const PRINCIPIOS = [
  { titulo: "Precisão", texto: "Informação só tem valor se for confiável. Validamos cada aplicação antes de entregar." },
  { titulo: "Responsabilidade", texto: "Tratamos dados com finalidade definida, controle de acesso e respeito à legislação." },
  { titulo: "Tecnologia nacional", texto: "Desenvolvemos aqui, para quem opera aqui." },
  { titulo: "Parceria", texto: "Acompanhamos cada projeto do diagnóstico ao resultado." },
];

const ETAPAS = [
  { titulo: "Diagnóstico", texto: "Entendemos a operação e avaliamos as câmeras existentes." },
  { titulo: "Projeto", texto: "Definimos as aplicações e a configuração ideal." },
  { titulo: "Implantação", texto: "Presencial, no Brasil e no exterior." },
  { titulo: "Acompanhamento", texto: "Suporte remoto e evolução contínua." },
];

export default function Sobre() {
  return (
    <>
      {/* 1. Hero */}
      <Hero sobretitulo="Sobre a AIP" titulo={TITULO} texto={DESCRICAO} midia={{ foto: "sobre-central-monitoramento.jpg", alt: "Operador de costas numa sala escura, diante de uma parede de telas com imagens de câmeras e mapas analisados pela inteligência artificial", foco: "72% 50%" }} />

      {/* 2. Por que existimos */}
      <section className="secao">
        <div className="margem">
          <Reveal>
            <h2 className="titulo-tela max-w-[56rem]">Câmeras gravam o tempo todo. Quase ninguém assiste.</h2>
          </Reveal>
          <div className="mt-12 md:mt-16">
            <Manifesto texto="Milhões de horas de imagem são armazenadas todos os dias e só são vistas depois que algo acontece. A AIP nasceu para mudar isso: fazer as câmeras entenderem o que registram e transformar cada imagem em segurança, monitoramento avançado e eficiência." />
          </div>
        </div>
      </section>

      {/* 3. Inovação com raiz brasileira */}
      <section className="secao border-t border-linha">
        <div className="margem grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <p className="rotulo mb-4">Inovação</p>
            <h2 className="titulo-secao">O que há de mais avançado no mundo, pensado para a realidade brasileira.</h2>
            <div className="corpo mt-6 space-y-4">
              <p>As soluções da AIP nascem de estudos e pesquisas da nossa equipe de especialistas, somados à experiência internacional de quem acompanha de perto as tecnologias de visão computacional usadas por grandes empresas, serviços de inteligência e governos ao redor do mundo.</p>
              <p>Um dos nossos diretores traz essa vivência para o Brasil, e a nossa equipe a transforma em soluções adaptadas às nossas cidades, ao nosso clima, às nossas leis e às necessidades de cada operação.</p>
              <p>Acreditamos que o Brasil deve desenvolver a própria tecnologia, e não apenas importá-la. Cada solução da AIP é desenhada, configurada e acompanhada por uma equipe brasileira, contribuindo para a soberania digital do país.</p>
            </div>
          </Reveal>
          <div className="order-1 lg:order-2">
            <MapaMundi />
          </div>
        </div>
        <div className="margem mt-16">
          <ol className="grid gap-4 md:grid-cols-3">
            {DESTAQUES.map((d, i) => (
              <li key={d.titulo}>
                <Reveal atraso={i * 90} className="h-full rounded-2xl border border-white/10 bg-[#111214] p-6 sm:p-7">
                  <VisualDestaque tipo={d.visual} />
                  <p className="mt-6 font-titulo text-sm font-medium tracking-[0.18em] text-white/45">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-titulo text-[1.625rem] font-bold leading-[1.05]">{d.titulo}</h3>
                  <p className="mt-2 leading-snug text-white/65">{d.texto}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Missão, visão e princípios */}
      <section className="secao border-t border-linha">
        <div className="margem">
          <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
            <Reveal>
              <p className="rotulo mb-5">Missão</p>
              <p className="titulo-tela">Transformar imagens em inteligência para a segurança, o monitoramento avançado e a eficiência de cada operação.</p>
            </Reveal>
            <Reveal atraso={120} className="lg:pt-12">
              <p className="rotulo mb-5">Visão</p>
              <p className="text-2xl font-light leading-snug text-white/85 md:text-3xl">Um mundo em que imagens não sejam apenas guardadas, mas compreendidas.</p>
            </Reveal>
          </div>
          <div className="mt-20">
            <p className="rotulo mb-8">Princípios</p>
            <Principios itens={PRINCIPIOS} />
          </div>
        </div>
      </section>

      {/* 6. Como trabalhamos */}
      <section className="secao border-t border-linha">
        <div className="margem">
          <Reveal>
            <h2 className="titulo-secao">Do diagnóstico ao resultado.</h2>
          </Reveal>
          <div className="mt-14">
            <LinhaDoTempo etapas={ETAPAS} />
          </div>
        </div>
      </section>

      {/* 7. Compromisso com privacidade */}
      <section className="secao border-t border-linha">
        <div className="margem">
          <Reveal className="flex flex-col gap-8 rounded-2xl border border-white/10 bg-[#0d0e10] p-8 sm:p-12 md:flex-row md:items-start md:gap-12">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/15 text-[#5FD3FF]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <div>
              <h2 className="titulo-secao">Inteligência com responsabilidade.</h2>
              <p className="corpo mt-5 max-w-[48rem] text-lg">Cada projeto segue a LGPD, com finalidade definida, perfis de acesso, registro de auditoria e retenção de dados configurável. Aplicações sensíveis, como o reconhecimento facial, passam por avaliação técnica e jurídica antes de serem implantadas.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 8. Ecossistema e encerramento */}
      <section className="secao border-t border-linha">
        <div className="margem">
          <Reveal className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
            <a href="https://logoscompany.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <Image src="/site/media/logos-company-simbolo.png" alt="" width={44} height={44} className="h-11 w-11" />
              <span className="text-2xl font-semibold tracking-[-0.01em]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, 'Segoe UI', Roboto, sans-serif" }}>Logos Company</span>
            </a>
            <p className="text-lg text-white/70">A AIP faz parte do ecossistema Logos Company.</p>
          </Reveal>
          <div className="mt-14 border-t border-white/10 pt-16 text-center">
            <Reveal>
              <h2 className="titulo-tela mx-auto max-w-[48rem]">Vamos conversar sobre o seu projeto.</h2>
              <div className="mt-9">
                <Botao href="/contato">Fale conosco</Botao>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
