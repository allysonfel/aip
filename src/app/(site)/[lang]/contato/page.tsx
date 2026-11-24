import FormContato from "../../_components/FormContato";
import { EMAIL, WHATSAPP } from "../../_config/contato";
import { metadados } from "../../_config/metadados";
import { ehSegmento } from "../../_content/solucoes";
import { i18n } from "../../_i18n/servidor";

export async function generateMetadata() {
  const { idioma, d } = await i18n();
  return metadados(idioma, "/contato", d.meta.contato.titulo, d.meta.contato.descricao);
}

const PRODUTOS: Record<string, string> = { "cameras-ia": "Câmeras IA", "totem-ia": "Totem IA" };
// Valores gravados no banco (em português); o formulário mostra o rótulo no idioma.
const TIPOS: Record<string, string> = { empresa: "Empresa", publico: "Órgão público ou instituição" };

export default async function Contato({ searchParams }: { searchParams: Promise<{ produto?: string; tipo?: string; segmento?: string }> }) {
  const { d } = await i18n();
  const { produto, tipo, segmento } = await searchParams;
  // Origem do contato (gravada com o envio): de qual página a pessoa veio. O idioma vai junto no envio.
  const origem = [produto && PRODUTOS[produto] ? `produto=${produto}` : "", tipo && TIPOS[tipo] ? `tipo=${tipo}` : "", segmento && ehSegmento(segmento) ? `segmento=${segmento}` : ""].filter(Boolean).join("&") || "direto";

  return (
    <section className="pb-24 pt-32 sm:pt-40">
      <div className="margem grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <h1 className="entra-1 titulo-hero">{d.contato.titulo}</h1>
          <p className="entra-2 mt-6 max-w-[28rem] text-lg leading-relaxed text-white/80">{d.contato.texto}</p>
          {(WHATSAPP || EMAIL) && (
            <div className="entra-3 mt-8 flex flex-wrap gap-3">
              {WHATSAPP && <a href={`https://wa.me/${WHATSAPP}`} className="botao botao-contorno botao-simples">WhatsApp</a>}
              {EMAIL && <a href={`mailto:${EMAIL}`} className="botao botao-contorno botao-simples">{d.contato.email}</a>}
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
