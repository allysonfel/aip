import { usuarioAtual } from '@/lib/auth';
import { sql } from '@/lib/db';
import { semImagem } from '@/lib/semImagem';

// Recorte (melhor imagem) de uma pessoa ou veículo. Só com login.
export async function GET(_req: Request, { params }: { params: Promise<{ tipo: string; id: string }> }) {
  if (!(await usuarioAtual())) return new Response('Faça login.', { status: 401 });
  const { tipo, id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || (tipo !== 'pessoa' && tipo !== 'veiculo')) return new Response('Inválido.', { status: 400 });
  const [r] = tipo === 'pessoa' ? await sql<{ img: Buffer | null }[]>`SELECT recorte AS img FROM pessoas WHERE id = ${n}` : await sql<{ img: Buffer | null }[]>`SELECT recorte AS img FROM veiculos WHERE id = ${n}`;
  if (!r?.img) return semImagem();
  return new Response(new Uint8Array(r.img), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=86400' } });
}
