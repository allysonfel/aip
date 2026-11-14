import { usuarioAtual } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await usuarioAtual())) return new Response('Faça login.', { status: 401 });
  const n = Number((await params).id);
  const [r] = Number.isInteger(n) ? await sql<{ img: Buffer | null }[]>`SELECT imagem AS img FROM alertas WHERE id = ${n}` : [];
  if (!r?.img) return new Response('Sem imagem.', { status: 404 });
  return new Response(new Uint8Array(r.img), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=86400' } });
}
