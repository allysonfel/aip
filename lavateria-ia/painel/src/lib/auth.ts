import 'server-only';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sql } from './db';

export const COOKIE = 'lav_sessao';
const DIAS = 7;

export type Usuario = { id: number; login: string; nome: string };

export async function criarSessao(usuarioId: number) {
  const token = randomBytes(32).toString('base64url');
  await sql`INSERT INTO sessoes (token, usuario_id, expira) VALUES (${token}, ${usuarioId}, now() + make_interval(days => ${DIAS}))`;
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/lavateria', maxAge: DIAS * 86400 });
}

export async function usuarioAtual(): Promise<Usuario | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [u] = await sql<Usuario[]>`SELECT u.id, u.login, u.nome FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token = ${token} AND s.expira > now()`;
  return u ?? null;
}

export async function exigirUsuario(): Promise<Usuario> {
  const u = await usuarioAtual();
  if (!u) redirect('/login');
  return u;
}

export async function encerrarSessao() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await sql`DELETE FROM sessoes WHERE token = ${token}`;
  jar.set(COOKIE, '', { path: '/lavateria', maxAge: 0 });
}
