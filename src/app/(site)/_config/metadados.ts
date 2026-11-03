import type { Metadata } from "next";

// title, description e Open Graph de cada página, num formato só.
export function metadados(caminho: string, titulo: string, descricao: string): Metadata {
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: {
      title: `${titulo} | AIP`,
      description: descricao,
      url: caminho,
      siteName: "AIP — Agência de Inteligência Patrimonial",
      locale: "pt_BR",
      type: "website",
      images: [{ url: "/site/media/og.jpg", width: 1200, height: 630, alt: "AIP — Agência de Inteligência Patrimonial" }],
    },
  };
}
