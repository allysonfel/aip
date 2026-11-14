'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { criarSessao, encerrarSessao } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function entrar(_: { erro: string | null }, form: FormData): Promise<{ erro: string | null }> {
  const login = String(form.get('login') ?? '').trim().toLowerCase();
  const senha = String(form.get('senha') ?? '');
  const [u] = await sql<{ id: number; senha_hash: string }[]>`SELECT id, senha_hash FROM usuarios WHERE login = ${login}`;
  if (!u || !(await bcrypt.compare(senha, u.senha_hash))) return { erro: 'Usuário ou senha incorretos.' };
  await criarSessao(u.id);
  redirect('/');
}

export async function sair() {
  await encerrarSessao();
  redirect('/login');
}
