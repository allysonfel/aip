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
  const [cam] = await sql<{ linha: unknown; tipo_linha: string | null; contagem_hoje: Record<string, number> | null }[]>`
    SELECT linha, tipo_linha, contagem_hoje FROM cameras WHERE canal = ${canal}`;
  return Response.json(
    { quadros: quadros.map((q) => ({ ts: Number(q.ts), objetos: q.objetos })), linha: cam?.linha ?? null, tipoLinha: cam?.tipo_linha ?? null, contagem: cam?.contagem_hoje ?? {}, agora: Date.now() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
