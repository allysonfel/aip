'use server';

import { revalidatePath } from 'next/cache';
import { exigirUsuario } from '@/lib/auth';
import { sql } from '@/lib/db';

const num = (v: FormDataEntryValue | null, min: number, max: number, padrao: number) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : padrao;
};

export async function salvarCamera(canal: string, form: FormData) {
  await exigirUsuario();
  const tipo = String(form.get('tipo_linha') ?? '');
  const tipoLinha = tipo === 'entrada' || tipo === 'veiculos' ? tipo : null;
  let linha: { a: [number, number]; b: [number, number] } | null = null;
  try {
    const l = JSON.parse(String(form.get('linha') ?? 'null'));
    const ok = (p: unknown) => Array.isArray(p) && p.length === 2 && p.every((x) => typeof x === 'number' && x >= 0 && x <= 1);
    if (l && ok(l.a) && ok(l.b)) linha = { a: l.a, b: l.b };
  } catch {}
  await sql`
    UPDATE cameras SET
      nome = ${String(form.get('nome') ?? '').trim().slice(0, 40) || canal},
      funcao = ${String(form.get('funcao') ?? '').trim().slice(0, 120)},
      ativa = ${form.get('ativa') === 'on'},
      fps = ${num(form.get('fps'), 0.5, 5, 2)},
      tipo_linha = ${tipoLinha},
      linha = ${linha ? sql.json(linha) : null}
    WHERE canal = ${canal}`;
  revalidatePath('/', 'layout');
}

export async function salvarGeral(form: FormData) {
  await exigirUsuario();
  await sql`UPDATE config SET valor = ${sql.json(form.get('borrar') === 'on')} WHERE chave = 'borrar_rostos'`;
  await sql`UPDATE config SET valor = ${sql.json(Math.round(num(form.get('retencao'), 1, 90, 30)))} WHERE chave = 'retencao_dias'`;
  revalidatePath('/', 'layout');
}
