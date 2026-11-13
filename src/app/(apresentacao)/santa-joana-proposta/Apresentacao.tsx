"use client";

import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "../_compartilhado/Icones";
import { LINHA_FIM, LinhaDoTempo } from "../_compartilhado/LinhaDoTempo";
import { LogoAIPNome } from "../_compartilhado/Logos";
import { dois, Marca, Moldura, Rotulo, useNavegacao } from "../_compartilhado/Moldura";
import { Conta, d, Slide } from "../_compartilhado/slide";
import { Anel30, ChatAssistente, ETAPAS, FiltroMono, HudFonte, HudPatrimonio, HudPortaria, HudVigilancia, LogoSantaJoana, PainelIlustrativo, TelaCamera } from "./Visuais";

// Apresentação comercial exclusiva da Água Mineral Santa Joana (página oculta:
// sem link no site, fora do sitemap, noindex). Modo apresentação: um slide por
// tela, scroll-snap, setas/PageUp/PageDown/espaço (passador de slides) e F
// para tela cheia. Texto exatamente como aprovado: não editar a copy aqui sem ok.

const TOTAL = 15;

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
        <div className="ap-linha-x h-full w-full bg-[#5FD3FF]" style={{ "--d": `${inicio}ms`, "--t": `${dur}ms`, transitionTimingFunction: "linear" } as React.CSSProperties} />
      </div>
      <div aria-hidden className="absolute bottom-6 left-[clamp(1.625rem,4vh,2.5rem)] top-6 w-px bg-white/15 md:hidden">
        <div className="ap-linha-y h-full w-full bg-[#5FD3FF]" style={{ "--d": `${inicio}ms`, "--t": `${dur}ms`, transitionTimingFunction: "linear" } as React.CSSProperties} />
      </div>
      <ol className="relative grid gap-6 md:grid-cols-3">
        {etapas.map((e, i) => (
          <li key={e.texto} className="flex items-center gap-5 md:flex-col md:gap-5 md:text-center">
            <span className={`relative shrink-0 ${tam}`}>
              <span className={`absolute inset-0 flex items-center justify-center rounded-full border border-white/20 bg-black text-white/35`}>
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

/** Layout comum das cinco frentes: número e título à esquerda, lista à direita, visual HUD. */
function Frente({ n, titulo, frase, itens, visual, visualNaLista = false }: { n: number; titulo: string; frase: string; itens: ReactNode[]; visual: ReactNode; visualNaLista?: boolean }) {
  return (
    <div className="ap-margem grid items-center gap-x-[6vw] gap-y-10 lg:grid-cols-2">
      <div>
        <div className="ap-in flex items-end gap-5" style={d(0)}>
          <span className="ap-num text-[clamp(3rem,min(6vw,11vh),7.5rem)] font-bold leading-[0.8] text-[#5FD3FF]">{dois(n)}</span>
          <span aria-hidden className="mb-[0.4em] flex gap-1.5">
            {[1, 2, 3, 4, 5].map((k) => (
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
            <li key={i} className="ap-in ap-item flex gap-4 border-t border-white/10 py-[clamp(0.85rem,2.4vh,1.6rem)]" style={d(300 + i * 90)}>
              <Marca />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {visualNaLista && <div className="mt-[clamp(1.25rem,3.5vh,2.5rem)]">{visual}</div>}
      </div>
    </div>
  );
}

/** Detalhe do slide 3 que "acende" dentro da frase. */
function Detalhe({ children, atraso }: { children: ReactNode; atraso: number }) {
  return (
    <span className="relative inline-block">
      <span className="ap-acende font-medium text-white" style={d(atraso)}>
        {children}
      </span>
      <span aria-hidden className="ap-linha-x absolute -bottom-0.5 left-0 h-px w-full bg-[#5FD3FF]" style={{ "--d": `${atraso + 150}ms`, "--t": "600ms" } as React.CSSProperties} />
    </span>
  );
}

const TABELA = [
  { cameras: "30", menor: "R$ 246 mil", ata: "R$ 416 mil", maior: "R$ 530 mil", aip: "R$ 6 mil/mês" },
  { cameras: "150", menor: "R$ 1,23 milhão", ata: "R$ 2,08 milhões", maior: "R$ 2,65 milhões", aip: "R$ 30 mil/mês" },
  { cameras: "300", menor: "R$ 2,46 milhões", ata: "R$ 4,16 milhões", maior: "R$ 5,30 milhões", aip: "R$ 60 mil/mês" },
];

const FALTARIA = [
  "Instalação, cabeamento, servidor e licença do software: não entram nessa conta.",
  "Pagamento todo no início, em vez de uma mensalidade.",
  "Manutenção e troca: câmeras queimam, envelhecem e saem de linha. Em 3 a 4 anos, boa parte precisa ser trocada.",
  "Funções congeladas: a câmera fica só com as funções de fábrica.",
  "Sem o resto da AIP: sem assistente de IA, WhatsApp, relatórios e contagem de produção sob medida.",
];

const MOTIVOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "semTroca", titulo: "Sem trocar equipamento", texto: "a inteligência vai para as câmeras atuais." },
  { icone: "painel", titulo: "Tudo num painel só", texto: "todas as unidades no mesmo lugar, no computador e no celular." },
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
      <FiltroMono />
      <Moldura atual={atual} total={TOTAL} />

      <main>
        {/* 1 · Capa */}
        <Slide id="capa" rotulo="Capa" className="text-center">
          <div aria-hidden className="ap-grade" />
          <div aria-hidden className="ap-varredura" style={{ "--t": "10s" } as React.CSSProperties} />
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
                <LogoSantaJoana className="h-[clamp(4.25rem,13vh,9.5rem)]" />
              </span>
            </div>
            <h1 className="ap-in ap-titulo-m mt-[clamp(2.5rem,9vh,6rem)] max-w-[22ch]" style={d(300)}>
              Inteligência artificial para proteger a qualidade, as pessoas e o patrimônio.
            </h1>
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
                  ["camera", "IA nas câmeras que a empresa já tem"],
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
            <h2 className="ap-titulo">
              <span className="ap-in block" style={d(80)}>
                A Santa Joana não vende água.
              </span>
              <span className="ap-in block text-[#5FD3FF]" style={d(180)}>
                Vende confiança.
              </span>
            </h2>
            <p className="ap-in ap-texto mt-[clamp(1.75rem,6vh,4rem)] max-w-[52ch]" style={d(380)}>
              Há mais de 30 anos, essa confiança depende de detalhes que ninguém vê: <Detalhe atraso={1000}>a fonte intocada</Detalhe>, <Detalhe atraso={1450}>a touca no envase</Detalhe>, <Detalhe atraso={1900}>o EPI na manutenção</Detalhe>, <Detalhe atraso={2350}>o caminhão certo saindo na hora certa</Detalhe>.
            </p>
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
                As imagens só são vistas depois que algo acontece. Até lá, a operação depende de ninguém errar.
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
            <p className="ap-in ap-texto mt-[clamp(1.75rem,5.5vh,3.5rem)] md:text-center" style={d(2000)}>
              Alertas no WhatsApp e no app do celular, e o painel completo no computador.
            </p>
            <ul className="mt-[clamp(1.5rem,5vh,3.25rem)] flex flex-wrap gap-2.5 md:justify-center">
              {["Fonte e fábrica", "Portaria e logística", "Patrimônio", "Vigilância", "Gestão"].map((c, i) => (
                <li key={c} className="ap-in ap-pequeno rounded-full border border-white/15 px-[1.1em] py-[0.45em] text-white/75" style={d(2150 + i * 80)}>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </Slide>

        {/* 6 a 10 · As cinco frentes */}
        <Slide id="fonte-e-fabrica" rotulo="01 Fonte e fábrica">
          <Frente
            n={1}
            titulo="Fonte e fábrica"
            frase="A qualidade da Santa Joana protegida em todos os turnos, não só no dia da auditoria."
            itens={["Perímetro e área restrita da fonte", "Higiene no envase: touca, máscara e luva", "Laboratório e sala de envase só para autorizados", "EPI em manutenção, caldeiras e empilhadeiras"]}
            visual={<HudFonte />}
          />
        </Slide>

        <Slide id="portaria-e-logistica" rotulo="02 Portaria e logística">
          <Frente
            n={2}
            titulo="Portaria e logística"
            frase="Nada entra ou sai da fábrica sem registro."
            itens={["Leitura automática de placas", "Portaria inteligente: aviso de veículo não autorizado ou não agendado", "Alerta de carga e descarga fora do horário"]}
            visual={<HudPortaria />}
          />
        </Slide>

        <Slide id="patrimonio" rotulo="03 Patrimônio">
          <Frente
            n={3}
            titulo="Patrimônio"
            frase="A fábrica protegida até quando está fechada."
            itens={["Cerca virtual em muros e portões", "Modo “fábrica fechada” e alerta de portas abertas fora do horário", "Permanência suspeita, veículos suspeitos e placas de alerta", "Detecção de arma, correria, briga e aglomeração"]}
            visual={<HudPatrimonio />}
          />
        </Slide>

        <Slide id="vigilancia-e-resposta" rotulo="04 Vigilância e resposta">
          <Frente
            n={4}
            titulo="Vigilância e resposta"
            frase="Quem protege também é acompanhado. E quem precisa agir é avisado na hora."
            itens={["Conferência automática de rondas", "Alerta de câmera tampada, virada ou desligada", "Busca visual: localize uma pessoa em minutos", "Alerta imediato para a equipe de segurança, com as imagens prontas para acionar as autoridades"]}
            visual={<HudVigilancia />}
          />
        </Slide>

        <Slide id="gestao-e-inteligencia" rotulo="05 Gestão e inteligência">
          <Frente
            n={5}
            titulo="Gestão e inteligência"
            frase="A operação inteira respondendo a uma pergunta."
            itens={["Contagem de produção por linha e turno (sob projeto)", "Relatório diário automático", "Assistente de IA"]}
            visual={<ChatAssistente />}
            visualNaLista
          />
        </Slide>

        {/* 11 · O que muda */}
        <Slide id="o-que-muda" rotulo="O que muda">
          <div className="ap-margem grid items-center gap-x-[4vw] gap-y-10 lg:grid-cols-[0.62fr_1.38fr]">
            <div>
              <Rotulo>O que muda</Rotulo>
              <h2 className="ap-in ap-titulo-p" style={d(80)}>
                A diretoria passa a saber o que acontece enquanto acontece, e não quando já virou problema.
              </h2>
              <ul className="mt-[clamp(1.25rem,4vh,2.5rem)] space-y-[clamp(0.5rem,1.6vh,1rem)]">
                {["Fonte protegida mesmo sem ninguém por perto.", "Regras cumpridas em todos os turnos.", "Colaboradores voltando para casa como chegaram.", "Todas as unidades na palma da mão."].map((t, i) => (
                  <li key={t} className="ap-in ap-pequeno flex gap-3.5 text-white/75" style={d(220 + i * 90)}>
                    <Marca />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <PainelIlustrativo />
              <p className="ap-fade mt-4 text-[clamp(0.7rem,1.3vh,0.85rem)] text-white/40" style={d(900)}>
                Painel ilustrativo. Dados fictícios.
              </p>
            </div>
          </div>
        </Slide>

        {/* 12 · Trocar as câmeras ou dar inteligência a elas? */}
        <Slide id="trocar-ou-dar-inteligencia" rotulo="Trocar as câmeras ou dar inteligência a elas?" className="!pb-[clamp(3rem,6vh,4rem)]">
          <div className="ap-margem grid gap-x-[4vw] gap-y-10 lg:grid-cols-[1.32fr_1fr]">
            <div>
              <h2 className="ap-in ap-titulo-p" style={d(0)}>
                Trocar as câmeras ou dar inteligência a elas?
              </h2>
              <p className="ap-in ap-pequeno mt-[clamp(0.75rem,2.2vh,1.4rem)] max-w-[62ch] text-white/70" style={d(90)}>
                A câmera com IA embarcada que chega mais perto disso é a Intelbras VIP 9460 ULTRA IA FT, com reconhecimento facial, EPI, leitura de placas, contagem e perímetro.
              </p>
              <p className="ap-in ap-pequeno mt-[clamp(0.9rem,2.6vh,1.6rem)] flex flex-wrap items-baseline gap-x-5 gap-y-1 text-white/55" style={d(180)}>
                <span>Preço por câmera:</span>
                <span>
                  <span className="ap-num text-[1.35em] text-white">
                    R$ <Conta ate={8199} milhar atraso={300} />
                  </span>{" "}
                  (menor)
                </span>
                <span aria-hidden>·</span>
                <span>
                  <span className="ap-num text-[1.35em] text-white">
                    R$ <Conta ate={13852} milhar atraso={380} />
                  </span>{" "}
                  (ata federal)
                </span>
                <span aria-hidden>·</span>
                <span>
                  <span className="ap-num text-[1.35em] text-white">
                    R$ <Conta ate={17678} milhar atraso={460} />
                  </span>{" "}
                  (maior)
                </span>
              </p>

              {/* tabela (tablet e desktop) */}
              <table className="mt-[clamp(1.25rem,3.6vh,2.25rem)] hidden w-full border-collapse text-left ap-pequeno md:table">
                <thead>
                  <tr className="ap-in text-[0.82em] uppercase tracking-[0.12em] text-white/45" style={d(300)}>
                    <th className="py-2.5 pr-4 font-medium">Câmeras</th>
                    <th className="py-2.5 pr-4 font-medium">Menor preço</th>
                    <th className="py-2.5 pr-4 font-medium">Ata federal</th>
                    <th className="py-2.5 pr-4 font-medium">Maior preço</th>
                    <th className="rounded-t-lg border-x border-t border-[#5FD3FF]/35 bg-[#5FD3FF]/[0.06] px-4 py-2.5 font-medium text-[#5FD3FF]">Com a AIP</th>
                  </tr>
                </thead>
                <tbody>
                  {TABELA.map((l, i) => (
                    <tr key={l.cameras} className="ap-in border-t border-white/10" style={d(450 + i * 180)}>
                      <td className="ap-num py-[clamp(0.6rem,1.8vh,1.1rem)] pr-4 text-[1.3em] text-white">{l.cameras}</td>
                      <td className="pr-4 text-white/70">{l.menor}</td>
                      <td className="pr-4 text-white/70">{l.ata}</td>
                      <td className="pr-4 text-white/70">{l.maior}</td>
                      <td className={`border-x border-[#5FD3FF]/35 bg-[#5FD3FF]/[0.06] px-4 font-medium text-[#5FD3FF] ${i === TABELA.length - 1 ? "rounded-b-lg border-b" : ""}`}>{l.aip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* cards empilhados (celular) */}
              <div className="mt-6 grid gap-3 md:hidden">
                {TABELA.map((l, i) => (
                  <dl key={l.cameras} className="ap-in rounded-xl border border-white/10 p-4 text-[0.95rem]" style={d(450 + i * 180)}>
                    <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
                      <dt className="text-white/50">Câmeras</dt>
                      <dd className="ap-num text-2xl text-white">{l.cameras}</dd>
                    </div>
                    {(
                      [
                        ["Menor preço", l.menor],
                        ["Ata federal", l.ata],
                        ["Maior preço", l.maior],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1.5 text-white/70">
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                    <div className="mt-1 flex justify-between rounded-lg border border-[#5FD3FF]/35 bg-[#5FD3FF]/[0.06] px-3 py-2 font-medium text-[#5FD3FF]">
                      <dt>Com a AIP</dt>
                      <dd>{l.aip}</dd>
                    </div>
                  </dl>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="ap-in" style={d(900)}>
                <p className="ap-pequeno font-medium text-white/55">Mesmo comprando as câmeras, ainda faltaria:</p>
                <ul className="mt-3 space-y-[clamp(0.35rem,1.1vh,0.7rem)] text-[clamp(0.85rem,min(0.98vw,1.85vh),1.15rem)] leading-snug text-white/40">
                  {FALTARIA.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span aria-hidden className="mt-[0.6em] h-px w-3 shrink-0 bg-white/30" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="ap-in relative mt-[clamp(1.25rem,3.5vh,2.25rem)] rounded-2xl border border-[#5FD3FF]/35 bg-[#5FD3FF]/[0.045] p-[clamp(1rem,2.6vh,1.75rem)]" style={d(1150)}>
                <p className="ap-item text-white">
                  Com a AIP: as câmeras que vocês já têm e{" "}
                  <span className="ap-num whitespace-nowrap text-[1.3em] text-[#5FD3FF]">
                    R$ <Conta ate={200} atraso={1300} duracao={1000} />
                  </span>{" "}
                  por câmera por mês.
                </p>
                <p className="mt-[clamp(0.6rem,1.8vh,1rem)] ap-pequeno text-white/70">
                  Setup de{" "}
                  <span className="relative inline-block whitespace-nowrap text-white">
                    R$ 25.000
                    <span aria-hidden className="ap-linha-x absolute left-[-3%] top-1/2 h-[2px] w-[106%] -translate-y-1/2 bg-[#5FD3FF]" style={{ "--d": "1800ms", "--t": "550ms" } as React.CSSProperties} />
                  </span>{" "}
                  (aplicação da IA, configuração e painel sob medida): isento para a Santa Joana.
                </p>
                <span className="mt-[clamp(0.6rem,1.8vh,1rem)] inline-block rotate-[-4deg]">
                  <span className="ap-in block rounded-md border-2 border-[#5FD3FF] px-3 py-0.5 font-titulo text-[clamp(1rem,min(1.6vw,2.8vh),1.6rem)] font-bold tracking-[0.2em] text-[#5FD3FF] shadow-[0_0_24px_rgb(95_211_255/0.25)]" style={d(2300)}>
                    ISENTO
                  </span>
                </span>
              </div>
            </div>

            <p className="ap-fade text-[clamp(0.62rem,1.15vh,0.78rem)] leading-relaxed text-white/30 lg:col-span-2" style={d(1500)}>
              Preços da VIP 9460 ULTRA IA FT: Rede Loja (redeloja.com.br), ata de registro de preço federal (lfcgoverno.com.br) e NJR Tecnologia (njrtecnologia.com.br), consultados em novembro de 2026. Sem instalação, servidor e software.
            </p>
          </div>
        </Slide>

        {/* 13 · Por que a AIP */}
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

        {/* 14 · Teste de 30 dias */}
        <Slide id="teste-de-30-dias" rotulo="Teste de 30 dias">
          <div className="ap-margem grid items-center gap-x-[5vw] gap-y-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h2 className="ap-in ap-titulo" style={d(0)}>
                Teste de 30 dias
              </h2>
              <p className="ap-in mt-[clamp(1.25rem,4vh,2.5rem)] font-titulo text-[clamp(1.6rem,min(2.8vw,5vh),3.4rem)] font-semibold leading-[1.08] text-[#5FD3FF]" style={d(100)}>
                Um mês. Câmeras existentes. Sem custo.
              </p>
              <p className="ap-in ap-texto mt-[clamp(1rem,3vh,2rem)] max-w-[34ch]" style={d(200)}>
                A AIP funcionando de verdade numa unidade da Santa Joana, com tudo o que foi apresentado aqui.
              </p>
            </div>
            <div className="ap-fade" style={d(150)}>
              <Anel30 />
            </div>
          </div>
        </Slide>

        {/* 15 · Próximos passos + fechamento */}
        <Slide id="proximos-passos" rotulo="Próximos passos" className="!py-[clamp(4rem,8vh,5.5rem)]">
          <div className="ap-margem">
            <Rotulo>Próximos passos</Rotulo>
            <div className="ap-fade" style={d(100)}>
              <LinhaDoTempo etapas={ETAPAS} />
            </div>
            <div className="mt-[clamp(2.5rem,8vh,5.5rem)] text-center">
              <p className="ap-in ap-titulo-p mx-auto max-w-[30ch]" style={d(LINHA_FIM + 900)}>
                Vamos tornar a Santa Joana mais segura, mais eficiente e ainda mais confiável.
              </p>
              <div className="ap-in mt-[clamp(1.5rem,4.5vh,3rem)] flex items-center justify-center gap-[clamp(1rem,2.5vw,2.5rem)]" style={d(LINHA_FIM + 1100)}>
                <LogoAIPNome logo="h-[clamp(1.6rem,4.4vh,3rem)]" nome="text-[clamp(0.45rem,0.85vh,0.62rem)]" />
                <span aria-hidden className="h-[clamp(2rem,6vh,4rem)] w-px bg-white/20" />
                <LogoSantaJoana className="h-[clamp(2.75rem,8vh,5.5rem)] shrink-0" />
              </div>
            </div>
          </div>
        </Slide>
      </main>
    </>
  );
}
