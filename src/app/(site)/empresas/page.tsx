import { permanentRedirect } from "next/navigation";

// O conteúdo de Empresas foi distribuído entre as páginas de Soluções.
export default function Empresas() {
  permanentRedirect("/solucoes/shoppings-e-varejo");
}
