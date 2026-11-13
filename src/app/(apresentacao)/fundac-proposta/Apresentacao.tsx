"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import VisualCentral, { type TipoCentral } from "../../(site)/_components/CentralVisuais";
import { Icone, type NomeIcone } from "../_compartilhado/Icones";
import { LINHA_FIM, LinhaDoTempo, type EtapaLinha } from "../_compartilhado/LinhaDoTempo";
import { LogoAIPNome, LogoCliente } from "../_compartilhado/Logos";
import { dois, Marca, Moldura, Rotulo, useNavegacao } from "../_compartilhado/Moldura";
import { Conta, d, Slide } from "../_compartilhado/slide";
import { DESTAQUES_TOTEM, DiaENoite, GraficoFluxo, HudFeira, MAPA_INICIO, MAPA_PASSO, MapaFeira, PalcoTotem, RamoMapa, RamoMapaCelular, TotemNoite, useDestaquesTotem, ZONAS } from "./Visuais";

// Proposta comercial exclusiva da Feira da Sulanca – Fundac (Caruaru-PE).
// Página oculta: sem link no site, fora do sitemap, noindex. Mesmo modo
// apresentação da proposta da Santa Joana. Fotos, palco do totem e blocos da
// central reaproveitados da página /totem-ia. Texto exatamente como aprovado.
// O totem tem giroflex e nenhum aviso sonoro: não citar alarme sonoro nesta página.

const TOTAL = 12;
const M = "/site/media";

function LogoFundac({ className }: { className: string }) {
  return <LogoCliente src="/clientes/fundac-logo.png" alt="Feira da Sulanca – Fundac" reserva="Feira da Sulanca – Fundac" className={className} />;
}

