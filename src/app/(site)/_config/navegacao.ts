import { hrefSegmento, segmentos } from "../_content/solucoes";
import { dicionario } from "../_i18n/dicionario";
import type { Idioma } from "../_i18n/idiomas";

// Itens do menu e do rodapé, no idioma pedido. Os href ficam sem o prefixo
// do idioma; quem monta o link (LinkI) acrescenta /en ou /ru.

export type ItemMenu = { href: string; rotulo: string; descricao?: string };

export function menu(idioma: Idioma): { produtos: ItemMenu[]; solucoes: ItemMenu[] } {
  const d = dicionario(idioma);
  return {
    produtos: [
      { href: "/cameras-ia", rotulo: d.produtos.cameras.nome, descricao: d.produtos.cameras.descricao },
      { href: "/totem-ia", rotulo: d.produtos.totem.nome, descricao: d.produtos.totem.descricao },
    ],
    solucoes: segmentos(idioma).map((s) => ({ href: hrefSegmento(s), rotulo: s.nome, descricao: s.descricaoMenu })),
  };
}
