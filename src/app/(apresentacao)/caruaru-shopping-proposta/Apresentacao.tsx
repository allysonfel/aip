"use client";

import type { ReactNode } from "react";
import type { VisualId } from "../../(site)/_components/MiniVisuais";
import { Icone, type NomeIcone } from "../_compartilhado/Icones";
import { LogoAIPNome } from "../_compartilhado/Logos";
import { Marca, Moldura, Rotulo, useNavegacao } from "../_compartilhado/Moldura";
import { d, Slide } from "../_compartilhado/slide";
import { CartaoVisual, Economia, Estacionamento, ListaRestricao, LogoCaruaru, Mini, PainelExemplo, PlantaCerca, Rota, SeloExemplo, SeloSobProjeto } from "./Visuais";

// Apresentação comercial exclusiva do Caruaru Shopping (página oculta: sem link
// no site, fora do sitemap, noindex, fora da regra de idiomas). Números são de
// demonstração (selo EXEMPLO); nenhuma imagem de câmera, rosto ou placa real.
// A planta é a oficial do térreo (a mesma do painel), só como base visual.

const TOTAL = 13;

/** Título forte + até duas linhas de texto, com o visual ao lado. */
function Bloco({ rotulo, titulo, texto, visual, itens, selo, proporcao = "lg:grid-cols-[0.85fr_1.15fr]" }: { rotulo: string; titulo: string; texto?: string; visual: ReactNode; itens?: ReactNode[]; selo?: ReactNode; proporcao?: string }) {
  return (
    <div className={`ap-margem grid items-center gap-x-[5vw] gap-y-10 ${proporcao}`}>
      <div>
        <Rotulo>{rotulo}</Rotulo>
        <h2 className="ap-in ap-titulo-m" style={d(80)}>
          {titulo}
        </h2>
        {selo && (
          <div className="ap-in mt-3" style={d(120)}>
            {selo}
          </div>
        )}
        {texto && (
          <p className="ap-in ap-texto mt-[clamp(0.9rem,2.6vh,1.75rem)] max-w-[38ch]" style={d(160)}>
            {texto}
          </p>
        )}
        {itens && (
          <ul className="mt-[clamp(1rem,3vh,2rem)] border-b border-white/10">
            {itens.map((t, i) => (
              <li key={i} className="ap-in ap-pequeno flex gap-4 border-t border-white/10 py-[clamp(0.55rem,1.6vh,1rem)] text-white/80" style={d(260 + i * 90)}>
                <Marca />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="ap-in" style={d(220)}>
        {visual}
      </div>
    </div>
  );
}

const ROTA: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "camera", titulo: "Câmeras existentes", texto: "as que o shopping já tem." },
  { icone: "ia", titulo: "Inteligência artificial", texto: "pessoas, veículos e áreas, minuto a minuto." },
  { icone: "painel", titulo: "Painel e alertas", texto: "no computador e no celular." },
  { icone: "equipe", titulo: "Administração e segurança", texto: "decidem e agem com informação." },
];

const PASSOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "busca", titulo: "Levantamento", texto: "Definição das câmeras e dos pontos de interesse com a administração." },
  { icone: "ia", titulo: "Aplicação", texto: "Inteligência artificial configurada em cada câmera, com cerca digital, linhas de contagem e áreas." },
  { icone: "painel", titulo: "Entrega", texto: "Primeira versão em 10 a 15 dias após a definição das câmeras. Depois, testes e ajustes com o movimento real até a versão final." },
];

const PESSOAS: { id: VisualId; titulo: string; texto: string; exemplo: string }[] = [
  { id: "V1", titulo: "Fluxo por entrada e corredor", texto: "Quantas pessoas entram, por onde e em que horário.", exemplo: "1.248 entradas no acesso principal" },
  { id: "V2", titulo: "Mapas de calor e rotas", texto: "Onde o público circula, para e quais caminhos usa.", exemplo: "Corredor B: 42% do fluxo" },
  { id: "V4", titulo: "Picos e comparativos", texto: "Dias, períodos e datas comerciais lado a lado.", exemplo: "Sábado: +46% sobre a média" },
];

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
                <LogoCaruaru className="h-[clamp(5rem,15vh,11rem)]" />
              </span>
            </div>
            <h1 className="ap-in ap-titulo-m mt-[clamp(2.5rem,8vh,5.5rem)] max-w-[24ch]" style={d(300)}>
              Inteligência artificial aplicada à gestão e à segurança do Caruaru Shopping.
            </h1>
          </div>
        </Slide>

        {/* 2 · O desafio e a proposta */}
        <Slide id="desafio-e-proposta" rotulo="O desafio e a proposta">
          <div className="ap-margem grid items-end gap-x-[5vw] gap-y-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <Rotulo>O desafio</Rotulo>
              <h2 className="ap-titulo max-w-[18ch]">
                <span className="ap-in block" style={d(80)}>
                  Um shopping gera informação o tempo todo.
                </span>
                <span className="ap-in block text-[#5FD3FF]" style={d(200)}>
                  Quase nada vira dado para decisão.
                </span>
              </h2>
            </div>
            <div className="ap-in border-l border-[#5FD3FF]/50 pl-[clamp(1rem,2vw,2rem)]" style={d(500)}>
              <p className="ap-rotulo text-white/55">A proposta</p>
              <p className="mt-3 font-titulo text-[clamp(1.5rem,min(2.4vw,4.2vh),2.75rem)] font-semibold leading-[1.1]">As câmeras que o shopping já tem, com a inteligência artificial da AIP, gerando informação de gestão e de segurança.</p>
            </div>
          </div>
        </Slide>

        {/* 3 · Como funciona */}
        <Slide id="como-funciona" rotulo="Como funciona">
          <div className="ap-margem">
            <Rotulo>Como funciona</Rotulo>
            <h2 className="ap-in ap-titulo-p max-w-[30ch]" style={d(80)}>
              Sem trocar equipamento: a IA lê as imagens e entrega a informação pronta.
            </h2>
            <div className="ap-fade mt-[clamp(2.5rem,8vh,5rem)]" style={d(250)}>
              <Rota etapas={ROTA} />
            </div>
          </div>
        </Slide>

        {/* 4 · Cerca digital (proposta de implantação) */}
        <Slide id="cerca-digital" rotulo="Cerca digital">
          <Bloco
            rotulo="Cerca digital"
            titulo="Uma cerca digital em todo o shopping."
            texto="Cada entrada, corredor e acesso ao estacionamento vira informação útil para a administração e para a segurança."
            proporcao="lg:grid-cols-[0.72fr_1.28fr]"
            visual={
              <>
                <PlantaCerca />
                <p className="mt-3 text-[clamp(0.65rem,1.2vh,0.8rem)] text-white/40">Proposta de implantação sobre a planta do térreo.</p>
              </>
            }
          />
        </Slide>

        {/* 5 · Pessoas */}
        <Slide id="pessoas" rotulo="Pessoas">
          <div className="ap-margem">
            <Rotulo>Pessoas</Rotulo>
            <h2 className="ap-in ap-titulo-m max-w-[26ch]" style={d(80)}>
              Quem entra, por onde circula e quando o movimento cresce.
            </h2>
            <ul className="mt-[clamp(2rem,6vh,4rem)] grid gap-[clamp(0.75rem,1.4vw,1.5rem)] md:grid-cols-3">
              {PESSOAS.map((p, i) => (
                <li key={p.titulo} className="ap-in flex flex-col rounded-2xl border border-white/10 bg-[#111214] p-[clamp(1rem,2vw,1.75rem)]" style={d(220 + i * 120)}>
                  <div className="h-[clamp(7rem,19vh,12rem)]">
                    <Mini id={p.id} />
                  </div>
                  <h3 className="mt-[clamp(1rem,2.6vh,1.6rem)] font-titulo text-[clamp(1.35rem,min(2vw,3.6vh),2.3rem)] font-bold leading-[1.05]">{p.titulo}</h3>
                  <p className="mt-2 ap-pequeno text-white/65">{p.texto}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-[clamp(0.6rem,1.6vh,1rem)] [margin-top:clamp(1rem,2.6vh,1.6rem)]">
                    <span className="text-[clamp(0.7rem,1.3vh,0.9rem)] font-medium text-white">{p.exemplo}</span>
                    <SeloExemplo />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Slide>

        {/* 6 · Estacionamento */}
        <Slide id="estacionamento" rotulo="Estacionamento">
          <Bloco
            rotulo="Estacionamento"
            titulo="Veículos e placas, da entrada à saída."
            itens={["Contagem de veículos por entrada e saída", "Ocupação e tempo de permanência", "Leitura de placas, com alerta para placas de interesse"]}
            visual={<Estacionamento />}
          />
        </Slide>

        {/* 7 · Segurança */}
        <Slide id="seguranca" rotulo="Segurança">
          <div className="ap-margem">
            <Rotulo>Segurança</Rotulo>
            <h2 className="ap-in ap-titulo-m max-w-[26ch]" style={d(80)}>
              Encontrar rápido e saber na hora.
            </h2>
            <div className="mt-[clamp(1.75rem,5vh,3.5rem)] grid gap-[clamp(0.75rem,1.4vw,1.5rem)] lg:grid-cols-2">
              <div className="ap-in" style={d(220)}>
                <p className="mb-3 font-titulo text-[clamp(1.35rem,min(2vw,3.6vh),2.3rem)] font-bold leading-none">Busca visual</p>
                <p className="mb-[clamp(0.75rem,2vh,1.25rem)] ap-pequeno text-white/65">Uma criança perdida, por exemplo: cor da roupa, altura e o trecho de cada câmera.</p>
                <CartaoVisual id="V5" exemplo="3 registros encontrados" />
              </div>
              <div className="ap-in" style={d(340)}>
                <p className="mb-3 flex items-center gap-3 font-titulo text-[clamp(1.35rem,min(2vw,3.6vh),2.3rem)] font-bold leading-none">
                  Alertas e lista de restrição <SeloSobProjeto />
                </p>
                <p className="mb-[clamp(0.75rem,2vh,1.25rem)] ap-pequeno text-white/65">Aviso para a equipe quando alguém da lista entra ou a cerca é cruzada fora do horário.</p>
                <ListaRestricao />
              </div>
            </div>
          </div>
        </Slide>

        {/* 8 · O painel */}
        <Slide id="o-painel" rotulo="O painel">
          <Bloco
            rotulo="O painel"
            titulo="O shopping inteiro numa tela."
            texto="No computador e no celular. E o Pergunte à AIP responde com os números do painel."
            proporcao="lg:grid-cols-[0.55fr_1.45fr]"
            visual={
              <>
                <PainelExemplo />
                <p className="mt-3 text-[clamp(0.65rem,1.2vh,0.8rem)] text-white/40">Reprodução do painel com dados de exemplo.</p>
              </>
            }
          />
        </Slide>

        {/* 9 · Economia */}
        <Slide id="economia" rotulo="Economia">
          <Bloco rotulo="Economia" titulo="A inteligência de câmeras novas, sem trocar as que o shopping já tem." visual={<Economia />} proporcao="lg:grid-cols-[0.8fr_1.2fr]" />
        </Slide>

        {/* 10 · Privacidade e LGPD */}
        <Slide id="privacidade" rotulo="Privacidade e LGPD">
          <Bloco
            rotulo="Privacidade e LGPD"
            titulo="Informação com responsabilidade."
            texto="Processamento sob controle da AIP, de acordo com a LGPD."
            itens={[
              "Acesso só com login, por perfil, e registro de auditoria.",
              "Gestão com números agregados; imagens só para a segurança.",
              "Placas usadas só no controle do estacionamento.",
              "Reconhecimento facial só para a lista de restrição. Os demais rostos não são guardados.",
            ]}
            visual={
              <div className="grid grid-cols-2 gap-[clamp(0.6rem,1.2vw,1rem)]">
                {(
                  [
                    ["escudo", "LGPD"],
                    ["equipe", "Perfis de acesso"],
                    ["visto", "Auditoria"],
                    ["painel", "Dados agregados"],
                  ] as [NomeIcone, string][]
                ).map(([icone, t], i) => (
                  <div key={t} className="ap-in flex flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-[clamp(1rem,2vw,1.75rem)] lg:min-h-[20vh]" style={d(300 + i * 90)}>
                    <Icone nome={icone} className="h-[clamp(1.75rem,4.5vh,2.75rem)] w-[clamp(1.75rem,4.5vh,2.75rem)] text-[#5FD3FF]" />
                    <span className="mt-auto pt-[clamp(1rem,3vh,2rem)] font-titulo text-[clamp(1.2rem,min(1.8vw,3.2vh),2rem)] font-bold leading-none">{t}</span>
                  </div>
                ))}
              </div>
            }
          />
        </Slide>

        {/* 11 · Próximos passos */}
        <Slide id="proximos-passos" rotulo="Próximos passos">
          <div className="ap-margem">
            <Rotulo>Próximos passos</Rotulo>
            <h2 className="ap-in ap-titulo-p max-w-[30ch]" style={d(80)}>
              Da definição das câmeras à primeira versão em 10 a 15 dias.
            </h2>
            <div className="ap-fade mt-[clamp(2.5rem,8vh,5rem)]" style={d(250)}>
              <Rota etapas={PASSOS} />
            </div>
          </div>
        </Slide>

        {/* 12 · Investimento */}
        <Slide id="investimento" rotulo="Investimento">
          <div className="ap-margem grid items-center gap-x-[5vw] gap-y-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Rotulo>Investimento</Rotulo>
              <h2 className="ap-in ap-titulo-m" style={d(80)}>
                As câmeras que o shopping já tem, com a IA da AIP.
              </h2>
            </div>
            <div className="ap-in relative rounded-2xl border border-[#5FD3FF]/35 bg-[#5FD3FF]/[0.045] p-[clamp(1.25rem,3vh,2.25rem)]" style={d(300)}>
              <p className="ap-pequeno text-white/55">Mensalidade</p>
              <p className="ap-num mt-1 text-[clamp(2rem,min(3.6vw,6.4vh),4.2rem)] font-bold leading-none text-[#5FD3FF]">[A DEFINIR]</p>
              <div className="mt-[clamp(1rem,3vh,2rem)] border-t border-white/10 pt-[clamp(1rem,3vh,2rem)]">
                <p className="ap-pequeno text-white/70">
                  Setup de{" "}
                  <span className="relative inline-block whitespace-nowrap text-white">
                    [A DEFINIR]
                    <span aria-hidden className="ap-linha-x absolute left-[-3%] top-1/2 h-[2px] w-[106%] -translate-y-1/2 bg-[#5FD3FF]" style={{ "--d": "1000ms", "--t": "550ms" } as React.CSSProperties} />
                  </span>{" "}
                  (aplicação da IA, configuração e painel): isento para o Caruaru Shopping.
                </p>
                <span className="mt-[clamp(0.6rem,1.8vh,1rem)] inline-block rotate-[-4deg]">
                  <span className="ap-in block rounded-md border-2 border-[#5FD3FF] px-3 py-0.5 font-titulo text-[clamp(1rem,min(1.6vw,2.8vh),1.6rem)] font-bold tracking-[0.2em] text-[#5FD3FF] shadow-[0_0_24px_rgb(95_211_255/0.25)]" style={d(1500)}>
                    ISENTO
                  </span>
                </span>
              </div>
              <div className="mt-[clamp(1rem,3vh,2rem)] border-t border-white/10 pt-[clamp(1rem,3vh,2rem)]">
                <p className="ap-pequeno text-white/55">Período de teste</p>
                <p className="mt-1 ap-item text-white">[A DEFINIR]</p>
              </div>
            </div>
          </div>
        </Slide>

        {/* 13 · Encerramento */}
        <Slide id="encerramento" rotulo="Encerramento" className="text-center">
          <div aria-hidden className="ap-grade" />
          <div className="ap-margem relative">
            <p className="ap-in ap-titulo-m mx-auto max-w-[26ch]" style={d(100)}>
              Vamos tornar o Caruaru Shopping mais seguro, mais eficiente e ainda mais inteligente.
            </p>
            <div className="ap-in mt-[clamp(2rem,6vh,4rem)] flex items-center justify-center gap-[clamp(1rem,2.5vw,2.5rem)]" style={d(400)}>
              <LogoAIPNome logo="h-[clamp(1.6rem,4.4vh,3rem)]" nome="text-[clamp(0.45rem,0.85vh,0.62rem)]" />
              <span aria-hidden className="h-[clamp(2.5rem,7vh,5rem)] w-px bg-white/20" />
              <LogoCaruaru className="h-[clamp(3.5rem,10vh,7rem)] shrink-0" />
            </div>
          </div>
        </Slide>
      </main>
    </>
  );
}
