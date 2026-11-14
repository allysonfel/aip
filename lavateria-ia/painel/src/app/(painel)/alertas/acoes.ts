'use server';

import { revalidatePath } from 'next/cache';
import { exigirUsuario } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function marcarLido(id: number) {
  await exigirUsuario();
  await sql`UPDATE alertas SET lido_em = now() WHERE id = ${id} AND lido_em IS NULL`;
  revalidatePath('/', 'layout');
}

export async function marcarTodosLidos() {
  await exigirUsuario();
  await sql`UPDATE alertas SET lido_em = now() WHERE lido_em IS NULL`;
  revalidatePath('/', 'layout');
}
