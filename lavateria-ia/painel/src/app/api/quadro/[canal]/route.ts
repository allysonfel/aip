import { usuarioAtual } from '@/lib/auth';
import { sql } from '@/lib/db';

// Último quadro de uma câmera: anotado (ao vivo) ou cru (configuração).
// Só para quem está logado; as imagens já saem do motor com as cabeças
// borradas quando a privacidade está ligada.
export async function GET(req: Request, { params }: { params: Promise<{ canal: string }> }) {
  if (!(await usuarioAtual())) return new Response('Faça login.', { status: 401 });
  const { canal } = await params;
  const cru = new URL(req.url).searchParams.get('tipo') === 'cru';
  const [r] = cru
    ? await sql<{ img: Buffer | null }[]>`SELECT quadro_cru AS img FROM cameras WHERE canal = ${canal}`
    : await sql<{ img: Buffer | null }[]>`SELECT quadro AS img FROM cameras WHERE canal = ${canal}`;
  if (!r?.img) return new Response('Sem imagem ainda.', { status: 404 });
  return new Response(new Uint8Array(r.img), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' } });
}
