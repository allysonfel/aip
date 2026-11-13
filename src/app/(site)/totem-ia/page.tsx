import Image from "next/image";
import { metadados } from "../_config/metadados";
import { Acordeao, Botao, Cabecalho, Encerramento } from "../_components/Base";
import Carrossel from "../_components/Carrossel";
import { CartaoFoto } from "../_components/Cartoes";
import FotoEntra from "../_components/FotoEntra";
import Reveal from "../_components/Reveal";
import VisualCentral, { type TipoCentral } from "../_components/CentralVisuais";
import TotemPorDentro, { type EtapaTotem } from "../_components/TotemPorDentro";

export const metadata = metadados("/totem-ia", "Totem IA", "Monitoramento inteligente para locais que precisam de cobertura adicional ou não possuem infraestrutura convencional.");

const CONTATO = "/contato?produto=totem-ia";
const M = "/site/media";

const ALT_FRENTE = "Totem IA da AIP visto de frente, com giroflex, quatro câmeras e linhas de LED azul, sobre fundo preto";
const ALT_TOPO = "Topo do Totem IA em close: giroflex vermelho e azul e câmeras com a marca AIP";
const ALT_TRES_QUARTOS = "Totem IA em três quartos, mostrando as câmeras laterais e o corpo de 3 metros";
const ALT_LATERAL = "Totem IA visto de lado, com as linhas de LED azul acesas ao longo do corpo";

// Posições medidas em cada foto (em % da imagem).
const ETAPAS: EtapaTotem[] = [
  { titulo: "Giroflex conectado", texto: "Sinalização luminosa acionada pela nossa central de monitoramento 24h, com conexão aos órgãos de segurança pública.", foto: "totem-topo.jpg", alt: ALT_TOPO, alvos: [{ x: 50.5, y: 24, w: 30, h: 17 }] },
  { titulo: "4 câmeras com IA", texto: "Cobertura de 360° com detecção de pessoas, veículos, comportamentos suspeitos, ocorrências e armas.", foto: "totem-topo.jpg", alt: ALT_TOPO, alvos: [{ x: 22, y: 49.5, w: 26, h: 13 }, { x: 78.5, y: 49.5, w: 26, h: 13 }] },
  { titulo: "Leitura de placas e reconhecimento facial", texto: "Identificação de veículos e de pessoas, com alertas em tempo real para a central e para as autoridades responsáveis.", foto: "totem-frente.jpg", alt: ALT_FRENTE, alvos: [{ x: 43, y: 16, w: 9, h: 6 }, { x: 56.5, y: 16.2, w: 9, h: 6 }], zoom: 1.12 },
  { titulo: "Áreas restritas", texto: "Aviso imediato quando alguém entra em locais ou horários definidos.", foto: "totem-tres-quartos.jpg", alt: ALT_TRES_QUARTOS, alvos: [{ x: 42, y: 16.8, w: 8, h: 5.5 }, { x: 58.5, y: 16.8, w: 7, h: 5.5 }], zoom: 1.12 },
  { titulo: "Presença visível", texto: "Linhas de LED que tornam o totem visível de dia e de noite e inibem ações suspeitas.", foto: "totem-lateral.jpg", alt: ALT_LATERAL, alvos: [{ x: 46.3, y: 57, w: 5, h: 45, caixa: true }] },
  { titulo: "Estrutura de 3 metros", texto: "Aço tratado contra corrosão, preparado para qualquer ambiente e conectado à plataforma AIP por 4G ou rede local.", foto: "totem-tres-quartos.jpg", alt: ALT_TRES_QUARTOS, alvos: [{ x: 50.3, y: 48, w: 25, h: 90, caixa: true }], zoom: 1 },
];

const CENTRAL: { visual: TipoCentral; titulo: string; texto: string }[] = [
  { visual: "relogio", titulo: "24/7", texto: "Monitoramento contínuo, todos os dias do ano." },
  { visual: "agentes", titulo: "Agentes próprios", texto: "Nossa equipe monitora 24 horas por dia, confirma cada ocorrência e notifica as autoridades ou os responsáveis pelo local." },
  { visual: "integracao", titulo: "Integração com a segurança pública", texto: "Conexão com Polícia Militar, Polícia Civil, Polícia Federal, Guarda Municipal e centrais integradas de segurança, conforme cada projeto." },
];

