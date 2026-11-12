import { permanentRedirect } from "next/navigation";

// Estacionamentos saiu das Soluções; links antigos vão para a página inicial.
export default function Estacionamentos() {
  permanentRedirect("/");
}
