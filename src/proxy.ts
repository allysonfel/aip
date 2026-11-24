import { NextResponse, type NextRequest } from "next/server";

// Idiomas do site público (ver src/app/(site)/_i18n/idiomas.ts).
// - Português fica sem prefixo: /sobre é atendido por dentro como /pt/sobre.
// - /en/... e /ru/... são respeitados como vieram (e gravam o cookie).
// - Primeira visita a uma página em português (sem cookie): o idioma do
//   navegador decide ("pt…" fica, "ru…" vai para /ru, o resto vai para /en),
//   com redirecionamento temporário (307). Com cookie, vale o cookie.
// - Robôs de busca e de prévia de link nunca são redirecionados.
// - Páginas ocultas, sistema e apps separados ficam de fora.

const COOKIE = "AIP_LANG";
const UM_ANO = 60 * 60 * 24 * 365;
const PREFIXOS = ["en", "ru"] as const;
type Prefixo = (typeof PREFIXOS)[number];

/** Rotas que não são traduzidas nem redirecionadas (continuam só em português). */
const FORA = [
  "/santa-joana-proposta",
  "/fundac-proposta",
  "/cafe-do-virgulino-proposta",
  "/precos-setor-publico",
  "/posts-instagram",
  "/painel",
  "/checkin",
  "/shopping-caruaru",
  "/shopping",
  "/login",
  "/trocar-senha",
  "/sem-acesso",
  "/lavateria",
  "/fundac-vistoria",
  "/empresas",
  "/setor-publico",
  "/tecnologia",
  "/solucoes/estacionamentos",
];

const ROBO = /bot\b|bot\/|crawler|spider|slurp|facebookexternalhit|facebot|whatsapp|telegram|linkedin|twitter|slack|discord|skype|embedly|pinterest|quora|vkshare|yandex|baidu|duckduck|bingpreview|googlebot|google-inspectiontool|applebot|petalbot|semrush|ahrefs|lighthouse|preview/i;

const ehPrefixo = (v: string | undefined): v is Prefixo => v === "en" || v === "ru";

/** Idioma pela preferência do navegador: só a primeira da lista (maior q). */
function idiomaDoNavegador(cabecalho: string | null): "pt" | Prefixo {
  const preferido = (cabecalho ?? "")
    .split(",")
    .map((parte) => {
      const [tag, ...params] = parte.trim().toLowerCase().split(";");
      const q = Number(params.find((p) => p.trim().startsWith("q="))?.split("=")[1] ?? 1);
      return { tag, q: Number.isFinite(q) ? q : 0 };
    })
    .filter((x) => x.tag && x.tag !== "*")
    .sort((a, b) => b.q - a.q)[0]?.tag;
  // Sem cabeçalho (alguns programas não enviam): fica no padrão do site.
  if (!preferido || preferido.startsWith("pt")) return "pt";
  if (preferido.startsWith("ru")) return "ru";
  return "en";
}

function gravar(res: NextResponse, idioma: string) {
  res.cookies.set(COOKIE, idioma, { path: "/", maxAge: UM_ANO, sameSite: "lax" });
  return res;
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (FORA.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();

  const primeiro = pathname.split("/")[1];
  const cookie = req.cookies.get(COOKIE)?.value;
  const navegacao = req.method === "GET" || req.method === "HEAD";
  const robo = ROBO.test(req.headers.get("user-agent") ?? "");

  // /en/... e /ru/...: respeita o link e guarda a escolha.
  if (ehPrefixo(primeiro)) {
    const res = NextResponse.next();
    return navegacao && !robo && cookie !== primeiro ? gravar(res, primeiro) : res;
  }

  // /pt/... não é endereço público: leva para o mesmo caminho sem prefixo.
  if (primeiro === "pt") {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 307);
  }

  // Página em português. Decide se fica ou vai para /en ou /ru.
  let destino: "pt" | Prefixo = "pt";
  if (navegacao && !robo) {
    if (cookie === "pt" || ehPrefixo(cookie)) destino = cookie;
    else destino = idiomaDoNavegador(req.headers.get("accept-language"));
  }

  if (destino !== "pt") {
    const url = req.nextUrl.clone();
    url.pathname = `/${destino}${pathname === "/" ? "" : pathname}`;
    return gravar(NextResponse.redirect(url, 307), destino);
  }

  const interno = req.nextUrl.clone();
  interno.pathname = `/pt${pathname === "/" ? "" : pathname}`;
  interno.search = search;
  const res = NextResponse.rewrite(interno);
  return navegacao && !robo && cookie !== "pt" ? gravar(res, "pt") : res;
}

export const config = {
  // Fora: arquivos internos do Next, API e qualquer arquivo com extensão
  // (imagens, vídeos, sitemap.xml, robots.txt, og-aip.jpg...).
  matcher: ["/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)"],
};