const APLICACOES = [
  { foto: "cenario-espacos-publicos.jpg", alt: "Totem IA numa praça urbana ao anoitecer, com bancos, árvores e prédios ao fundo", titulo: "Espaços públicos", texto: "Monitoramento de praças, parques, áreas de convivência e espaços de circulação." },
  { foto: "cenario-vias.jpg", alt: "Totem IA na esquina de um cruzamento movimentado à noite, com faixa de pedestres e semáforos", titulo: "Vias e mobilidade", texto: "Acompanhamento de ruas, cruzamentos, acessos e pontos estratégicos." },
  { foto: "cenario-eventos.jpg", alt: "Totem IA num festival à noite, com o palco iluminado e o público ao fundo", titulo: "Eventos", texto: "Estrutura de monitoramento para locais com grande circulação de pessoas e necessidades temporárias." },
  { foto: "cenario-obras.jpg", alt: "Totem IA ao lado de um canteiro de obras com guindaste e prédio em construção", titulo: "Obras e áreas operacionais", texto: "Acompanhamento de ambientes que exigem cobertura durante períodos específicos." },
  { foto: "cenario-condominios.jpg", alt: "Totem IA na entrada de um condomínio residencial, com portaria e cancela", titulo: "Condomínios e empreendimentos", texto: "Monitoramento de acessos, áreas externas e pontos de circulação." },
];

const FAQ = [
  { p: "O Totem substitui uma instalação convencional?", r: "Em muitos casos, sim. Ele reúne câmeras, processamento e conectividade numa estrutura só, ideal para locais sem infraestrutura ou que precisam de cobertura adicional. Avaliamos cada local antes da instalação." },
  { p: "Como funciona a conexão?", r: "O Totem se conecta à plataforma AIP por 4G ou pela rede local, conforme o que estiver disponível no ponto de instalação." },
  { p: "O Totem é conectado à polícia?", r: "Sim. Além da nossa central 24h, o Totem pode ser integrado a órgãos de segurança pública, como as Polícias Militar, Civil e Federal, a Guarda Municipal e as centrais integradas de segurança, conforme cada projeto." },
  { p: "Pode ser utilizado temporariamente?", r: "Sim. Eventos, obras e operações temporárias podem ser atendidos, conforme as condições de instalação." },
  { p: "Como os dados são tratados?", r: "Seguimos a LGPD, com finalidade definida, perfis de acesso, registro de auditoria e retenção configurável. O reconhecimento facial é aplicado conforme a finalidade de cada projeto e a legislação aplicável." },
];

