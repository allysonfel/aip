import { usuarioAtual } from '@/lib/auth';
import { sql } from '@/lib/db';

// Caixas das últimas análises de uma câmera (para desenhar por cima do
// vídeo no navegador). `desde` = último ts (ms) que o navegador já tem.
export async function GET(req: Request, { params }: { params: Promise<{ canal: string }> }) {
  if (!(await usuarioAtual())) return Response.json({ erro: 'Faça login.' }, { status: 401 });
  const { canal } = await params;
  const desde = Number(new URL(req.url).searchParams.get('desde') ?? 0) || 0;
  const quadros = await sql<{ ts: string; objetos: unknown }[]>`
    SELECT ts, objetos FROM deteccoes
    WHERE canal = ${canal} AND ts > ${desde} AND ts > (extract(epoch from now()) * 1000 - 30000)::bigint
    ORDER BY ts LIMIT 400`;
  const [cam] = await sql<{ linha: unknown; tipo_linha: string | null }[]>`SELECT linha, tipo_linha FROM cameras WHERE canal = ${canal}`;
  const hoje = sql`(date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo')`;
  const cont = await sql<{ k: string; n: number }[]>`
    SELECT CASE WHEN tipo = 'veiculo' THEN sentido ELSE tipo END AS k, count(*)::int AS n
    FROM eventos WHERE canal = ${canal} AND ocorrido_em >= ${hoje} GROUP BY 1`;
  // Cruzamentos do último minuto, com a hora do QUADRO: o navegador só conta
  // cada um quando o vídeo (que chega alguns segundos atrasado) chega nele.
  const cruz = await sql<{ ts: number; k: string }[]>`
    SELECT (extract(epoch FROM ocorrido_em) * 1000)::float8 AS ts, CASE WHEN tipo = 'veiculo' THEN sentido ELSE tipo END AS k
    FROM eventos WHERE canal = ${canal} AND ocorrido_em > now() - interval '60 seconds' ORDER BY ocorrido_em`;
  const [u] = await sql<{ ts: string | null }[]>`SELECT max(ts)::text AS ts FROM deteccoes WHERE canal = ${canal}`;
  const ultimo = u?.ts ? Number(u.ts) : null;
  return Response.json(
    {
      quadros: quadros.map((q) => ({ ts: Number(q.ts), objetos: q.objetos })), linha: cam?.linha ?? null, tipoLinha: cam?.tipo_linha ?? null,
      contagem: Object.fromEntries(cont.map((c) => [c.k, c.n])), cruzamentos: cruz.map((c) => ({ ts: Number(c.ts), k: c.k })), agora: Date.now(), ultimoQuadro: ultimo,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
