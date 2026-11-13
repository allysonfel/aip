import { EMAIL, WHATSAPP } from "../_config/contato";
import { metadados } from "../_config/metadados";
import FormContato from "../_components/FormContato";
import { buscarSegmento } from "../_content/solucoes";

export const metadata = metadados("/contato", "Solicite uma consulta", "Conte um pouco sobre sua necessidade e nossa equipe entrará em contato.");

const PRODUTOS: Record<string, string> = { "cameras-ia": "Câmeras IA", "totem-ia": "Totem IA" };
const TIPOS: Record<string, string> = { empresa: "Empresa", publico: "Órgão público ou instituição" };

export default async function Contato({ searchParams }: { searchParams: Promise<{ produto?: string; tipo?: string; segmento?: string }> }) {
  const { produto, tipo, segmento } = await searchParams;
  // Origem do contato (gravada com o envio): de qual página a pessoa veio.
  const origem = [produto && PRODUTOS[produto] ? `produto=${produto}` : "", tipo && TIPOS[tipo] ? `tipo=${tipo}` : "", segmento && buscarSegmento(segmento) ? `segmento=${segmento}` : ""].filter(Boolean).join("&") || "direto";

  return (
    <section className="pb-24 pt-32 sm:pt-40">
      <div className="margem grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <h1 className="entra-1 titulo-hero">Solicite uma consulta.</h1>
          <p className="entra-2 mt-6 max-w-[28rem] text-lg leading-relaxed text-white/80">Conte um pouco sobre sua necessidade e nossa equipe entrará em contato.</p>
          {(WHATSAPP || EMAIL) && (
            <div className="entra-3 mt-8 flex flex-wrap gap-3">
              {WHATSAPP && <a href={`https://wa.me/${WHATSAPP}`} className="botao botao-contorno botao-simples">WhatsApp</a>}
              {EMAIL && <a href={`mailto:${EMAIL}`} className="botao botao-contorno botao-simples">E-mail</a>}
            </div>
          )}
        </div>
        <div className="entra-3">
          <FormContato tipo={tipo ? TIPOS[tipo] : undefined} origem={origem} />
        </div>
      </div>
    </section>
  );
}