export default function TotemIA() {
  return (
    <>
      {/* 1. Hero: texto à esquerda, totem à direita sobre o fundo preto. */}
      <section className="relative isolate overflow-hidden pb-16 pt-24 lg:flex lg:min-h-svh lg:items-center lg:py-0">
        <div className="margem grid items-center gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          <div className="order-2 lg:order-1">
            <h1 className="entra-1 titulo-hero">Segurança inteligente em qualquer lugar.</h1>
            <p className="entra-2 mt-6 max-w-[36rem] text-lg leading-relaxed text-white/80">Monitoramento inteligente para locais que precisam de cobertura adicional ou não possuem infraestrutura convencional.</p>
          </div>
          <div className="relative order-1 mx-auto aspect-[4/5] h-[52svh] max-h-[30rem] funde-preto-leve lg:order-2 lg:h-[88svh] lg:max-h-[56rem]">
            <FotoEntra src={`${M}/totem-frente.jpg`} alt={ALT_FRENTE} fill priority sizes="(min-width: 1024px) 45vw, 80vw" quality={85} className="object-contain" />
          </div>
        </div>
      </section>

      {/* 2. O totem por dentro */}
      <TotemPorDentro id="por-dentro" titulo="Cada detalhe pensado para proteger." etapas={ETAPAS} fotoFixa={{ src: "totem-frente.jpg", alt: ALT_FRENTE }} />

      {/* 3. Feito para resistir ao tempo: foto em tela cheia no desktop; no celular, foto em cima e texto embaixo. */}
      <section className="relative isolate border-t border-linha lg:flex lg:min-h-svh lg:items-center lg:overflow-hidden lg:border-0">
        <div className="relative aspect-[4/3] w-full lg:absolute lg:inset-0 lg:-z-20 lg:aspect-auto">
          <Image src={`${M}/totem-chuva.jpg`} alt="Totem IA sob chuva forte, visto de baixo para cima, com nuvens carregadas ao fundo" fill sizes="100vw" quality={85} style={{ objectPosition: "68% 50%" }} className="object-cover" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent lg:hidden" />
        </div>
        <div aria-hidden className="absolute inset-y-0 left-0 -z-10 hidden w-[45%] bg-gradient-to-r from-black/85 via-black/55 via-50% to-transparent lg:block" />
        <Reveal className="margem pb-20 pt-8 lg:py-28">
          <div className="max-w-[34rem] lg:[text-shadow:0_1px_2px_rgb(0_0_0/0.55),0_2px_24px_rgb(0_0_0/0.6)]">
            <h2 className="titulo-tela">Feito para resistir ao tempo.</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/85">Chuva forte, sol, vento e variações de temperatura fazem parte da rotina de quem fica na rua. O Totem IA é projetado para operar ao ar livre, com estrutura e equipamentos preparados para qualquer ambiente, para que o monitoramento continue quando o tempo muda.</p>
            <div className="mt-8">
              <Botao href={CONTATO}>Solicitar avaliação técnica</Botao>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 4. Central AIP 24 horas: foto inteira e o texto num bloco embaixo dela. */}
      <section className="relative">
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:max-h-[92svh] lg:min-h-[32rem]">
          <Image src={`${M}/central-24h.jpg`} alt="Agente da central AIP, de costas e com fone, diante de uma parede de telas com imagens de câmeras analisadas pela inteligência artificial" fill sizes="100vw" quality={85} style={{ objectPosition: "50% 40%" }} className="object-cover" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>
        <div className="margem relative -mt-6 pb-24 sm:-mt-10 lg:pb-32">
          <Reveal className="max-w-[52rem]">
            <p className="rotulo mb-4">Central AIP</p>
            <h2 className="titulo-tela">Olhos atentos 24 horas por dia.</h2>
            <p className="corpo mt-6 text-lg">Além da inteligência artificial, cada Totem IA está conectado à nossa central de monitoramento. Agentes da AIP acompanham as imagens 24 horas por dia, 7 dias por semana, confirmam cada ocorrência e notificam quem precisa agir.</p>
          </Reveal>
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {CENTRAL.map((d, i) => (
              <li key={d.titulo}>
                <Reveal atraso={i * 90} className="h-full rounded-2xl border border-white/10 bg-[#111214] p-6 sm:p-7">
                  <VisualCentral tipo={d.visual} />
                  <p className="mt-6 font-titulo text-sm font-medium tracking-[0.18em] text-white/45">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-titulo text-[1.625rem] font-bold leading-[1.05]">{d.titulo}</h3>
                  <p className="mt-2 leading-snug text-white/65">{d.texto}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. Cenários */}
      <section className="secao overflow-hidden border-t border-linha">
        <div className="margem mb-12">
          <Cabecalho titulo="Uma estrutura para diferentes cenários." />
        </div>
        <Reveal>
          <Carrossel rotulo="Aplicações do Totem IA" itens={APLICACOES.map((a) => ({ chave: a.titulo, conteudo: <CartaoFoto {...a} /> }))} />
        </Reveal>
      </section>

      {/* 6. Perguntas frequentes */}
      <div className="border-t border-linha">
        <Acordeao itens={FAQ} />
      </div>

      {/* 7. Encerramento */}
      <Encerramento titulo="Leve inteligência a novos pontos de monitoramento." cta="Conversar sobre meu projeto" href={CONTATO} />
    </>
  );
}
