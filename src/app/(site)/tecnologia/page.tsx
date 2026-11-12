import { permanentRedirect } from "next/navigation";

// A página Tecnologia saiu do site; links antigos vão para a página inicial.
export default function Tecnologia() {
  permanentRedirect("/");
}
