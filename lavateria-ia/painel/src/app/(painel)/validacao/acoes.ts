'use server';

import { revalidatePath } from 'next/cache';
import { exigirUsuario } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function marcar(tipo: 'pessoa' | 'veiculo', refId: number, atributo: string, estimado: string, correto: boolean) {
  const u = await exigirUsuario();
  await sql`
    INSERT INTO validacoes (tipo, ref_id, atributo, estimado, correto, usuario_id) VALUES (${tipo}, ${refId}, ${atributo}, ${estimado}, ${correto}, ${u.id})
    ON CONFLICT (tipo, ref_id, atributo) DO UPDATE SET correto = EXCLUDED.correto, estimado = EXCLUDED.estimado, usuario_id = EXCLUDED.usuario_id, em = now()`;
  revalidatePath('/validacao');
}

/** Contagem manual de entradas num intervalo, comparada com a automática. */
export async function contagemManual(form: FormData) {
  const u = await exigirUsuario();
  const de = String(form.get('de') ?? '');
  const ate = String(form.get('ate') ?? '');
  const manual = Math.max(0, Math.round(Number(form.get('manual'))));
  if (!de || !ate || !Number.isFinite(manual)) return;
  const ini = sql`(${de}::timestamp AT TIME ZONE 'America/Sao_Paulo')`;
  const fim = sql`(${ate}::timestamp AT TIME ZONE 'America/Sao_Paulo')`;
  const [r] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM eventos WHERE tipo = 'entrada' AND ocorrido_em BETWEEN ${ini} AND ${fim}`;
  await sql`INSERT INTO contagens_manuais (de, ate, manual, automatico, usuario_id) VALUES (${ini}, ${fim}, ${manual}, ${r.n}, ${u.id})`;
  revalidatePath('/validacao');
}
