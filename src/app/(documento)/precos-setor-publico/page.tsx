import type { Metadata } from "next";

// Precificação para o setor público (prefeituras, secretarias e órgãos):
// Câmeras IA e Totem IA. Página oculta (sem link no site, fora do sitemap,
// noindex), feita em páginas A4 para virar PDF. Texto exatamente como
// aprovado; imagens fornecidas pela AIP (sem banco de imagem).
export const metadata: Metadata = {
  title: { absolute: "AIP | Setor Público – Investimento" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

const M = "/site/media";
const TOTAL = 4;

const CAMERAS = [
  "IA aplicada às câmeras que o município já tem",
  "Detecção de pessoas e veículos em áreas e horários proibidos",
  "Leitura de placas",
  "Busca por características (roupa, cor, tipo de veículo)",
  "Contagem de pessoas e veículos",
  "Aglomeração, briga e correria",
  "Detecção de arma",
  "Reconhecimento facial com lista de procurados (sob autorização legal)",
  "Alerta de câmera tampada, virada ou desligada",
  "Painel e alertas em tempo real no WhatsApp, no celular e no computador",
  "Relatórios",
  "Suporte ativo",
];

const TOTEM = [
  "Totem em comodato: o equipamento é da AIP, sem investimento inicial",
  "4 câmeras com inteligência artificial (visão 360°), com todas as funções das Câmeras IA",
  "Giroflex acionado pela central",
  "Monitoramento pela Central AIP 24h",
  "Instalação, manutenção, reposição e internet 4G",
  "Painel e alertas em tempo real",
];

const CONDICOES = [
  "Sem trocar equipamento: a IA vai para as câmeras que o município já tem",
  "Câmeras novas, quando necessárias, com instalação isenta",
  "Totem sem investimento inicial de implantação: modelo de comodato",
  "Implantação, checagem presencial e suporte ativo pela equipe local",
  "LGPD, dados protegidos, perfis de acesso e auditoria",
  "Tecnologia brasileira",
];

const PASSOS = ["Diagnóstico das câmeras existentes", "Projeto dos pontos prioritários", "Implantação completa"];

function Visto() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.2 4.2L19 7" />
    </svg>
  );
}

function Logo({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- logo branco original, nítido no PDF.
  return <img src="/aip-logo.png" alt="AIP" className={className} />;
}

function Rodape({ n }: { n: number }) {
  return (
    <footer className="rodape">
      <Logo />
      <span className="sep" aria-hidden />
      <span>aipbrasil.com</span>
      <span className="num">
        {String(n).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
      </span>
    </footer>
  );
}

function Foto({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- imagem original em alta, carregada antes de gerar o PDF.
  return <img src={src} alt={alt} className={className} loading="eager" decoding="sync" />;
}

export default function PrecosSetorPublico() {
  return (
    <main className="doc-folhas">
      {/* 1 · Capa */}
      <section className="pagina" aria-label="Capa">
        <div className="capa-foto">
          <Foto src={`${M}/cenario-vias.jpg`} alt="Totem IA da AIP numa esquina movimentada da cidade" />
        </div>
        <figure className="capa-lente" style={{ margin: 0 }}>
          <Foto src={`${M}/camera-ia-lente-limpa.jpg`} alt="Lente de câmera com as detecções da inteligência artificial" />
        </figure>
        <div className="miolo">
          <Logo className="capa-logo" />
          <div className="capa-texto">
            <h1 className="t-titulo capa-titulo">Investimento · Setor Público</h1>
            <p className="capa-sub">Câmeras IA e Totem IA</p>
          </div>
        </div>
        <Rodape n={1} />
      </section>

      {/* 2 · Câmeras IA */}
      <section className="pagina" aria-label="Câmeras IA">
        <div className="miolo">
          <h2 className="t-titulo prod-titulo">Câmeras IA</h2>
          <p className="preco">
            <span className="faixa">
              De <b>R$ 499</b> a <b>R$ 1.199</b>
            </span>
            <span className="unidade">por câmera por mês</span>
          </p>
          <div className="banda">
            <Foto src={`${M}/central-24h.jpg`} alt="Telas com as detecções da inteligência artificial em tempo real" />
          </div>
          <p className="t-rotulo incluso-rot">Incluso:</p>
          <ul className="lista">
            {CAMERAS.map((t) => (
              <li key={t}>
                <Visto />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div className="destaque">
            <div>
              <h3>Precisa de mais câmeras?</h3>
              <p>Se o município precisar de câmeras novas, a AIP fornece e instala, com instalação isenta. Mais pontos cobertos, mais segurança para a cidade.</p>
            </div>
            <span className="selo">
              INSTALAÇÃO
              <br />
              ISENTA
            </span>
          </div>
        </div>
        <Rodape n={2} />
      </section>

      {/* 3 · Totem IA */}
      <section className="pagina" aria-label="Totem IA">
        <div className="miolo">
          <h2 className="t-titulo prod-titulo">Totem IA</h2>
          <p className="preco">
            <span className="faixa">
              <b>R$ 4.999</b>
            </span>
            <span className="unidade">por totem por mês</span>
          </p>
          <div className="duas-fotos">
            <figure>
              <Foto src={`${M}/totem-aip.jpg`} alt="Totem IA da AIP de dia, numa praça" />
              <figcaption>Dia</figcaption>
            </figure>
            <figure>
              <Foto src={`${M}/totem-noite.jpg`} alt="Totem IA da AIP à noite, com o giroflex aceso" />
              <figcaption>Noite · giroflex</figcaption>
            </figure>
          </div>
          <p className="t-rotulo incluso-rot">Incluso:</p>
          <ul className="lista uma">
            {TOTEM.map((t) => (
              <li key={t}>
                <Visto />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <Rodape n={3} />
      </section>

      {/* 4 · Condições e próximos passos */}
      <section className="pagina cond" aria-label="Condições e próximos passos">
        <div className="miolo">
          <h2 className="t-titulo cond-titulo">Condições</h2>
          <ul className="lista uma" style={{ marginTop: "3.4cqw" }}>
            {CONDICOES.map((t) => (
              <li key={t}>
                <Visto />
                <span>
                  {t}
                  {t === "Tecnologia brasileira" && (
                    // eslint-disable-next-line @next/next/no-img-element -- bandeira oficial (SVG).
                    <img src={`${M}/bandeira-brasil.svg`} alt="" className="bandeira" />
                  )}
                </span>
              </li>
            ))}
          </ul>
          <h2 className="t-titulo cond-titulo" style={{ marginTop: "5.5cqw" }}>
            Próximos passos
          </h2>
          <ol className="passos">
            {PASSOS.map((t, i) => (
              <li key={t}>
                <span className="bola">{String(i + 1).padStart(2, "0")}</span>
                <p className="txt">{t}</p>
              </li>
            ))}
          </ol>
          <div className="fecho">
            <Logo />
            <a className="site" href="https://aipbrasil.com">
              aipbrasil.com
            </a>
          </div>
        </div>
        <Rodape n={4} />
      </section>
    </main>
  );
}
