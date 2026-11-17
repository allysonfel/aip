"use client";

import type { CSSProperties, ReactNode } from "react";
import { Icone, type NomeIcone } from "../_compartilhado/Icones";
import { LINHA_FIM, LinhaDoTempo } from "../_compartilhado/LinhaDoTempo";
import { LogoAIPNome } from "../_compartilhado/Logos";
import { dois, Marca, Moldura, Rotulo, useNavegacao } from "../_compartilhado/Moldura";
import { Conta, d, Slide } from "../_compartilhado/slide";
import { TelaCamera } from "../santa-joana-proposta/Visuais";
import { Anel60, ETAPAS, HudCozinha, HudSalao, HudSeguranca, LogoCafe, PainelCafe, RamoFrentes, RamoFrentesCelular, RelatorioDiario } from "./Visuais";
import "./cafe.css";

// Proposta comercial exclusiva do Café do Virgulino (página oculta: sem link
// no site, fora do sitemap, noindex). Mesmo modo apresentação das propostas da
// Santa Joana e da Fundac: um slide por tela, scroll-snap, setas/PageUp/
// PageDown/espaço (passador) e F para tela cheia. Texto exatamente como
// aprovado: não editar a copy aqui sem ok.

const TOTAL = 14;

/** Fluxo de três etapas ligadas por uma linha ciano que se desenha (slide 5). */
function Fluxo() {
  const etapas: { icone: NomeIcone; texto: string }[] = [
    { icone: "conecta", texto: "Conectamos" },
    { icone: "ia", texto: "A IA analisa" },
    { icone: "alerta", texto: "O alerta chega a quem precisa" },
  ];
  const inicio = 450;
  const dur = 1400;
  const quando = (i: number) => inicio + (dur * i) / (etapas.length - 1);
  const tam = "h-[clamp(3.25rem,8vh,5rem)] w-[clamp(3.25rem,8vh,5rem)]";
  return (
    <div className="relative">
      <div aria-hidden className="absolute left-[16.66%] right-[16.66%] top-[clamp(1.625rem,4vh,2.5rem)] hidden h-px bg-white/15 md:block">
        <div className="ap-linha-x h-full w-full bg-[#5FD3FF]" style={{ "--d": `${inicio}ms`, "--t": `${dur}ms`, transitionTimingFunction: "linear" } as CSSProperties} />
      </div>
      <div aria-hidden className="absolute bottom-6 left-[clamp(1.625rem,4vh,2.5rem)] top-6 w-px bg-white/15 md:hidden">
        <div className="ap-linha-y h-full w-full bg-[#5FD3FF]" style={{ "--d": `${inicio}ms`, "--t": `${dur}ms`, transitionTimingFunction: "linear" } as CSSProperties} />
      </div>
      <ol className="relative grid gap-6 md:grid-cols-3">
        {etapas.map((e, i) => (
          <li key={e.texto} className="flex items-center gap-5 md:flex-col md:gap-5 md:text-center">
            <span className={`relative shrink-0 ${tam}`}>
              <span className="absolute inset-0 flex items-center justify-center rounded-full border border-white/20 bg-black text-white/35">
                <Icone nome={e.icone} className="h-[44%] w-[44%]" />
              </span>
              <span className="ap-fade absolute inset-0 flex items-center justify-center rounded-full border border-[#5FD3FF] bg-black text-[#5FD3FF] shadow-[0_0_26px_rgb(95_211_255/0.3)]" style={d(quando(i))}>
                <Icone nome={e.icone} className="h-[44%] w-[44%]" />
              </span>
            </span>
            <span className="ap-acende font-titulo text-[clamp(1.4rem,min(2.3vw,4vh),2.75rem)] font-semibold leading-tight" style={d(quando(i))}>
              {e.texto}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Layout das quatro frentes: número e título à esquerda, lista à direita, visual HUD. */
function Frente({ n, titulo, frase, itens, visual, visualNaLista = false }: { n: number; titulo: string; frase: string; itens: string[]; visual: ReactNode; visualNaLista?: boolean }) {
  return (
    <div className="ap-margem grid items-center gap-x-[6vw] gap-y-10 lg:grid-cols-2">
      <div>
        <div className="ap-in flex items-end gap-5" style={d(0)}>
          <span className="ap-num text-[clamp(3rem,min(6vw,11vh),7.5rem)] font-bold leading-[0.8] text-[#5FD3FF]">{dois(n)}</span>
          <span aria-hidden className="mb-[0.4em] flex gap-1.5">
            {[1, 2, 3, 4].map((k) => (
              <span key={k} className={`h-[3px] w-6 rounded-full ${k === n ? "bg-[#5FD3FF]" : k < n ? "bg-white/45" : "bg-white/15"}`} />
            ))}
          </span>
        </div>
        <h2 className="ap-in ap-titulo-m mt-[clamp(1rem,3vh,2rem)] uppercase" style={d(80)}>
          {titulo}
        </h2>
        <p className="ap-in ap-texto mt-[clamp(0.75rem,2.4vh,1.5rem)] max-w-[34ch]" style={d(160)}>
          {frase}
        </p>
        {!visualNaLista && (
          <div className="ap-in mt-[clamp(1.5rem,4vh,3rem)] w-full max-w-[min(36rem,calc(40vh*1.78))]" style={d(260)}>
            {visual}
          </div>
        )}
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
        {visualNaLista && <div className="mt-[clamp(1.25rem,3.5vh,2.5rem)] w-full max-w-[34rem]">{visual}</div>}
      </div>
    </div>
  );
}

/** Detalhe do slide 3: cada frase acende com um sublinhado ciano, uma de cada vez. */
function Detalhe({ children, atraso }: { children: ReactNode; atraso: number }) {
  return (
    <span className="relative inline">
      <span className="ap-acende text-white" style={d(atraso)}>
        {children}
      </span>
    </span>
  );
}

const DETALHES = ["A mesa livre na hora certa.", "A cozinha no padrão.", "O estoque no lugar.", "O restaurante protegido quando a porta fecha."];

const INCLUSO = ["IA nas câmeras que o restaurante já tem", "Painel sob medida", "Alertas no WhatsApp, no celular e no computador", "Relatório diário automático", "Botão de pânico silencioso", "Suporte ativo"];

const MOTIVOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "semTroca", titulo: "Sem trocar equipamento", texto: "a inteligência vai para as câmeras atuais." },
  { icone: "painel", titulo: "Tudo num painel só", texto: "no computador e no celular." },
  { icone: "equipe", titulo: "Equipe local", texto: "implantação virtual, checagem presencial e suporte ativo." },
  { icone: "escudo", titulo: "Responsabilidade", texto: "LGPD, perfis de acesso e auditoria." },
];

/* ------------------------------ apresentação ------------------------------ */

export default function Apresentacao() {
  const atual = useNavegacao(TOTAL);

  return (
    <>
      <noscript>
        <style>{`.ap-in,.ap-fade,.ap-acende,.ap-linha-x,.ap-linha-y{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <Moldura atual={atual} total={TOTAL} />

      <main>
        {/* 1 · Capa */}
        <Slide id="capa" rotulo="Capa" className="text-center">
          <div aria-hidden className="ap-grade" />
          <div aria-hidden className="ap-varredura" style={{ "--t": "10s" } as CSSProperties} />
          <div aria-hidden className="ap-fade pointer-events-none absolute inset-[clamp(1.25rem,5vh,3.5rem)]" style={d(600)}>
            <span className="absolute left-0 top-0 h-6 w-6 border-l border-t border-white/25" />
            <span className="absolute right-0 top-0 h-6 w-6 border-r border-t border-white/25" />
            <span className="absolute bottom-0 left-0 h-6 w-6 border-b border-l border-white/25" />
            <span className="absolute bottom-0 right-0 h-6 w-6 border-b border-r border-white/25" />
          </div>
          <div className="ap-margem relative flex flex-col items-center">
            <div className="flex flex-col items-center gap-[clamp(1rem,3.5vw,3.5rem)] sm:flex-row">
              <span className="ap-in" style={d(0)}>
                <LogoAIPNome logo="h-[clamp(2.25rem,7vh,5rem)]" nome="text-[clamp(0.5rem,1.25vh,0.9rem)]" />
              </span>
              <svg viewBox="0 0 24 24" aria-hidden className="ap-in h-[clamp(1.25rem,3.4vh,2.25rem)] w-[clamp(1.25rem,3.4vh,2.25rem)] text-[#5FD3FF]" style={d(90)} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <path d="M12 3v18M3 12h18" />
              </svg>
              <span className="ap-in shrink-0" style={d(180)}>
                <LogoCafe className="h-[clamp(4.5rem,13vh,8rem)]" />
              </span>
            </div>
            <h1 className="ap-in ap-titulo-m mt-[clamp(2.5rem,8vh,5.5rem)] max-w-[22ch]" style={d(300)}>
              Inteligência artificial para o Café do Virgulino
            </h1>
            <p className="ap-in ap-texto mt-[clamp(1rem,3vh,2rem)] max-w-[44ch] text-white/75" style={d(420)}>
              Salão, cozinha e patrimônio acompanhados em tempo real.
            </p>
          </div>
        </Slide>

        {/* 2 · Quem é a AIP */}
        <Slide id="quem-e-a-aip" rotulo="Quem é a AIP">
          <div className="ap-margem">
            <Rotulo>Quem é a AIP</Rotulo>
            <h2 className="ap-in ap-titulo-m max-w-[26ch]" style={d(80)}>
              Tecnologia pernambucana que transforma câmeras em segurança, monitoramento avançado e eficiência.
            </h2>
            <ul className="mt-[clamp(2.5rem,9vh,6rem)] grid gap-x-[4vw] gap-y-6 md:grid-cols-3">
              {(
                [
                  ["camera", "IA nas câmeras que o restaurante já tem"],
                  ["painel", "Painel sob medida"],
                  ["dispositivos", "Alertas no WhatsApp, no celular e no computador"],
                ] as [NomeIcone, string][]
              ).map(([icone, texto], i) => (
                <li key={texto} className="ap-in flex items-start gap-5 border-t border-white/12 pt-[clamp(1rem,3vh,2rem)] md:flex-col" style={d(260 + i * 100)}>
                  <Icone nome={icone} className="h-[clamp(2rem,5vh,3.25rem)] w-[clamp(2rem,5vh,3.25rem)] shrink-0 text-[#5FD3FF]" />
                  <span className="ap-item max-w-[22ch] text-white/90">{texto}</span>
                </li>
              ))}
            </ul>
          </div>
        </Slide>

        {/* 3 · O que está em jogo */}
        <Slide id="o-que-esta-em-jogo" rotulo="O que está em jogo">
          <div className="ap-margem">
            <Rotulo>O que está em jogo</Rotulo>
            <h2 className="ap-in ap-titulo" style={d(80)}>
              Um café vive de detalhes.
            </h2>
            <ul className="mt-[clamp(1.75rem,6vh,4rem)] grid max-w-[60rem] gap-x-[3vw] gap-y-[clamp(0.9rem,2.6vh,1.6rem)] sm:grid-cols-2">
              {DETALHES.map((t, i) => (
                <li key={t} className="ap-texto flex gap-4 border-t border-white/12 pt-[clamp(0.8rem,2.2vh,1.4rem)]">
                  <span aria-hidden className="ap-linha-x mt-[0.7em] h-px w-6 shrink-0 bg-[#5FD3FF]" style={{ "--d": `${700 + i * 450}ms`, "--t": "500ms" } as CSSProperties} />
                  <Detalhe atraso={700 + i * 450}>{t}</Detalhe>
                </li>
              ))}
            </ul>
          </div>
        </Slide>

        {/* 4 · O problema */}
        <Slide id="o-problema" rotulo="O problema">
          <div className="ap-margem grid items-center gap-x-[5vw] gap-y-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <Rotulo>O problema</Rotulo>
              <h2 className="ap-in ap-titulo-m" style={d(80)}>
                As câmeras já gravam tudo. Ninguém vê na hora.
              </h2>
              <p className="ap-in ap-texto mt-[clamp(1rem,3.5vh,2.25rem)] max-w-[36ch]" style={d(180)}>
                As imagens só são vistas depois que algo acontece. Até lá, o salão, a cozinha e o estoque dependem de ninguém errar.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-[clamp(0.35rem,0.7vw,0.75rem)]">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="ap-in" style={d(250 + i * 70)}>
                  <TelaCamera i={i} />
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* 5 · A solução */}
        <Slide id="a-solucao" rotulo="A solução">
          <div className="ap-margem">
            <Rotulo>A solução</Rotulo>
            <h2 className="ap-in ap-titulo-p max-w-[34ch]" style={d(80)}>
              A AIP conecta inteligência artificial às câmeras existentes. Elas passam a entender o que registram e avisam na hora.
            </h2>
            <div className="ap-fade mt-[clamp(2rem,7vh,4.5rem)]" style={d(250)}>
              <Fluxo />
            </div>
            <ul className="mt-[clamp(2rem,7vh,4.5rem)] flex flex-wrap gap-2.5 md:justify-center">
              {["Salão", "Cozinha e estoque", "Segurança", "Gestão"].map((c, i) => (
                <li key={c} className="ap-in ap-pequeno rounded-full border border-white/15 px-[1.1em] py-[0.45em] text-white/75" style={d(2000 + i * 90)}>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </Slide>

        {/* 6 a 9 · As quatro frentes */}
        <Slide id="salao" rotulo="01 Salão">
          <Frente
            n={1}
            titulo="Salão"
            frase="O salão inteiro na palma da mão."
            itens={["Mesas livres e ocupadas ao vivo, num mapa do salão", "Contagem de clientes por hora e por dia", "Horário de pico"]}
            visual={<HudSalao />}
          />
        </Slide>

        <Slide id="cozinha-e-estoque" rotulo="02 Cozinha e estoque">
          <Frente
            n={2}
            titulo="Cozinha e estoque"
            frase="A cozinha no padrão em todos os turnos."
            itens={["Uso de touca, máscara, luva e avental na cozinha", "Pessoa não autorizada na cozinha ou no estoque", "Acesso ao estoque e às bebidas fora do horário", "Movimentação no estoque com o restaurante fechado", "Detecção de fumaça ou fogo"]}
            visual={<HudCozinha />}
          />
        </Slide>

        <Slide id="seguranca" rotulo="03 Segurança">
          <Frente
            n={3}
            titulo="Segurança"
            frase="O restaurante protegido até quando está fechado."
            itens={["Restaurante fechado vigiado: qualquer pessoa dentro fora do horário gera alerta", "Detecção de arma", "Botão de pânico silencioso no celular: aviso imediato aos responsáveis, sem ninguém perceber", "Alerta de câmera tampada, virada ou desligada"]}
            visual={<HudSeguranca />}
          />
        </Slide>

        <Slide id="gestao" rotulo="04 Gestão">
          <Frente
            n={4}
            titulo="Gestão"
            frase="O dia do restaurante num relatório só."
            itens={["Relatório diário automático: clientes, horário de pico, giro de mesas e alertas de higiene e de segurança"]}
            visual={<RelatorioDiario />}
            visualNaLista
          />
        </Slide>

        {/* 10 · O que muda */}
        <Slide id="o-que-muda" rotulo="O que muda">
          <div className="ap-margem grid items-center gap-x-[4vw] gap-y-10 lg:grid-cols-[0.62fr_1.38fr]">
            <div>
              <Rotulo>O que muda</Rotulo>
              <h2 className="ap-in ap-titulo-p" style={d(80)}>
                O dono sabe o que acontece enquanto acontece, e não quando já virou problema.
              </h2>
              <ul className="mt-[clamp(1.25rem,4vh,2.5rem)] space-y-[clamp(0.5rem,1.6vh,1rem)]">
                {["Salão acompanhado ao vivo.", "Cozinha no padrão.", "Estoque protegido.", "Restaurante vigiado mesmo fechado."].map((t, i) => (
                  <li key={t} className="ap-in ap-pequeno flex gap-3.5 text-white/75" style={d(220 + i * 90)}>
                    <Marca />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <PainelCafe />
              <p className="ap-fade mt-4 text-[clamp(0.7rem,1.3vh,0.85rem)] text-white/40" style={d(900)}>
                Painel ilustrativo. Dados fictícios.
              </p>
            </div>
          </div>
        </Slide>

        {/* 11 · Investimento */}
        <Slide id="investimento" rotulo="Investimento">
          <div className="ap-margem">
            <Rotulo>Investimento</Rotulo>
            <h2 className="ap-in ap-titulo-p" style={d(80)}>
              Tudo numa mensalidade só.
            </h2>
            <div className="ap-in mt-[clamp(1.25rem,3.6vh,2.5rem)] grid gap-x-[4vw] gap-y-6 rounded-3xl border border-[#5FD3FF]/30 bg-[#5FD3FF]/[0.035] p-[clamp(1.25rem,3vw,3rem)] lg:grid-cols-[0.95fr_1.05fr]" style={d(180)}>
              <div className="flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-x-[clamp(1rem,2vw,2rem)] gap-y-3">
                  <p className="ap-num leading-none text-white">
                    <span className="align-top text-[clamp(1.5rem,min(2.6vw,4.6vh),3rem)] text-white/70">R$ </span>
                    <Conta ate={200} atraso={400} duracao={1300} className="text-[clamp(4rem,min(9vw,16vh),10rem)] font-bold" />
                  </p>
                  <span className="inline-block rotate-[-6deg]">
                    <span className="ap-in block rounded-md border-2 border-[#5FD3FF] px-3 py-1 text-center font-titulo text-[clamp(1rem,min(1.6vw,2.8vh),1.6rem)] font-bold leading-tight tracking-[0.18em] text-[#5FD3FF] shadow-[0_0_24px_rgb(95_211_255/0.25)]" style={d(1800)}>
                      60 DIAS ISENTOS
                    </span>
                  </span>
                </div>
                <p className="mt-2 font-titulo text-[clamp(1.3rem,min(2.2vw,4vh),2.6rem)] font-semibold text-[#5FD3FF]">por câmera por mês</p>
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
            <p className="ap-in ap-item mt-[clamp(1rem,3vh,2rem)] text-white" style={d(1100)}>
              <span className="text-[#5FD3FF]">60 dias de isenção</span> para o Café do Virgulino.
            </p>
          </div>
        </Slide>

        {/* 12 · Por que a AIP */}
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

        {/* 13 · 60 dias de isenção */}
        <Slide id="60-dias-de-isencao" rotulo="60 dias de isenção">
          <div className="ap-margem grid items-center gap-x-[5vw] gap-y-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h2 className="ap-in ap-titulo" style={d(0)}>
                60 dias de isenção
              </h2>
              <p className="ap-in mt-[clamp(1.25rem,4vh,2.5rem)] font-titulo text-[clamp(1.6rem,min(2.8vw,5vh),3.4rem)] font-semibold leading-[1.08] text-[#5FD3FF]" style={d(100)}>
                Dois meses. Câmeras existentes. Sem custo.
              </p>
              <p className="ap-in ap-texto mt-[clamp(1rem,3vh,2rem)] max-w-[34ch]" style={d(200)}>
                A AIP funcionando de verdade no Café do Virgulino, com tudo o que foi apresentado aqui.
              </p>
            </div>
            <div className="ap-fade" style={d(150)}>
              <Anel60 />
            </div>
          </div>
        </Slide>

        {/* 14 · Próximos passos + fechamento */}
        <Slide id="proximos-passos" rotulo="Próximos passos" className="!py-[clamp(4rem,8vh,5.5rem)]">
          <div className="ap-margem">
            <Rotulo>Próximos passos</Rotulo>
            <div className="ap-fade" style={d(100)}>
              <LinhaDoTempo etapas={ETAPAS} ramo={<RamoFrentes />} ramoCelular={<RamoFrentesCelular />} />
            </div>
            <div className="mt-[clamp(2.5rem,8vh,5.5rem)] text-center">
              <p className="ap-in ap-titulo-p mx-auto max-w-[30ch]" style={d(LINHA_FIM + 900)}>
                Vamos tornar o Café do Virgulino mais seguro, mais eficiente e ainda mais acolhedor.
              </p>
              <div className="ap-in mt-[clamp(1.5rem,4.5vh,3rem)] flex items-center justify-center gap-[clamp(1rem,2.5vw,2.5rem)]" style={d(LINHA_FIM + 1100)}>
                <LogoAIPNome logo="h-[clamp(1.6rem,4.4vh,3rem)]" nome="text-[clamp(0.45rem,0.85vh,0.62rem)]" />
                <span aria-hidden className="h-[clamp(2rem,6vh,4rem)] w-px bg-white/20" />
                <LogoCafe className="h-[clamp(2.75rem,8vh,5rem)] shrink-0" />
              </div>
            </div>
          </div>
        </Slide>
      </main>
    </>
  );
}
