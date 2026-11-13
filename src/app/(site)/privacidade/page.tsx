import type { ReactNode } from "react";
import { metadados } from "../_config/metadados";

export const metadata = metadados("/privacidade", "Política de Privacidade", "Como a AIP trata os dados pessoais recebidos pelo site. Texto-base em revisão jurídica.");

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="titulo-coluna">{titulo}</h2>
      <div className="corpo mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export default function Privacidade() {
  return (
    <article className="margem max-w-[56rem] pb-24 pt-32 sm:pt-40">
      <h1 className="entra-1 titulo-tela">Política de Privacidade</h1>
      <p role="note" className="entra-2 mt-6 rounded-xl border border-white/30 px-4 py-3 text-sm">
        Em revisão jurídica. Este é um texto-base e pode ser alterado.
      </p>

      <Bloco titulo="1. Sobre esta política">
        <p>Esta política explica como a AIP — Agência de Inteligência Patrimonial, integrante do ecossistema Logos Company, trata os dados pessoais recebidos por este site, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
      </Bloco>
      <Bloco titulo="2. Dados que coletamos">
        <p>Pelo formulário de contato: nome, e-mail, WhatsApp, empresa ou órgão, cargo (opcional), cidade e estado, tipo de organização, solução de interesse, quantidade aproximada de câmeras e mensagem. Registramos também a página de origem do contato e a data do envio.</p>
        <p>O endereço IP é usado temporariamente para limitar envios automatizados e não é gravado junto ao contato.</p>
      </Bloco>
      <Bloco titulo="3. Para que usamos">
        <p>Para responder à sua solicitação, entender a necessidade do seu projeto e dar andamento à conversa comercial ou técnica.</p>
      </Bloco>
      <Bloco titulo="4. Compartilhamento">
        <p>Os dados podem ser tratados por fornecedores de infraestrutura necessários ao funcionamento do site, além de outras hipóteses previstas em lei. Não vendemos dados pessoais.</p>
      </Bloco>
      <Bloco titulo="5. Por quanto tempo guardamos">
        <p>Mantemos os dados pelo tempo necessário para atender à solicitação e cumprir obrigações legais. O prazo definitivo será definido nesta revisão.</p>
      </Bloco>
      <Bloco titulo="6. Seus direitos">
        <p>Você pode solicitar a confirmação do tratamento, o acesso, a correção, a anonimização ou a eliminação dos seus dados, a informação sobre compartilhamento e a revogação do consentimento, nos termos da LGPD.</p>
      </Bloco>
      <Bloco titulo="7. Como falar conosco">
        <p>Use o formulário da página de contato para exercer seus direitos ou tirar dúvidas sobre esta política.</p>
      </Bloco>
    </article>
  );
}
