import { hrefSegmento, SEGMENTOS } from "../_content/solucoes";

// Itens do menu e do rodapé.

export type ItemMenu = { href: string; rotulo: string; descricao?: string };

export const PRODUTOS: ItemMenu[] = [
  { href: "/cameras-ia", rotulo: "Câmeras IA", descricao: "Inteligência artificial nas câmeras que você já tem." },
  { href: "/totem-ia", rotulo: "Totem IA", descricao: "Cobertura onde não há infraestrutura convencional." },
];

export const SOLUCOES: ItemMenu[] = SEGMENTOS.map((s) => ({ href: hrefSegmento(s), rotulo: s.nome, descricao: s.descricaoMenu }));
