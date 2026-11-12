import Link from "next/link";
import type { ReactNode } from "react";
import { metadados } from "../_config/metadados";
import { Acordeao, Botao, Cabecalho, Encerramento, Hero } from "../_components/Base";
import Calculadora from "../_components/Calculadora";
import Carrossel from "../_components/Carrossel";
import { CartaoSegmento } from "../_components/Cartoes";
import ComoFunciona from "../_components/ComoFunciona";
import Reveal from "../_components/Reveal";
import { SEGMENTOS } from "../_content/solucoes";
import { ECONOMIA } from "../_config/economia";

export const metadata = metadados("/cameras-ia", "Câmeras IA", "Inteligência artificial nas câmeras que você já tem, sem trocar equipamento: detecção de pessoas, análise de fluxos e busca de registros.");

const CONTATO = "/contato?produto=cameras-ia";

const FAQ: { p: string; r: ReactNode }[] = [
  { p: "Preciso trocar minhas câmeras atuais?", r: "Não necessariamente. Câmeras compatíveis com os requisitos técnicos podem ser usadas. Avaliamos a sua estrutura antes da implantação." },
  { p: "A solução funciona à noite?", r: "Sim, dentro das condições da câmera. O desempenho depende da iluminação e da qualidade das imagens." },
  { p: "A AIP faz reconhecimento facial?", r: "Sim, sob projeto. A AIP pode identificar pessoas pelo rosto, mediante avaliação técnica e jurídica, conforme a finalidade e a legislação aplicável. Também é possível localizar pessoas por características como roupas e cores." },
  { p: "Quanto tempo leva a implantação?", r: "Depende da quantidade de câmeras, da infraestrutura e da configuração necessária. Após a avaliação técnica, informamos o prazo do seu projeto." },
  {
    p: "A AIP atende só os segmentos apresentados no site?",
    r: (
      <p>
        Não. Os segmentos do site são exemplos de aplicação. Atendemos qualquer operação que use câmeras e desenvolvemos soluções sob medida para cada necessidade. Conte o seu caso para a nossa equipe.{" "}
        <Link href={CONTATO} className="text-white underline underline-offset-4 hover:text-[#5FD3FF]">
          Fale com a gente
        </Link>
      </p>
    ),
  },
  { p: "Quem pode acessar o sistema?", r: "O acesso é organizado por perfis e permissões. Cada pessoa vê apenas o que precisa." },
];

// Ícones em linha fina dos destaques da economia.
const ICONES: Record<string, ReactNode> = {
  obra: <path d="M4 20h16 M6 20V10l6-5 6 5v10 M10 20v-5h4v5 M3 3l18 18" />,
  cabo: <path d="M4 12h5 M15 12h5 M9 9v6 M15 9v6 M9 12h6 M3 3l18 18" />,
  rapido: <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" />,
};

function Destaques({ itens }: { itens: [keyof typeof ICONES, string][] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-3">
      {itens.map(([icone, texto], i) => (
        <li key={texto}>
          <Reveal atraso={i * 90} className="flex items-center gap-4 border-t border-white/10 pt-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-[#5FD3FF]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {ICONES[icone]}
              </svg>
            </span>
            <span className="font-medium text-white/90">{texto}</span>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

export default function CamerasIA() {
  return (
    <>
      {/* 1. Hero */}
      <Hero
        titulo="As câmeras que você já tem, agora com IA."
        texto="Sem trocar equipamento: a AIP conecta inteligência artificial à sua estrutura atual, que passa a detectar pessoas, analisar fluxos e localizar registros."
        botoes={<Botao href={CONTATO}>Solicitar demonstração</Botao>}
        midia={{ foto: "camera-ia-lente-limpa.jpg", alt: "Lente de uma câmera de segurança refletindo uma via com pessoas e veículos marcados pela inteligência artificial", foco: "72% 50%" }}
      />

      {/* 2. Como funciona */}
      <section className="secao">
        <div className="margem">
          <Cabecalho titulo="Como funciona." />
          <ComoFunciona />
        </div>
      </section>

      {/* 3. Investimento e economia */}
      <section className="secao border-t border-linha">
        <div className="margem grid items-start gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-32">
            <p className="rotulo mb-4">Economia</p>
            <h2 className="titulo-secao">A inteligência de uma câmera com IA, sem trocar as suas.</h2>
            <p className="corpo mt-6">
              Uma câmera com inteligência artificial embarcada custa hoje entre R$ {ECONOMIA.precoMinimo.toLocaleString("pt-BR")} e R$ {ECONOMIA.precoMaximo.toLocaleString("pt-BR")} por unidade. A AIP leva a mesma inteligência para as câmeras que você já tem.
            </p>
            <div className="mt-8">
              <Botao href={CONTATO}>Quero uma simulação para minha operação</Botao>
            </div>
          </Reveal>
          <Reveal atraso={120}>
            <Calculadora />
            <p className="mt-4 text-xs leading-relaxed text-white/55">{ECONOMIA.nota}</p>
          </Reveal>
        </div>
        <div className="margem mt-16">
          <Destaques itens={[["obra", "Sem obra"], ["cabo", "Sem trocar cabeamento"], ["rapido", "Implantação mais rápida"]]} />
        </div>
      </section>

      {/* 4. Soluções para cada segmento */}
      <section className="secao overflow-hidden border-t border-linha">
        <div className="margem mb-10">
          <Cabecalho titulo="Soluções para cada segmento." texto="Veja como a AIP é aplicada no seu tipo de operação." />
        </div>
        <Reveal>
          <Carrossel rotulo="Soluções por segmento" largura="w-[78vw] sm:w-[360px]" itens={SEGMENTOS.map((s) => ({ chave: s.slug, conteudo: <CartaoSegmento segmento={s} linha={s.linhaCartao} cta="Ver solução" /> }))} />
        </Reveal>
      </section>

      {/* 5. Perguntas frequentes */}
      <div className="border-t border-linha">
        <Acordeao itens={FAQ} />
      </div>

      {/* 6. Encerramento */}
      <Encerramento titulo="Aproveite melhor as informações que suas câmeras registram." cta="Solicitar demonstração" href={CONTATO} />
    </>
  );
}
