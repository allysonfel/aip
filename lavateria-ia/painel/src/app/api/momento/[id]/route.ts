import { usuarioAtual } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await usuarioAtual())) return new Response('Faça login.', { status: 401 });
  const n = Number((await params).id);
  if (!Number.isInteger(n)) return new Response('Inválido.', { status: 400 });
  const [r] = await sql<{ img: Buffer }[]>`SELECT img FROM quadros_momento WHERE id = ${n}`;
  if (!r) return new Response('Não encontrado.', { status: 404 });
  return new Response(new Uint8Array(r.img), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=86400' } });
}
