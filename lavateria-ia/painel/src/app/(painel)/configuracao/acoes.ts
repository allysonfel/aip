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
  let calibracao: { pontos: [number, number][]; largura_m: number; comprimento_m: number } | null = null;
  try {
    const c = JSON.parse(String(form.get('calibracao') ?? 'null'));
    const lw = num(form.get('largura_m'), 0, 200, 0);
    const lc = num(form.get('comprimento_m'), 0, 500, 0);
    const ok = Array.isArray(c) && c.length === 4 && c.every((p: unknown) => Array.isArray(p) && p.length === 2 && p.every((x) => typeof x === 'number' && x >= 0 && x <= 1));
    if (tipoLinha === 'veiculos' && ok && lw > 0 && lc > 0) calibracao = { pontos: c, largura_m: lw, comprimento_m: lc };
  } catch {}
  let zonaTotem: [number, number][] | null = null;
  try {
    const z = JSON.parse(String(form.get('zona_totem') ?? 'null'));
    if (Array.isArray(z) && z.length === 4 && z.every((p: unknown) => Array.isArray(p) && p.length === 2 && p.every((x) => typeof x === 'number' && x >= 0 && x <= 1))) zonaTotem = z;
  } catch {}
  let exclusao: [number, number][][] | null = null;
  try {
    const z = JSON.parse(String(form.get('exclusao') ?? 'null'));
    const pontoOk = (p: unknown) => Array.isArray(p) && p.length === 2 && p.every((x) => typeof x === 'number' && x >= 0 && x <= 1);
    if (Array.isArray(z)) exclusao = z.filter((pol: unknown) => Array.isArray(pol) && pol.length >= 3 && pol.every(pontoOk)).slice(0, 4);
    if (exclusao && !exclusao.length) exclusao = null;
  } catch {}
  const confMin = num(form.get('conf_min'), 20, 90, 40) / 100;
  let zonaAttr: [number, number][] | null = null;
  try {
    const z = JSON.parse(String(form.get('zona_atributos') ?? 'null'));
    if (Array.isArray(z) && z.length >= 3 && z.every((p: unknown) => Array.isArray(p) && p.length === 2 && p.every((x) => typeof x === 'number' && x >= 0 && x <= 1))) zonaAttr = z;
  } catch {}
  await sql`
    UPDATE cameras SET
      nome = ${String(form.get('nome') ?? '').trim().slice(0, 40) || canal},
      funcao = ${String(form.get('funcao') ?? '').trim().slice(0, 120)},
      ativa = ${form.get('ativa') === 'on'},
      fps = ${num(form.get('fps'), 0.5, 5, 2)},
      tipo_linha = ${tipoLinha},
      linha = ${linha ? sql.json(linha) : null},
      calibracao = ${calibracao ? sql.json(calibracao) : null},
      fachada = ${form.get('fachada') === 'on'},
      interna = ${form.get('interna') === 'on'},
      zona_totem = ${zonaTotem ? sql.json(zonaTotem) : null},
      exclusao = ${exclusao ? sql.json(exclusao) : null},
      conf_min = ${confMin},
      zona_atributos = ${zonaAttr ? sql.json(zonaAttr) : null}
    WHERE canal = ${canal}`;
  revalidatePath('/', 'layout');
}

export async function salvarGeral(form: FormData) {
  await exigirUsuario();
  await sql`UPDATE config SET valor = ${sql.json(form.get('borrar') === 'on')} WHERE chave = 'borrar_rostos'`;
  await sql`UPDATE config SET valor = ${sql.json(Math.round(num(form.get('retencao'), 1, 90, 30)))} WHERE chave = 'retencao_dias'`;
  const limiar = num(form.get('limiar'), 50, 95, 65) / 100;
  await sql`INSERT INTO config (chave, valor) VALUES ('limiar_confianca', ${sql.json(limiar)}) ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`;
  const parado = Math.round(num(form.get('parado_min'), 1, 120, 3));
  await sql`INSERT INTO config (chave, valor) VALUES ('parado_min', ${sql.json(parado)}) ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`;
  revalidatePath('/', 'layout');
}

export async function salvarLoja(form: FormData) {
  await exigirUsuario();
  const h = (k: string, padrao: number) => {
    const [hh, mm] = String(form.get(k) ?? '').split(':').map(Number);
    return Number.isFinite(hh) ? Math.min(24, Math.max(0, hh + (Number.isFinite(mm) ? mm / 60 : 0))) : padrao;
  };
  const chaves = ['loja_fechada', 'fechamento', 'sala_maquinas', 'camera_caida', 'pet', 'fachada_fechada', 'totem'];
  const loja = {
    abre: h('abre', 6), fecha: h('fecha', 23), limpeza_de: h('limpeza_de', 14), limpeza_ate: h('limpeza_ate', 17),
    fachada_s: Math.round(num(form.get('fachada_s'), 15, 900, 60)), totem_s: Math.round(num(form.get('totem_min'), 1, 30, 3) * 60),
    regras: Object.fromEntries(chaves.map((k) => [k, form.get(`regra_${k}`) === 'on'])),
  };
  await sql`INSERT INTO config (chave, valor) VALUES ('loja', ${sql.json(loja)}) ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`;
  revalidatePath('/', 'layout');
}
