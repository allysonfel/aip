"use client";

import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "../_compartilhado/Icones";
import { LinhaDoTempo, type EtapaLinha } from "../_compartilhado/LinhaDoTempo";
import { LogoAIPNome } from "../_compartilhado/Logos";
import { dois, Marca, Moldura, Rotulo, useNavegacao } from "../_compartilhado/Moldura";
import { d, Slide } from "../_compartilhado/slide";
import { CartaoVisual, ChatExemplo, ListaRestricao, LogoCaruaru, PainelExemplo, Rota, SeloSobProjeto } from "./Visuais";

// Apresentação comercial exclusiva do Caruaru Shopping (página oculta: sem link
// no site, fora do sitemap, noindex, fora da regra de idiomas). Mostra o que o
// painel /shopping-caruaru já faz. Números são de demonstração (selo EXEMPLO);
// nenhuma imagem de câmera, rosto, placa, nome de câmera ou da planta.

const TOTAL = 17;
const FUNCOES = 7;

/** Função do painel: número, título e frase à esquerda; mini gráfico à direita. */
function Funcao({ n, titulo, frase, itens, visual, selo }: { n: number; titulo: string; frase: string; itens?: string[]; visual: ReactNode; selo?: ReactNode }) {
  return (
    <div className="ap-margem grid items-center gap-x-[6vw] gap-y-10 lg:grid-cols-[1fr_1.05fr]">
      <div>
        <div className="ap-in flex items-end gap-5" style={d(0)}>
          <span className="ap-num text-[clamp(3rem,min(6vw,11vh),7.5rem)] font-bold leading-[0.8] text-[#5FD3FF]">{dois(n)}</span>
          <span aria-hidden className="mb-[0.4em] flex gap-1.5">
            {Array.from({ length: FUNCOES }, (_, k) => k + 1).map((k) => (
              <span key={k} className={`h-[3px] w-5 rounded-full ${k === n ? "bg-[#5FD3FF]" : k < n ? "bg-white/45" : "bg-white/15"}`} />
            ))}
          </span>
        </div>
        <h2 className="ap-in ap-titulo-m mt-[clamp(1rem,3vh,2rem)] uppercase" style={d(80)}>
          {titulo}
        </h2>
        {selo && (
          <div className="ap-in mt-3" style={d(120)}>
            {selo}
          </div>
        )}
        <p className="ap-in ap-texto mt-[clamp(0.75rem,2.4vh,1.5rem)] max-w-[36ch]" style={d(160)}>
          {frase}
        </p>
        {itens && (
          <ul className="mt-[clamp(1rem,3vh,2rem)] border-b border-white/10">
            {itens.map((t, i) => (
              <li key={t} className="ap-in ap-pequeno flex gap-4 border-t border-white/10 py-[clamp(0.6rem,1.7vh,1.05rem)] text-white/80" style={d(260 + i * 90)}>
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

const ETAPAS: EtapaLinha[] = [
  { n: "01", titulo: "Levantamento", frase: "das câmeras e dos pontos de interesse. Prazo: [A DEFINIR].", icone: "busca" },
  { n: "02", titulo: "Configuração", frase: "linhas de contagem e áreas em cada câmera. Prazo: [A DEFINIR].", icone: "mapa" },
  { n: "03", titulo: "Ajustes", frase: "conferência das contagens com o movimento real. Prazo: [A DEFINIR].", icone: "visto" },
  { n: "04", titulo: "Operação", frase: "painel em uso pela administração e pela segurança.", icone: "painel" },
];

const ROTA: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "camera", titulo: "Câmeras existentes", texto: "as que o shopping já tem." },
  { icone: "ia", titulo: "Processamento com IA", texto: "pessoas, fluxos e áreas, minuto a minuto." },
  { icone: "painel", titulo: "Painel", texto: "números e mapas no computador e no celular." },
  { icone: "equipe", titulo: "Decisão e ação", texto: "da administração e da segurança." },
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

        {/* 2 · O desafio */}
        <Slide id="o-desafio" rotulo="O desafio">
          <div className="ap-margem">
            <Rotulo>O desafio</Rotulo>
            <h2 className="ap-titulo max-w-[18ch]">
              <span className="ap-in block" style={d(80)}>
                Um shopping gera informação o tempo todo.
              </span>
              <span className="ap-in block text-[#5FD3FF]" style={d(200)}>
                Quase nada vira dado para decisão.
              </span>
            </h2>
            <ul className="mt-[clamp(2rem,7vh,4.5rem)] flex flex-wrap gap-2.5">
              {["Fluxo de visitantes", "Ocupação das áreas", "Horários de pico", "Corredores vazios", "Ocorrências"].map((c, i) => (
                <li key={c} className="ap-in ap-pequeno rounded-full border border-white/15 px-[1.1em] py-[0.45em] text-white/75" style={d(450 + i * 90)}>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </Slide>

        {/* 3 · A proposta */}
        <Slide id="a-proposta" rotulo="A proposta">
          <div className="ap-margem">
            <Rotulo>A proposta</Rotulo>
            <h2 className="ap-in ap-titulo-m max-w-[24ch]" style={d(80)}>
              As câmeras que o shopping já tem, com a inteligência artificial da AIP.
            </h2>
            <div className="mt-[clamp(2.5rem,8vh,5rem)] grid gap-[clamp(0.75rem,1.4vw,1.5rem)] md:grid-cols-2">
              {(
                [
                  ["painel", "Gestão", "Fluxo, ocupação, picos e comparativos para a administração e os lojistas."],
                  ["escudo", "Segurança", "Busca de pessoas por características e câmeras acompanhadas em tempo real."],
                ] as [NomeIcone, string, string][]
              ).map(([icone, titulo, texto], i) => (
                <div key={titulo} className="ap-in rounded-2xl border border-white/10 bg-white/[0.025] p-[clamp(1.25rem,2.2vw,2.25rem)]" style={d(250 + i * 120)}>
                  <Icone nome={icone} className="h-[clamp(2rem,5vh,3rem)] w-[clamp(2rem,5vh,3rem)] text-[#5FD3FF]" />
                  <h3 className="mt-[clamp(1rem,3vh,2rem)] font-titulo text-[clamp(1.6rem,min(2.4vw,4.4vh),2.9rem)] font-bold leading-none">{titulo}</h3>
                  <p className="mt-3 ap-pequeno max-w-[40ch] text-white/65">{texto}</p>
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* 4 · Como funciona */}
        <Slide id="como-funciona" rotulo="Como funciona">
          <div className="ap-margem">
            <Rotulo>Como funciona</Rotulo>
            <h2 className="ap-in ap-titulo-p max-w-[32ch]" style={d(80)}>
              Sem trocar equipamento: a IA lê as imagens e o painel entrega a informação pronta.
            </h2>
            <div className="ap-fade mt-[clamp(2.5rem,8vh,5rem)]" style={d(250)}>
              <Rota etapas={ROTA} />
            </div>
          </div>
        </Slide>

        {/* 5 a 11 · Funções */}
        <Slide id="fluxo" rotulo="01 Fluxo por entrada e corredor">
          <Funcao n={1} titulo="Fluxo por entrada e corredor" frase="Quantas pessoas entram, por onde e em que horário." itens={["Contagem com direção: entrada e saída", "Ocupação de cada área ao longo do dia", "Câmeras ao vivo com a contagem na tela"]} visual={<CartaoVisual id="V1" exemplo="1.248 entradas no acesso principal" />} />
        </Slide>

        <Slide id="mapa-de-calor" rotulo="02 Mapa de calor e rotas">
          <Funcao n={2} titulo="Mapa de calor e rotas" frase="Onde o público circula, onde para e quais caminhos usa." itens={["Áreas mais visitadas de cada piso", "Caminhos entre entradas, lojas e praças", "Exportação dos dados para planilha"]} visual={<CartaoVisual id="V2" exemplo="Corredor B: 42% do fluxo" />} />
        </Slide>

        <Slide id="zonas-mortas" rotulo="03 Zonas mortas">
          <Funcao n={3} titulo="Zonas mortas" frase="As áreas abaixo da média, para a administração agir sobre elas." itens={["Comparação de cada área com a média do shopping", "Acompanhamento das ações para movimentar a área"]} visual={<CartaoVisual id="V3" exemplo="Ala sul: −38% do movimento" />} />
        </Slide>

        <Slide id="comparativos" rotulo="04 Comparativos e datas comerciais">
          <Funcao n={4} titulo="Comparativos e datas comerciais" frase="Períodos, dias da semana e datas como Dia das Mães e Black Friday, lado a lado." itens={["Média por dia da semana", "Calendário de datas comerciais já calculado"]} visual={<CartaoVisual id="V4" exemplo="Sábado: +46% sobre a média" />} />
        </Slide>

        <Slide id="pergunte-a-aip" rotulo="05 Pergunte à AIP">
          <Funcao n={5} titulo="Pergunte à AIP" frase="Perguntas em português, respostas com os números do painel." itens={["Responde só o que cada usuário pode ver", "Limite de perguntas por dia definido pelo shopping"]} visual={<ChatExemplo />} />
        </Slide>

        <Slide id="crianca-perdida" rotulo="06 Busca de criança perdida">
          <Funcao n={6} titulo="Busca de criança perdida" frase="A família descreve a criança e a IA procura nas câmeras." itens={["Cor da roupa de cima e de baixo", "Menino ou menina e faixa de altura", "Trecho do vídeo de cada câmera onde ela aparece"]} visual={<CartaoVisual id="V5" exemplo="3 registros encontrados" />} />
        </Slide>

        <Slide id="lista-de-restricao" rotulo="07 Lista de restrição">
          <Funcao
            n={7}
            titulo="Lista de restrição"
            selo={<SeloSobProjeto />}
            frase="Pessoas cadastradas pela segurança, como autores de furtos, são reconhecidas ao entrar no shopping."
            itens={["Cadastro feito só pela segurança do shopping", "Aviso para a equipe com a câmera e o horário", "Avaliação jurídica antes de entrar em operação"]}
            visual={<ListaRestricao />}
          />
        </Slide>

        {/* 12 · O painel */}
        <Slide id="o-painel" rotulo="O painel">
          <div className="ap-margem grid items-center gap-x-[4vw] gap-y-10 lg:grid-cols-[0.55fr_1.45fr]">
            <div>
              <Rotulo>O painel</Rotulo>
              <h2 className="ap-in ap-titulo-p" style={d(80)}>
                O shopping inteiro numa tela, no computador e no celular.
              </h2>
              <p className="ap-in ap-pequeno mt-[clamp(1rem,3vh,2rem)] max-w-[34ch] text-white/65" style={d(180)}>
                Cada pessoa vê só as abas do seu perfil.
              </p>
            </div>
            <div>
              <PainelExemplo />
              <p className="ap-fade mt-3 text-[clamp(0.65rem,1.2vh,0.8rem)] text-white/40" style={d(900)}>
                Reprodução do painel com dados de exemplo.
              </p>
            </div>
          </div>
        </Slide>

        {/* 13 · Para a administração e para os lojistas */}
        <Slide id="administracao-e-lojistas" rotulo="Para a administração e para os lojistas">
          <div className="ap-margem">
            <Rotulo>Para a administração e para os lojistas</Rotulo>
            <h2 className="ap-in ap-titulo-p max-w-[30ch]" style={d(80)}>
              Decisões com números, e não com impressão.
            </h2>
            <ul className="mt-[clamp(2rem,7vh,4.5rem)] grid gap-[clamp(0.75rem,1.4vw,1.5rem)] sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["Horários de pico", "Equipes de limpeza, segurança e atendimento onde e quando o público está."],
                  ["Campanhas", "Antes e depois de cada ação, medido no fluxo real."],
                  ["Ocupação de áreas", "Praça de alimentação, eventos e corredores acompanhados ao longo do dia."],
                  ["Lojistas", "Dados de fluxo que ajudam na negociação e na escolha de espaços."],
                ] as [string, string][]
              ).map(([titulo, texto], i) => (
                <li key={titulo} className="ap-in flex flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-[clamp(1.25rem,2vw,2rem)] lg:min-h-[34vh]" style={d(220 + i * 100)}>
                  <span className="ap-num text-[clamp(1rem,1.8vh,1.25rem)] tracking-[0.18em] text-white/45">{dois(i + 1)}</span>
                  <h3 className="mt-auto pt-[clamp(1.25rem,5vh,3rem)] font-titulo text-[clamp(1.5rem,min(2.2vw,4vh),2.6rem)] font-bold leading-[1.02]">{titulo}</h3>
                  <p className="mt-3 ap-pequeno text-white/65">{texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </Slide>

        {/* 14 · Segurança e privacidade */}
        <Slide id="seguranca-e-privacidade" rotulo="Segurança e privacidade">
          <div className="ap-margem grid items-center gap-x-[6vw] gap-y-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Rotulo>Segurança e privacidade</Rotulo>
              <h2 className="ap-in ap-titulo-m" style={d(80)}>
                Informação com responsabilidade.
              </h2>
              <p className="ap-in ap-texto mt-[clamp(1rem,3vh,2rem)] max-w-[34ch]" style={d(160)}>
                Processamento sob controle da AIP, de acordo com a LGPD.
              </p>
            </div>
            <ul className="border-b border-white/10">
              {[
                "Acesso só com login, por perfil: segurança, administração e quem o shopping definir.",
                "Registro de auditoria de cada acesso e alteração.",
                "Saúde das câmeras: o painel mostra quais estão online.",
                "Gestão com números agregados; imagens só para a segurança.",
                "Reconhecimento facial só para a lista de restrição. Os demais rostos não são guardados.",
              ].map((t, i) => (
                <li key={t} className="ap-in ap-item flex gap-4 border-t border-white/10 py-[clamp(0.8rem,2.2vh,1.4rem)]" style={d(260 + i * 90)}>
                  <Marca />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </Slide>

        {/* 15 · Implantação */}
        <Slide id="implantacao" rotulo="Implantação">
          <div className="ap-margem">
            <Rotulo>Implantação</Rotulo>
            <h2 className="ap-in ap-titulo-p max-w-[30ch]" style={d(80)}>
              Sobre a estrutura que o shopping já tem, em quatro etapas.
            </h2>
            <div className="ap-fade mt-[clamp(2.5rem,8vh,5rem)]" style={d(150)}>
              <LinhaDoTempo etapas={ETAPAS} ramo={null} ramoCelular={null} />
            </div>
          </div>
        </Slide>

        {/* 16 · Investimento */}
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

        {/* 17 · Encerramento */}
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