/** Layout das três frentes: número, nome e título à esquerda, com o visual; lista à direita. */
function Frente({ n, nome, titulo, itens, visual, extra }: { n: number; nome: string; titulo: string; itens: string[]; visual: ReactNode; extra?: ReactNode }) {
  return (
    <div className="ap-margem grid items-center gap-x-[6vw] gap-y-10 lg:grid-cols-2">
      <div>
        <div className="ap-in flex items-end gap-5" style={d(0)}>
          <span className="ap-num text-[clamp(2.75rem,min(5vw,9vh),6.25rem)] font-bold leading-[0.8] text-[#5FD3FF]">{dois(n)}</span>
          <span aria-hidden className="mb-[0.35em] flex gap-1.5">
            {[1, 2, 3].map((k) => (
              <span key={k} className={`h-[3px] w-6 rounded-full ${k === n ? "bg-[#5FD3FF]" : k < n ? "bg-white/45" : "bg-white/15"}`} />
            ))}
          </span>
        </div>
        <p className="ap-in mt-[clamp(0.75rem,2.2vh,1.5rem)] font-titulo text-[clamp(1.1rem,min(1.6vw,2.8vh),1.9rem)] font-semibold uppercase tracking-[0.08em] text-white/60" style={d(70)}>
          {nome}
        </p>
        <h2 className="ap-in ap-titulo-p mt-[clamp(0.4rem,1.2vh,0.8rem)] max-w-[22ch]" style={d(140)}>
          {titulo}
        </h2>
        <div className="ap-in mt-[clamp(1.25rem,3.6vh,2.75rem)] w-full max-w-[min(36rem,calc(40vh*1.78))]" style={d(240)}>
          {visual}
        </div>
      </div>
      <div>
        <ul className="border-b border-white/10">
          {itens.map((item, i) => (
            <li key={item} className="ap-in ap-item flex gap-4 border-t border-white/10 py-[clamp(0.85rem,2.4vh,1.6rem)]" style={d(300 + i * 90)}>
              <Marca />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {extra}
      </div>
    </div>
  );
}

const CENTRAL: { visual: TipoCentral; titulo: string; texto: string }[] = [
  { visual: "relogio", titulo: "24/7", texto: "Monitoramento contínuo, todos os dias do ano." },
  { visual: "agentes", titulo: "Agentes próprios", texto: "Nossa equipe monitora 24 horas por dia, confirma cada ocorrência e notifica as autoridades ou os responsáveis pelo local." },
  { visual: "integracao", titulo: "Integração com a segurança pública", texto: "Conexão com Polícia Militar, Polícia Civil, Polícia Federal, Guarda Municipal e centrais integradas de segurança, conforme cada projeto." },
];

const INCLUSO = [
  "Totem IA em comodato: o equipamento é da AIP, sem compra",
  "4 câmeras com inteligência artificial",
  "Central AIP 24h",
  "Giroflex conectado à central",
  "Manutenção e reposição de peças",
  "Internet 4G própria",
  "Painel e alertas no WhatsApp, no celular e no computador",
];

const MOTIVOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "totem", titulo: "Sem compra de equipamento", texto: "o totem é da AIP, e a manutenção também." },
  { icone: "painel", titulo: "Tudo num painel só", texto: "a Feira inteira no computador e no celular." },
  { icone: "equipe", titulo: "Equipe local", texto: "tecnologia pernambucana, com implantação, checagem presencial e suporte ativo." },
  { icone: "escudo", titulo: "Responsabilidade", texto: "LGPD, perfis de acesso e auditoria." },
];

const ETAPAS: EtapaLinha[] = [
  { n: "01", titulo: "Visita técnica", frase: "conhecemos o espaço, os acessos e os pontos críticos.", icone: "local" },
  { n: "02", titulo: "Projeto de posicionamento", frase: "definimos onde cada totem vai ficar.", icone: "mapa" },
  { n: "03", titulo: "Instalação", frase: "os totens funcionando e conectados à central.", icone: "totem" },
  { n: "04", titulo: "Expansão", frase: "ampliamos a cobertura para toda a Feira.", icone: "expansao" },
];

/** Slide 4: palco do totem com os quatro destaques. */
function SlideTotem() {
  const { atual, escolhe } = useDestaquesTotem();
  return (
    <div className="ap-margem grid items-center gap-x-[5vw] gap-y-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="ap-fade order-2 lg:order-1" style={d(150)}>
        <PalcoTotem atual={atual} />
      </div>
      <div className="order-1 lg:order-2">
        <Rotulo>A solução</Rotulo>
        <h2 className="ap-in ap-titulo-m" style={d(80)}>
          O Totem IA vigia, entende e avisa. Dia e noite.
        </h2>
        <ul className="mt-[clamp(1.5rem,4.5vh,3rem)] border-b border-white/10">
          {DESTAQUES_TOTEM.map((t, i) => (
            <li key={t} className="ap-in border-t border-white/10" style={d(220 + i * 90)}>
              <button type="button" onClick={() => escolhe(i)} aria-pressed={atual === i} className="ap-item flex w-full items-center gap-4 py-[clamp(0.75rem,2.1vh,1.35rem)] text-left">
                <span aria-hidden className={`h-px shrink-0 transition-all duration-500 ${atual === i ? "w-9 bg-[#5FD3FF]" : "w-5 bg-white/25"}`} />
                <span className={`transition-colors duration-500 ${atual === i ? "text-white" : "text-white/45"}`}>{t}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="ap-in ap-texto mt-[clamp(1.25rem,3.5vh,2.25rem)]" style={d(650)}>
          Alertas no WhatsApp, no celular e no computador.
        </p>
      </div>
    </div>
  );
}

export default function Apresentacao() {
  const atual = useNavegacao(TOTAL);

  return (
    <>
      <noscript>
        <style>{`.ap-in,.ap-fade,.ap-acende,.ap-linha-x,.ap-linha-y,.ap-barra{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <Moldura atual={atual} total={TOTAL} />

      <main>
        {/* 1 · Capa */}
        <Slide id="capa" rotulo="Capa">
          <div aria-hidden className="ap-grade opacity-60" />
          <div className="ap-margem relative grid items-center gap-x-[4vw] gap-y-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="order-2 lg:order-1">
              <div className="flex flex-col items-start gap-x-[clamp(1rem,2.6vw,2.75rem)] gap-y-3 sm:flex-row sm:items-center">
                <span className="ap-in" style={d(0)}>
                  <LogoAIPNome logo="h-[clamp(2rem,6vh,4.25rem)]" nome="text-[clamp(0.45rem,1.08vh,0.78rem)]" />
                </span>
                <svg viewBox="0 0 24 24" aria-hidden className="ap-in h-[clamp(1.1rem,3vh,2rem)] w-[clamp(1.1rem,3vh,2rem)] text-[#5FD3FF]" style={d(90)} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M12 3v18M3 12h18" />
                </svg>
                <span className="ap-in shrink-0" style={d(180)}>
                  <LogoFundac className="h-[clamp(3.25rem,10vh,7rem)]" />
                </span>
              </div>
              <h1 className="ap-in ap-titulo mt-[clamp(2rem,7vh,4.5rem)] max-w-[14ch]" style={d(300)}>
                Totem IA para a Feira da Sulanca
              </h1>
              <p className="ap-in ap-texto mt-[clamp(1rem,3vh,2rem)] max-w-[36ch]" style={d(400)}>
                Segurança inteligente para quem vende, para quem compra e para o patrimônio da Feira.
              </p>
            </div>
            <div className="ap-fade relative order-1 mx-auto aspect-[4/5] h-[40svh] funde-preto-leve lg:order-2 lg:h-[76svh] lg:max-h-[52rem]" style={d(100)}>
              <Image src={`${M}/totem-frente.jpg`} alt="Totem IA da AIP visto de frente, com giroflex, quatro câmeras e linhas de LED azul, sobre fundo preto" fill priority sizes="(min-width: 1024px) 40vw, 70vw" quality={85} className="object-contain" />
            </div>
          </div>
        </Slide>

        {/* 2 · O que está em jogo */}
        <Slide id="o-que-esta-em-jogo" rotulo="O que está em jogo">
          <div className="ap-margem">
            <Rotulo>O que está em jogo</Rotulo>
            <h2 className="ap-in ap-titulo" style={d(80)}>
              A Feira vive de confiança.
            </h2>
            <p className="ap-in ap-texto mt-[clamp(1.75rem,6vh,4rem)] max-w-[50ch]" style={d(220)}>
              O comprador volta quando se sente seguro. O feirante fica onde a mercadoria está protegida. Milhares de bancas, milhares de compradores por feira e um espaço enorme que precisa estar protegido mesmo quando o portão fecha.
            </p>
          </div>
        </Slide>

        {/* 3 · O problema */}
        <Slide id="o-problema" rotulo="O problema">
          <div className="ap-margem">
            <Rotulo>O problema</Rotulo>
            <h2 className="ap-in ap-titulo-p max-w-[40ch]" style={d(80)}>
              Nos dias de feira, gente demais para poucos olhos. Fora deles, um espaço enorme e vazio, cheio de mercadoria.
            </h2>
            <div className="mt-[clamp(1.75rem,5vh,3.5rem)] max-w-[min(100%,calc(58vh*3.3))]">
              <DiaENoite />
            </div>
          </div>
        </Slide>

        {/* 4 · A solução: Totem IA (palco da página /totem-ia) */}
        <Slide id="a-solucao" rotulo="A solução: Totem IA">
          <SlideTotem />
        </Slide>

        {/* 5 a 7 · Frentes */}
        <Slide id="nos-dias-de-feira" rotulo="01 Nos dias de feira">
          <Frente
            n={1}
            nome="Nos dias de feira"
            titulo="Mais segurança para quem compra e para quem vende."
            itens={["Movimentação suspeita e permanência fora do comum", "Briga, correria e aglomeração", "Busca visual: localize uma pessoa em minutos", "Leitura de placas no estacionamento"]}
            visual={<HudFeira />}
          />
        </Slide>

        <Slide id="quando-a-feira-fecha" rotulo="02 Quando a feira fecha">
          <Frente
            n={2}
            nome="Quando a feira fecha"
            titulo="A mercadoria protegida até quando não tem ninguém."
            itens={["Cerca virtual no perímetro e nos acessos", "Alerta de presença e de veículos fora do horário", "Giroflex acionado à distância pela central", "Notificação imediata às autoridades ou aos responsáveis"]}
            visual={<TotemNoite />}
          />
        </Slide>

        <Slide id="gestao-e-dados" rotulo="03 Gestão e dados">
          <Frente
            n={3}
            nome="Gestão e dados"
            titulo="A Feira em números, todos os dias."
            itens={["Contagem de público por dia e por horário", "Entradas e corredores mais movimentados", "Relatório diário automático"]}
            visual={
              <>
                <GraficoFluxo />
                <p className="ap-fade mt-2 text-[clamp(0.65rem,1.2vh,0.82rem)] text-white/40" style={d(1300)}>
                  Dados ilustrativos.
                </p>
              </>
            }
            extra={
              <p className="ap-in ap-item mt-[clamp(1.5rem,4vh,2.75rem)] border-l-2 border-[#5FD3FF] pl-5 text-white" style={d(700)}>
                Dados que mostram o valor de cada box para quem vende e para quem quer vender na Fundac.
              </p>
            }
          />
        </Slide>

        {/* 8 · Monitoramento 24h (bloco da central da página /totem-ia) */}
        <Slide id="monitoramento-24h" rotulo="Monitoramento 24h" className="isolate !items-end">
          <div aria-hidden className="ap-fade absolute inset-0 -z-10" style={d(0)}>
            <Image src={`${M}/central-24h.jpg`} alt="" fill sizes="100vw" quality={80} style={{ objectPosition: "50% 35%" }} className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/30" />
          </div>
          <div className="ap-margem relative">
            <Rotulo>Monitoramento 24h</Rotulo>
            <h2 className="ap-in ap-titulo-m max-w-[22ch] [text-shadow:0_2px_24px_rgb(0_0_0/0.6)]" style={d(80)}>
              Uma central acompanhando a Feira 24 horas por dia.
            </h2>
            <ol className="mt-[clamp(1.5rem,5vh,3.5rem)] grid gap-3 md:grid-cols-3 lg:gap-4">
              {CENTRAL.map((c, i) => (
                <li key={c.titulo} className="ap-in rounded-2xl border border-white/10 bg-[#0b0c0e]/85 p-[clamp(1rem,1.8vw,1.75rem)]" style={d(250 + i * 100)}>
                  <VisualCentral tipo={c.visual} />
                  <p className="mt-[clamp(0.75rem,2vh,1.5rem)] font-titulo text-sm font-medium tracking-[0.18em] text-white/45">{dois(i + 1)}</p>
                  <h3 className="mt-1.5 font-titulo text-[clamp(1.35rem,min(1.9vw,3.4vh),2.1rem)] font-bold leading-[1.05]">{c.titulo}</h3>
                  <p className="mt-2 ap-pequeno leading-snug text-white/65">{c.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </Slide>

        {/* 9 · Onde instalar */}
        <Slide id="onde-instalar" rotulo="Onde instalar">
          <div className="ap-margem">
            <Rotulo>Onde instalar</Rotulo>
            <h2 className="ap-in ap-titulo-p" style={d(80)}>
              Os totens nos pontos que mais importam.
            </h2>
            <div className="mt-[clamp(1.25rem,3.5vh,2.25rem)] grid items-start gap-x-[3vw] gap-y-6 lg:grid-cols-[1fr_auto]">
              <div className="w-full max-w-[min(100%,calc(56vh*1.667))]">
                <MapaFeira />
                <p className="ap-fade mt-2 text-[clamp(0.65rem,1.2vh,0.82rem)] text-white/40" style={d(900)}>
                  Mapa ilustrativo. O posicionamento final é definido na visita técnica.
                </p>
              </div>
              <div>
                <ol className="grid gap-[clamp(0.45rem,1.4vh,0.9rem)] sm:grid-cols-2 lg:grid-cols-1">
                  {ZONAS.map((z, i) => (
                    <li key={z} className="ap-acende ap-pequeno flex items-center gap-3 text-white/85" style={d(MAPA_INICIO + i * MAPA_PASSO)}>
                      <span className="ap-num flex h-[1.75em] w-[1.75em] shrink-0 items-center justify-center rounded-full border border-[#5FD3FF]/60 text-[0.85em] text-[#5FD3FF]">{i + 1}</span>
                      {z}
                    </li>
                  ))}
                </ol>
                <p className="ap-in ap-pequeno mt-[clamp(1.25rem,3.5vh,2.25rem)] max-w-[28ch] border-l-2 border-[#5FD3FF] pl-4 text-white/75" style={d(MAPA_INICIO + ZONAS.length * MAPA_PASSO)}>
                  Dentro dos módulos cobertos, a inteligência pode ir para as câmeras que já existem.
                </p>
              </div>
            </div>
          </div>
        </Slide>

        {/* 10 · Investimento */}
        <Slide id="investimento" rotulo="Investimento">
          <div className="ap-margem">
            <Rotulo>Investimento</Rotulo>
            <h2 className="ap-in ap-titulo-p" style={d(80)}>
              Tudo incluso numa mensalidade só.
            </h2>
            <div className="ap-in mt-[clamp(1.25rem,3.6vh,2.5rem)] grid gap-x-[4vw] gap-y-6 rounded-3xl border border-[#5FD3FF]/30 bg-[#5FD3FF]/[0.035] p-[clamp(1.25rem,3vw,3rem)] lg:grid-cols-[0.85fr_1.15fr]" style={d(180)}>
              <div className="flex flex-col justify-center">
                <p className="ap-num leading-none text-white">
                  <span className="align-top text-[clamp(1.5rem,min(2.6vw,4.6vh),3rem)] text-white/70">R$ </span>
                  <Conta ate={2490} milhar atraso={400} duracao={1300} className="text-[clamp(4rem,min(9vw,16vh),10rem)] font-bold" />
                </p>
                <p className="mt-2 font-titulo text-[clamp(1.3rem,min(2.2vw,4vh),2.6rem)] font-semibold text-[#5FD3FF]">por totem por mês</p>
              </div>
              <div>
                <p className="ap-rotulo">Incluso:</p>
                <ul className="mt-[clamp(0.6rem,1.6vh,1rem)] grid gap-[clamp(0.35rem,1.1vh,0.7rem)]">
                  {INCLUSO.map((t, i) => (
                    <li key={t} className="ap-in ap-pequeno flex gap-3 text-white/85" style={d(450 + i * 70)}>
                      <Icone nome="visto" className="mt-[0.15em] h-[1.1em] w-[1.1em] shrink-0 text-[#5FD3FF]" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="ap-in mt-[clamp(1rem,3vh,2rem)] flex flex-wrap items-center gap-x-5 gap-y-3" style={d(1100)}>
              <p className="ap-item text-white/80">
                Instalação:{" "}
                <span className="relative inline-block whitespace-nowrap text-white">
                  R$ 2.500
                  <span aria-hidden className="ap-linha-x absolute left-[-3%] top-1/2 h-[2px] w-[106%] -translate-y-1/2 bg-[#5FD3FF]" style={{ "--d": "1600ms", "--t": "550ms" } as CSSProperties} />
                </span>{" "}
                por totem. Isenta no contrato de 36 meses.
              </p>
              <span className="inline-block rotate-[-4deg]">
                <span className="ap-in block rounded-md border-2 border-[#5FD3FF] px-3 py-0.5 font-titulo text-[clamp(1rem,min(1.6vw,2.8vh),1.6rem)] font-bold tracking-[0.2em] text-[#5FD3FF] shadow-[0_0_24px_rgb(95_211_255/0.25)]" style={d(2100)}>
                  ISENTA
                </span>
              </span>
            </div>
            <p className="ap-fade mt-[clamp(0.9rem,2.6vh,1.75rem)] text-[clamp(0.65rem,1.2vh,0.82rem)] text-white/40" style={d(1300)}>
              Contrato de 36 meses. Quantidade e posicionamento dos totens definidos após a visita técnica.
            </p>
          </div>
        </Slide>

        {/* 11 · Por que a AIP */}
        <Slide id="por-que-a-aip" rotulo="Por que a AIP">
          <div className="ap-margem">
            <Rotulo>Por que a AIP</Rotulo>
            <ul className="grid gap-[clamp(0.75rem,1.4vw,1.5rem)] sm:grid-cols-2 lg:grid-cols-4">
              {MOTIVOS.map((m, i) => (
                <li key={m.titulo} className="ap-in flex flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-[clamp(1.25rem,2.2vw,2.5rem)] lg:min-h-[44vh]" style={d(120 + i * 100)}>
                  <Icone nome={m.icone} className="h-[clamp(2.25rem,5.5vh,3.5rem)] w-[clamp(2.25rem,5.5vh,3.5rem)] text-[#5FD3FF]" />
                  <h3 className="mt-auto pt-[clamp(1.5rem,6vh,4rem)] font-titulo text-[clamp(1.6rem,min(2.4vw,4.4vh),2.9rem)] font-bold leading-[1.02]">{m.titulo}</h3>
                  <p className="mt-3 ap-pequeno text-white/65">{m.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </Slide>

        {/* 12 · Próximos passos + fechamento */}
        <Slide id="proximos-passos" rotulo="Próximos passos" className="!py-[clamp(4rem,8vh,5.5rem)]">
          <div className="ap-margem">
            <Rotulo>Próximos passos</Rotulo>
            <div className="ap-fade" style={d(100)}>
              <LinhaDoTempo etapas={ETAPAS} ramo={<RamoMapa />} ramoCelular={<RamoMapaCelular />} />
            </div>
            <div className="mt-[clamp(2.5rem,8vh,5.5rem)] text-center">
              <p className="ap-in ap-titulo-p mx-auto max-w-[34ch]" style={d(LINHA_FIM + 1300)}>
                Vamos tornar a Feira da Sulanca mais segura para quem vende, para quem compra e para quem faz a Feira acontecer.
              </p>
              <div className="ap-in mt-[clamp(1.5rem,4.5vh,3rem)] flex items-center justify-center gap-[clamp(1rem,2.5vw,2.5rem)]" style={d(LINHA_FIM + 1500)}>
                <LogoAIPNome logo="h-[clamp(1.6rem,4.4vh,3rem)]" nome="text-[clamp(0.45rem,0.85vh,0.62rem)]" />
                <span aria-hidden className="h-[clamp(2rem,6vh,4rem)] w-px bg-white/20" />
                <LogoFundac className="h-[clamp(2.5rem,7vh,4.75rem)] shrink-0" />
              </div>
            </div>
          </div>
        </Slide>
      </main>
    </>
  );
}
