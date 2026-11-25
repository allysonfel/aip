"use client";

import type { ReactNode } from "react";
import { type NomeIcone } from "../_compartilhado/Icones";
import { LogoAIPNome } from "../_compartilhado/Logos";
import { Marca, Moldura, Rotulo, useNavegacao } from "../_compartilhado/Moldura";
import { d, Slide } from "../_compartilhado/slide";
import { ListaRestricao, Rota } from "../caruaru-shopping-proposta/Visuais";
import { AlertaRuptura, Caixas, CamaraFria, Cartao, Conversao, Doca, EpiAlimentos, Gondola, LogoBonanza, Mini, PlacaBorrada, PontaGondola, Riscos, SeloOpcional } from "./Visuais";

// Apresentação comercial exclusiva do Bonanza Supermercados (página oculta: sem
// link no site, fora do sitemap, noindex, fora da regra de idiomas). Números são
// de demonstração (selo EXEMPLO); ilustrações em linha, sem câmera real, rostos,
// placas legíveis ou marca de outros supermercados.

const TOTAL = 15;

/** Título forte + até duas linhas de texto, com o visual ao lado. */
function Bloco({ rotulo, titulo, texto, visual, itens, selo, nota, proporcao = "lg:grid-cols-[0.85fr_1.15fr]" }: { rotulo: string; titulo: string; texto?: string; visual: ReactNode; itens?: ReactNode[]; selo?: ReactNode; nota?: string; proporcao?: string }) {
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
        {nota && (
          <p className="ap-in mt-[clamp(0.9rem,2.4vh,1.5rem)] text-[clamp(0.65rem,1.2vh,0.8rem)] text-white/45" style={d(700)}>
            {nota}
          </p>
        )}
      </div>
      <div className="ap-in" style={d(220)}>
        {visual}
      </div>
    </div>
  );
}

/** Título do slide com cartões embaixo. */
function Grade({ rotulo, titulo, colunas, children, rodape }: { rotulo: string; titulo: string; colunas: string; children: ReactNode; rodape?: ReactNode }) {
  return (
    <div className="ap-margem">
      <Rotulo>{rotulo}</Rotulo>
      <h2 className="ap-in ap-titulo-p max-w-[34ch]" style={d(80)}>
        {titulo}
      </h2>
      <div className={`mt-[clamp(1.25rem,4vh,2.75rem)] grid gap-[clamp(0.75rem,1.4vw,1.5rem)] ${colunas}`}>{children}</div>
      {rodape}
    </div>
  );
}

const ROTA: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "camera", titulo: "Câmeras", texto: "as da loja, e uma simples por gôndola onde for preciso." },
  { icone: "ia", titulo: "Inteligência artificial", texto: "prateleiras, filas, pessoas e veículos, minuto a minuto." },
  { icone: "painel", titulo: "Painel e alertas", texto: "no computador e no celular." },
  { icone: "equipe", titulo: "Equipe age", texto: "reposição, caixa e segurança." },
];

const PILOTO: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "alerta", titulo: "Ruptura", texto: "em 2 a 3 corredores críticos." },
  { icone: "equipe", titulo: "Filas nos caixas", texto: "contagem, alerta e espera média." },
  { icone: "escudo", titulo: "Prevenção de perdas", texto: "alto valor e saída." },
  { icone: "painel", titulo: "Fluxo e conversão", texto: "entradas x cupons." },
];

const PASSOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "busca", titulo: "Levantamento", texto: "Definição das câmeras, corredores e pontos de interesse com a equipe do Bonanza." },
  { icone: "ia", titulo: "Aplicação", texto: "Configuração da inteligência artificial em cada câmera." },
  { icone: "painel", titulo: "Entrega", texto: "Primeira versão em 10 a 15 dias após a definição das câmeras. Depois, testes e ajustes até a versão final em operação." },
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
                <LogoBonanza className="h-[clamp(3.25rem,9vh,6.5rem)]" />
              </span>
            </div>
            <h1 className="ap-in ap-titulo-m mt-[clamp(2.5rem,8vh,5.5rem)] max-w-[26ch]" style={d(300)}>
              Inteligência artificial aplicada à operação, à segurança e à gestão do Bonanza.
            </h1>
          </div>
        </Slide>

        {/* 2 · O desafio */}
        <Slide id="desafio" rotulo="O desafio">
          <div className="ap-margem grid items-end gap-x-[5vw] gap-y-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <Rotulo>O desafio</Rotulo>
              <h2 className="ap-titulo max-w-[20ch]">
                <span className="ap-in block" style={d(80)}>
                  Produto em falta, fila no caixa e perdas acontecem todos os dias.
                </span>
                <span className="ap-in block text-[#5FD3FF]" style={d(200)}>
                  Quase nada vira informação a tempo.
                </span>
              </h2>
            </div>
            <div className="ap-in border-l border-[#5FD3FF]/50 pl-[clamp(1rem,2vw,2rem)]" style={d(500)}>
              <p className="ap-rotulo text-white/55">A proposta</p>
              <p className="mt-3 font-titulo text-[clamp(1.5rem,min(2.4vw,4.2vh),2.75rem)] font-semibold leading-[1.1]">As câmeras do Bonanza com a inteligência artificial da AIP, avisando a equipe na hora certa.</p>
            </div>
          </div>
        </Slide>

        {/* 3 · Como funciona */}
        <Slide id="como-funciona" rotulo="Como funciona">
          <div className="ap-margem">
            <Rotulo>Como funciona</Rotulo>
            <h2 className="ap-in ap-titulo-p max-w-[30ch]" style={d(80)}>
              A IA lê as imagens e entrega a informação pronta para quem age.
            </h2>
            <div className="ap-fade mt-[clamp(2.5rem,8vh,5rem)]" style={d(250)}>
              <Rota etapas={ROTA} />
            </div>
          </div>
        </Slide>

        {/* 4 · Ruptura de gôndola (ideia principal) */}
        <Slide id="ruptura" rotulo="Ruptura de gôndola">
          <div className="ap-margem">
            <Rotulo>Ruptura de gôndola</Rotulo>
            <h2 className="ap-in ap-titulo-m max-w-[26ch]" style={d(80)}>
              Produto em falta é venda perdida. <span className="text-[#5FD3FF]">Agora você sabe na hora.</span>
            </h2>
            <p className="ap-in ap-texto mt-[clamp(0.6rem,1.8vh,1.2rem)] max-w-[52ch]" style={d(160)}>
              A câmera vê o espaço vazio na prateleira, tira uma foto e avisa o painel.
            </p>
            <div className="mt-[clamp(1.25rem,3.6vh,2.5rem)] grid items-center gap-[clamp(0.75rem,1.6vw,1.75rem)] lg:grid-cols-[1.45fr_0.85fr]">
              <div className="ap-in rounded-2xl border border-white/10 bg-[#111214] p-[clamp(0.8rem,1.6vw,1.3rem)]" style={d(260)}>
                <Gondola />
              </div>
              <AlertaRuptura />
            </div>
          </div>
        </Slide>

        {/* 5 · Filas nos caixas */}
        <Slide id="filas" rotulo="Filas nos caixas">
          <Bloco
            rotulo="Filas nos caixas"
            titulo="A fila cresceu, o caixa abre na hora."
            itens={["Contagem de pessoas por caixa", "Alerta “Abrir mais um caixa” quando passar do limite", "Tempo médio de espera por horário"]}
            visual={<Caixas />}
          />
        </Slide>

        {/* 6 · Operação da loja */}
        <Slide id="operacao" rotulo="Operação da loja">
          <Grade rotulo="Operação da loja" titulo="A loja funcionando, sem surpresa." colunas="lg:grid-cols-3">
            <Cartao visual={<Mini id="V4" />} titulo="Previsão de pico" texto="Por dia e horário, para escalar caixas e reposição." exemplo="Sábado, 10h às 12h: pico" atraso={220} />
            <Cartao visual={<Riscos />} titulo="Limpeza e riscos" texto="Líquido no chão, caixas no corredor, carrinhos acumulados." exemplo="Corredor 8 · líquido no chão" atraso={340} />
            <Cartao visual={<CamaraFria />} titulo="Câmara fria e depósito" texto="Porta aberta por muito tempo e pessoa fora do horário." exemplo="Câmara fria · aberta há 6 min" atraso={460} />
          </Grade>
        </Slide>

        {/* 7 · Recebimento e higiene */}
        <Slide id="recebimento" rotulo="Recebimento e higiene">
          <Grade rotulo="Recebimento e higiene" titulo="Da doca ao balcão, cada etapa medida." colunas="lg:grid-cols-2">
            <Cartao visual={<Doca />} titulo="Doca" texto="Tempo de descarga por fornecedor e caminhão parado esperando." exemplo="Fornecedor A · descarga em 42 min" atraso={220} alto="h-[clamp(7rem,20vh,13rem)]" />
            <Cartao visual={<EpiAlimentos />} titulo="EPI no açougue e na padaria" texto="Touca e luva conferidas em cada turno." exemplo="Açougue · sem luva" atraso={340} alto="h-[clamp(7rem,20vh,13rem)]" />
          </Grade>
        </Slide>

        {/* 8 · Prevenção de perdas */}
        <Slide id="perdas" rotulo="Prevenção de perdas">
          <Bloco
            rotulo="Prevenção de perdas"
            titulo="Perda que vira alerta, não surpresa no balanço."
            itens={[
              "Áreas de alto valor (bebidas, carnes, cosméticos, chocolates): permanência e manuseio fora do padrão",
              "Saída sem passar no caixa",
              "Caixa: produto que passa sem registro, integrado ao sistema de vendas",
              "Autoatendimento: item não bipado, onde houver",
            ]}
            nota="Tudo por comportamento, sem identificar ninguém."
            proporcao="lg:grid-cols-[1.05fr_0.95fr]"
            visual={
              <div className="grid gap-[clamp(0.75rem,1.4vw,1.25rem)]">
                <Cartao visual={<Mini id="V19" />} titulo="Alto valor" texto="Permanência acima do padrão na área de bebidas." exemplo="Bebidas · 4 min parado" />
                <Cartao visual={<Mini id="V18" />} titulo="Saída" texto="Passagem pela saída sem passar no caixa." exemplo="Saída 1 · alerta às 19h08" atraso={120} />
              </div>
            }
          />
        </Slide>

        {/* 9 · Estacionamento e fora do horário */}
        <Slide id="estacionamento" rotulo="Estacionamento e fora do horário">
          <Grade rotulo="Estacionamento e fora do horário" titulo="Atenção também quando a loja fecha." colunas="lg:grid-cols-2">
            <Cartao visual={<PlacaBorrada />} titulo="Estacionamento" texto="Leitura de placas, veículo parado tempo demais e movimento à noite." exemplo="Vaga 14 · parado há 3h10" atraso={220} alto="h-[clamp(7rem,20vh,13rem)]" />
            <Cartao visual={<Mini id="V7" />} titulo="Depois do fechamento" texto="Pessoa na loja ou no depósito fora do horário." exemplo="Depósito · 23h14 · movimento" atraso={340} alto="h-[clamp(7rem,20vh,13rem)]" />
          </Grade>
        </Slide>

        {/* 10 · Lista de restrição (opcional) */}
        <Slide id="lista-de-restricao" rotulo="Lista de restrição">
          <Bloco
            rotulo="Lista de restrição"
            titulo="Aviso quando alguém da lista entra na loja."
            selo={<SeloOpcional />}
            texto="Lista definida pelo Bonanza, só com ocorrência registrada em boletim. A segurança confirma; nada acontece de forma automática."
            nota="Módulo opcional, sujeito a validação jurídica e às regras da LGPD."
            visual={<ListaRestricao />}
          />
        </Slide>

        {/* 11 · Gestão comercial */}
        <Slide id="gestao-comercial" rotulo="Gestão comercial">
          <Grade
            rotulo="Gestão comercial"
            titulo="Quem entra, por onde anda e o que faz parar."
            colunas="lg:grid-cols-3"
            rodape={
              <p className="ap-in mt-[clamp(1rem,3vh,2rem)] border-l border-[#5FD3FF]/50 pl-4 font-titulo text-[clamp(1.1rem,min(1.7vw,3vh),1.8rem)] font-semibold text-white/90" style={d(800)}>
                Dado que vale também para negociar com fornecedores.
              </p>
            }
          >
            <Cartao visual={<Conversao />} titulo="Fluxo e conversão" texto="Entradas x compras, cruzando com o número de cupons." exemplo="Sábado · 3.420 entradas" atraso={220} />
            <Cartao visual={<Mini id="V2" />} titulo="Mapa de calor" texto="Onde o cliente circula e para em cada corredor." exemplo="Corredor 3: 31% do fluxo" atraso={340} />
            <Cartao visual={<PontaGondola />} titulo="Ponta de gôndola e promoções" texto="Quantas pessoas param e por quanto tempo." exemplo="Ponta 2 · 412 paradas, 38 s" atraso={460} />
          </Grade>
        </Slide>

        {/* 12 · Piloto recomendado */}
        <Slide id="piloto" rotulo="Piloto recomendado">
          <div className="ap-margem">
            <Rotulo>Piloto recomendado</Rotulo>
            <h2 className="ap-in ap-titulo-p max-w-[30ch]" style={d(80)}>
              Quatro módulos para começar.
            </h2>
            <div className="ap-fade mt-[clamp(2.5rem,8vh,5rem)]" style={d(250)}>
              <Rota etapas={PILOTO} />
            </div>
            <p className="ap-in mx-auto mt-[clamp(2rem,6vh,4rem)] max-w-[70ch] text-center text-[clamp(0.7rem,1.3vh,0.9rem)] text-white/50" style={d(2400)}>
              Para a ruptura, pode ser necessária uma câmera simples apontada para cada gôndola monitorada. Definimos no levantamento.
            </p>
          </div>
        </Slide>

        {/* 13 · Próximos passos */}
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

        {/* 14 · Investimento */}
        <Slide id="investimento" rotulo="Investimento">
          <div className="ap-margem grid items-center gap-x-[5vw] gap-y-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Rotulo>Investimento</Rotulo>
              <h2 className="ap-in ap-titulo-m" style={d(80)}>
                A inteligência da AIP nas câmeras do Bonanza.
              </h2>
            </div>
            <div className="ap-in relative rounded-2xl border border-[#5FD3FF]/35 bg-[#5FD3FF]/[0.045] p-[clamp(1.25rem,3vh,2.25rem)]" style={d(300)}>
              <p className="ap-pequeno text-white/55">Mensalidade</p>
              <p className="mt-1 font-titulo text-[clamp(1.5rem,min(2.4vw,4.2vh),2.75rem)] font-semibold leading-[1.1] text-white">Definida conforme o número de câmeras e módulos do projeto.</p>
              <div className="mt-[clamp(1rem,3vh,2rem)] border-t border-white/10 pt-[clamp(1rem,3vh,2rem)]">
                <p className="ap-pequeno text-white/55">Setup: aplicação da IA, configuração e painel</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <p className="font-titulo text-[clamp(1.5rem,min(2.4vw,4.2vh),2.75rem)] font-semibold leading-[1.1] text-[#5FD3FF]">Isento para o Bonanza.</p>
                  <span className="inline-block rotate-[-4deg]">
                    <span className="ap-in block rounded-md border-2 border-[#5FD3FF] px-3 py-0.5 font-titulo text-[clamp(1rem,min(1.6vw,2.8vh),1.6rem)] font-bold tracking-[0.2em] text-[#5FD3FF] shadow-[0_0_24px_rgb(95_211_255/0.25)]" style={d(1200)}>
                      ISENTO
                    </span>
                  </span>
                </div>
              </div>
              <div className="mt-[clamp(1rem,3vh,2rem)] border-t border-white/10 pt-[clamp(1rem,3vh,2rem)]">
                <p className="ap-pequeno text-white/55">Período de teste</p>
                <p className="mt-1 font-titulo text-[clamp(1.5rem,min(2.4vw,4.2vh),2.75rem)] font-semibold leading-[1.1] text-white">30 dias, a partir da entrega da primeira versão.</p>
              </div>
            </div>
          </div>
        </Slide>

        {/* 15 · Encerramento */}
        <Slide id="encerramento" rotulo="Encerramento" className="text-center">
          <div aria-hidden className="ap-grade" />
          <div className="ap-margem relative">
            <p className="ap-in ap-titulo-m mx-auto max-w-[26ch]" style={d(100)}>
              Vamos tornar o Bonanza mais eficiente, mais seguro e ainda mais inteligente.
            </p>
            <div className="ap-in mt-[clamp(2rem,6vh,4rem)] flex items-center justify-center gap-[clamp(1rem,2.5vw,2.5rem)]" style={d(400)}>
              <LogoAIPNome logo="h-[clamp(1.6rem,4.4vh,3rem)]" nome="text-[clamp(0.45rem,0.85vh,0.62rem)]" />
              <span aria-hidden className="h-[clamp(2.5rem,7vh,5rem)] w-px bg-white/20" />
              <LogoBonanza className="h-[clamp(2rem,5.5vh,3.75rem)] shrink-0" />
            </div>
          </div>
        </Slide>
      </main>
    </>
  );
}
