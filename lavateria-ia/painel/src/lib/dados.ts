import 'server-only';
import { sql } from './db';
import { baldes, POR_PAGINA, type Periodo } from './periodo';

const HOJE = sql`(date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo')`;
const BALDE = (p: Periodo, col: string) =>
  p.dias === 1 ? sql`extract(hour FROM ${sql(col)} AT TIME ZONE 'America/Sao_Paulo')::int::text` : sql`to_char(${sql(col)} AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')`;

export const NOMES_VEICULO: Record<string, string> = { carro: 'Carro', moto: 'Moto', caminhao: 'Caminhão', onibus: 'Ônibus', bicicleta: 'Bicicleta' };
export const CORES_PESSOA = ['preto', 'branco', 'cinza', 'vermelho', 'azul', 'verde', 'amarelo', 'laranja', 'rosa', 'roxo', 'marrom', 'bege'];
export const CORES_VEICULO = ['branco', 'prata', 'cinza', 'preto', 'vermelho', 'azul', 'verde', 'amarelo', 'laranja', 'marrom', 'bege'];

export type Calibracao = { pontos: [number, number][]; largura_m: number; comprimento_m: number };

export type CameraInfo = {
  canal: string; caminho: string; nome: string; funcao: string; ativa: boolean; fps: number;
  tipo_linha: 'entrada' | 'veiculos' | null; linha: { a: [number, number]; b: [number, number] } | null;
  online: boolean; erro: string | null; calibracao: Calibracao | null; fachada: boolean; interna: boolean; zona_totem: [number, number][] | null;
  conf_min: number | null; exclusao: [number, number][][] | null; zona_atributos: [number, number][] | null;
  contagem_hoje: Record<string, number> | null; quadro_em: Date | null; quadro_cru_em: Date | null;
  largura: number | null; altura: number | null; pessoas_agora: number; veiculos_agora: number;
};

export async function cameras(): Promise<CameraInfo[]> {
  return sql<CameraInfo[]>`
    SELECT canal, caminho, nome, funcao, ativa, fps, tipo_linha, linha, online, erro, calibracao, fachada, interna, zona_totem, conf_min, exclusao, zona_atributos,
           contagem_hoje, quadro_em, quadro_cru_em, largura, altura, pessoas_agora, veiculos_agora
    FROM cameras ORDER BY ordem, canal`;
}

export async function config() {
  const linhas = await sql<{ chave: string; valor: unknown }[]>`SELECT chave, valor FROM config`;
  const c = Object.fromEntries(linhas.map((l) => [l.chave, l.valor]));
  return { borrarRostos: c.borrar_rostos === true, retencaoDias: Number(c.retencao_dias ?? 30), limiar: Number(c.limiar_confianca ?? 0.7), paradoMin: Number(c.parado_min ?? 3) };
}

/** Números do período + série por hora (1 dia) ou por dia. Ocupação é sempre a de agora. */
export async function resumo(p: Periodo) {
  const [n] = await sql<{ entradas: number; saidas: number }[]>`
    SELECT count(*) FILTER (WHERE tipo = 'entrada')::int AS entradas, count(*) FILTER (WHERE tipo = 'saida')::int AS saidas
    FROM eventos WHERE ocorrido_em >= ${p.ini} AND ocorrido_em < ${p.fim}`;
  const [hoje] = await sql<{ e: number; s: number }[]>`
    SELECT count(*) FILTER (WHERE tipo = 'entrada')::int AS e, count(*) FILTER (WHERE tipo = 'saida')::int AS s FROM eventos WHERE ocorrido_em >= ${HOJE}`;
  const porClasse = await sql<{ classe: string; sentido: string; n: number }[]>`
    SELECT classe, sentido, count(*)::int AS n FROM eventos WHERE tipo = 'veiculo' AND ocorrido_em >= ${p.ini} AND ocorrido_em < ${p.fim} GROUP BY 1, 2`;
  const serie = await sql<{ b: string; entradas: number; saidas: number; veiculos: number }[]>`
    SELECT ${BALDE(p, 'ocorrido_em')} AS b,
           count(*) FILTER (WHERE tipo = 'entrada')::int AS entradas,
           count(*) FILTER (WHERE tipo = 'saida')::int AS saidas,
           count(*) FILTER (WHERE tipo = 'veiculo')::int AS veiculos
    FROM eventos WHERE ocorrido_em >= ${p.ini} AND ocorrido_em < ${p.fim} GROUP BY 1`;
  const horas = baldes(p).map(({ chave, rotulo }) => {
    const r = serie.find((x) => x.b === chave);
    return { hora: rotulo, entradas: r?.entradas ?? 0, saidas: r?.saidas ?? 0, veiculos: r?.veiculos ?? 0 };
  });
  return { entradas: n.entradas, saidas: n.saidas, ocupacao: Math.max(0, hoje.e - hoje.s), veiculos: porClasse.reduce((s, r) => s + r.n, 0), porClasse, horas };
}

export type StatusMotor = {
  cpu_pct: number | null; mem_mb: number | null; ms_inferencia: number | null; threads: number | null;
  cameras: Record<string, { nome: string; fps_alvo: number; fps_processado: number; fps_camera: number; online: boolean }> | null;
  atualizado_em: Date | null;
  detector: string | null;
};

export async function statusMotor() {
  const [s] = await sql<StatusMotor[]>`SELECT cpu_pct, mem_mb, ms_inferencia, threads, cameras, detector, atualizado_em FROM motor_status WHERE id = 1`;
  const amostras = await sql<{ em: Date; cpu_pct: number; mem_mb: number; fps_total: number; cameras_ativas: number }[]>`
    SELECT em, cpu_pct, mem_mb, fps_total, cameras_ativas FROM motor_amostras WHERE em > now() - interval '2 hours' ORDER BY em`;
  const [media] = await sql<{ cpu: number | null; pico: number | null }[]>`
    SELECT avg(cpu_pct)::real AS cpu, max(cpu_pct)::real AS pico FROM motor_amostras WHERE em > now() - interval '30 minutes'`;
  return { status: s ?? null, amostras, cpuMedia30: media?.cpu ?? null, cpuPico30: media?.pico ?? null };
}

// ---------------------------------------------------------------- pessoas e veículos

export type Atributo = { valor: string | boolean | null; conf?: number; motivo?: string; concordancia?: number; recortes?: number; acordo?: boolean };
export type AtributosPessoa = Partial<Record<'genero' | 'baixo_tipo' | 'bone' | 'mochila' | 'bolsa' | 'cima' | 'baixo_cor', Atributo>> & { pequeno?: boolean; papel?: 'pedestre' | 'condutor'; motivo?: string };

export type PessoaLinha = { id: number; canal: string; track_id: number; inicio: Date; fim: Date; atributos: AtributosPessoa; noturna: boolean; camera: string };

export async function pessoasPeriodo(p: Periodo, canal: string | undefined, pagina: number) {
  const filtro = sql`p.inicio >= ${p.ini} AND p.inicio < ${p.fim} ${canal ? sql`AND p.canal = ${canal}` : sql``}`;
  const [t] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM pessoas p WHERE ${filtro}`;
  const itens = await sql<PessoaLinha[]>`
    SELECT p.id, p.canal, p.track_id, p.inicio, p.fim, p.atributos, p.noturna, c.nome AS camera
    FROM pessoas p JOIN cameras c ON c.canal = p.canal WHERE ${filtro}
    ORDER BY p.inicio DESC LIMIT ${POR_PAGINA} OFFSET ${(pagina - 1) * POR_PAGINA}`;
  return { itens, total: t.n };
}

export type VeiculoLinha = { id: number; canal: string; classe: string; inicio: Date; fim: Date; sentido: string | null; cor: string | null; cor_conf: number | null; noturna: boolean; atributos: { cor?: Atributo; pequeno?: boolean }; velocidade_kmh: number | null; deslocamento: number | null };

export async function veiculosPeriodo(p: Periodo, pagina: number) {
  const [t] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM veiculos WHERE inicio >= ${p.ini} AND inicio < ${p.fim}`;
  const itens = await sql<VeiculoLinha[]>`
    SELECT id, canal, classe, inicio, fim, sentido, cor, cor_conf, noturna, atributos, velocidade_kmh, deslocamento FROM veiculos
    WHERE inicio >= ${p.ini} AND inicio < ${p.fim} ORDER BY inicio DESC LIMIT ${POR_PAGINA} OFFSET ${(pagina - 1) * POR_PAGINA}`;
  return { itens, total: t.n };
}

export async function resumoVeiculos(p: Periodo, limiar: number) {
  const porCor = await sql<{ cor: string; n: number }[]>`
    SELECT CASE WHEN cor IS NULL OR cor_conf < ${limiar} THEN 'indefinido' ELSE cor END AS cor, count(*)::int AS n
    FROM veiculos WHERE inicio >= ${p.ini} AND inicio < ${p.fim} GROUP BY 1 ORDER BY 2 DESC`;
  return { porCor };
}

export async function velocidades(p: Periodo) {
  const serie = await sql<{ b: string; media: number | null }[]>`
    SELECT ${BALDE(p, 'inicio')} AS b, avg(velocidade_kmh)::real AS media
    FROM veiculos WHERE inicio >= ${p.ini} AND inicio < ${p.fim} AND velocidade_kmh IS NOT NULL GROUP BY 1`;
  const maiores = await sql<{ id: number; classe: string; velocidade_kmh: number; inicio: Date; sentido: string | null; cor: string | null; cor_conf: number | null }[]>`
    SELECT id, classe, velocidade_kmh, inicio, sentido, cor, cor_conf FROM veiculos
    WHERE inicio >= ${p.ini} AND inicio < ${p.fim} AND velocidade_kmh IS NOT NULL ORDER BY velocidade_kmh DESC LIMIT 10`;
  const [m] = await sql<{ media: number | null; n: number }[]>`SELECT avg(velocidade_kmh)::real AS media, count(velocidade_kmh)::int AS n FROM veiculos WHERE inicio >= ${p.ini} AND inicio < ${p.fim}`;
  const horas = baldes(p).map(({ chave, rotulo }) => ({ hora: rotulo, media: Math.round((serie.find((x) => x.b === chave)?.media ?? 0) * 10) / 10 }));
  return { horas, maiores, media: m?.media ?? null, n: m?.n ?? 0 };
}

/** Veículos que ficaram quase parados em frente à loja por mais de `min` minutos. */
export async function parados(p: Periodo, min: number) {
  return sql<{ id: number; classe: string; inicio: Date; fim: Date; cor: string | null; cor_conf: number | null }[]>`
    SELECT id, classe, inicio, fim, cor, cor_conf FROM veiculos
    WHERE inicio >= ${p.ini} AND inicio < ${p.fim} AND coalesce(deslocamento, 1) < 0.05 AND fim - inicio >= make_interval(mins => ${min})
    ORDER BY inicio DESC LIMIT 30`;
}

/** Calçada (câmeras de fachada) x entradas pela porta. */
export async function conversaoFachada(p: Periodo) {
  const passantes = await sql<{ b: string; n: number }[]>`
    SELECT ${BALDE(p, 'inicio')} AS b, count(*)::int AS n
    FROM pessoas WHERE canal IN (SELECT canal FROM cameras WHERE fachada) AND inicio >= ${p.ini} AND inicio < ${p.fim} GROUP BY 1`;
  const entradas = await sql<{ b: string; n: number }[]>`
    SELECT ${BALDE(p, 'ocorrido_em')} AS b, count(*)::int AS n
    FROM eventos WHERE tipo = 'entrada' AND ocorrido_em >= ${p.ini} AND ocorrido_em < ${p.fim} GROUP BY 1`;
  const horas = baldes(p).map(({ chave, rotulo }) => {
    const pp = passantes.find((x) => x.b === chave)?.n ?? 0;
    const e = entradas.find((x) => x.b === chave)?.n ?? 0;
    return { hora: rotulo, passaram: pp, entraram: e };
  });
  const tp = horas.reduce((s, x) => s + x.passaram, 0);
  const te = horas.reduce((s, x) => s + x.entraram, 0);
  return { horas, passaram: tp, entraram: te, taxa: tp ? te / tp : null };
}

/**
 * Tempo médio de permanência pela lei de Little: a ocupação ao longo do
 * período (entradas menos saídas, zerando a cada dia) dividida pelas entradas.
 */
export async function permanenciaMedia(p: Periodo): Promise<number | null> {
  const ev = await sql<{ t: Date; tipo: string; dia: string }[]>`
    SELECT ocorrido_em AS t, tipo, to_char(ocorrido_em AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS dia
    FROM eventos WHERE tipo IN ('entrada','saida') AND ocorrido_em >= ${p.ini} AND ocorrido_em < ${p.fim} ORDER BY ocorrido_em`;
  if (!ev.length) return null;
  let oc = 0, area = 0, entradas = 0, dia = ev[0].dia;
  let ult = new Date(ev[0].t).getTime();
  for (const e of ev) {
    const t = new Date(e.t).getTime();
    if (e.dia !== dia) { oc = 0; dia = e.dia; ult = t; }
    area += oc * ((t - ult) / 1000);
    ult = t;
    if (e.tipo === 'entrada') { oc++; entradas++; } else oc = Math.max(0, oc - 1);
  }
  area += oc * ((Math.min(Date.now(), p.fim.getTime()) - ult) / 1000);
  return entradas ? area / entradas : null;
}

// ---------------------------------------------------------------- busca

export type Filtros = {
  tipo: 'pessoas' | 'veiculos'; de: string; ate: string; camera: string;
  cima: string; baixo_tipo: string; baixo_cor: string; genero: string; bone: string; mochila: string; bolsa: string;
  classe: string; cor: string;
};

/** Busca por características no período; horário opcional (de/até, em todos os dias). */
export async function buscar(f: Filtros, limiar: number, p: Periodo, pagina: number) {
  const hora = sql`${f.de ? sql`AND (inicio AT TIME ZONE 'America/Sao_Paulo')::time >= ${f.de}::time` : sql``} ${f.ate ? sql`AND (inicio AT TIME ZONE 'America/Sao_Paulo')::time <= ${f.ate}::time` : sql``}`;
  const attr = (chave: string, valor: string | boolean) => sql`AND atributos->${chave}->>'valor' = ${String(valor)} AND (atributos->${chave}->>'conf')::real >= ${limiar}`;
  const off = (pagina - 1) * POR_PAGINA;
  if (f.tipo === 'veiculos') {
    const filtro = sql`inicio >= ${p.ini} AND inicio < ${p.fim} ${hora}
      ${f.camera ? sql`AND canal = ${f.camera}` : sql``} ${f.classe ? sql`AND classe = ${f.classe}` : sql``}
      ${f.cor ? sql`AND cor = ${f.cor} AND cor_conf >= ${limiar}` : sql``}`;
    const [t] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM veiculos WHERE ${filtro}`;
    const itens = await sql<{ id: number; inicio: Date; camera: string; classe: string; cor: string | null; cor_conf: number | null; velocidade_kmh: number | null }[]>`
      SELECT v.id, v.inicio, c.nome AS camera, v.classe, v.cor, v.cor_conf, v.velocidade_kmh FROM veiculos v JOIN cameras c ON c.canal = v.canal
      WHERE v.id IN (SELECT id FROM veiculos WHERE ${filtro}) ORDER BY v.inicio DESC LIMIT ${POR_PAGINA} OFFSET ${off}`;
    return { tipo: 'veiculos' as const, itens, total: t.n };
  }
  const filtro = sql`inicio >= ${p.ini} AND inicio < ${p.fim} ${hora} ${f.camera ? sql`AND canal = ${f.camera}` : sql``}
    ${f.cima ? attr('cima', f.cima) : sql``} ${f.baixo_tipo ? attr('baixo_tipo', f.baixo_tipo) : sql``} ${f.baixo_cor ? attr('baixo_cor', f.baixo_cor) : sql``}
    ${f.genero ? attr('genero', f.genero) : sql``} ${f.bone ? attr('bone', f.bone === 'sim') : sql``}
    ${f.mochila ? attr('mochila', f.mochila === 'sim') : sql``} ${f.bolsa ? attr('bolsa', f.bolsa === 'sim') : sql``}`;
  const [t] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM pessoas WHERE ${filtro}`;
  const itens = await sql<{ id: number; inicio: Date; camera: string; atributos: AtributosPessoa }[]>`
    SELECT p.id, p.inicio, c.nome AS camera, p.atributos FROM pessoas p JOIN cameras c ON c.canal = p.canal
    WHERE p.id IN (SELECT id FROM pessoas WHERE ${filtro}) ORDER BY p.inicio DESC LIMIT ${POR_PAGINA} OFFSET ${off}`;
  return { tipo: 'pessoas' as const, itens, total: t.n };
}

// ---------------------------------------------------------------- loja, alertas, validação e resumo

export type Loja = { abre: number; fecha: number; limpeza_de: number; limpeza_ate: number; fachada_s: number; totem_s: number; regras: Record<string, boolean> };

export async function loja(): Promise<Loja> {
  const [r] = await sql<{ valor: Loja }[]>`SELECT valor FROM config WHERE chave = 'loja'`;
  return r?.valor ?? { abre: 6, fecha: 23, limpeza_de: 14, limpeza_ate: 17, fachada_s: 60, totem_s: 180, regras: {} };
}

export type AlertaLinha = { id: number; tipo: string; canal: string | null; nivel: string; mensagem: string; quando: Date; lido_em: Date | null; tem_imagem: boolean; camera: string | null };

export async function alertas(p: Periodo, pagina: number) {
  const [t] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM alertas WHERE quando >= ${p.ini} AND quando < ${p.fim}`;
  const itens = await sql<AlertaLinha[]>`
    SELECT a.id, a.tipo, a.canal, a.nivel, a.mensagem, a.quando, a.lido_em, a.imagem IS NOT NULL AS tem_imagem, c.nome AS camera
    FROM alertas a LEFT JOIN cameras c ON c.canal = a.canal
    WHERE a.quando >= ${p.ini} AND a.quando < ${p.fim} ORDER BY a.quando DESC LIMIT ${POR_PAGINA} OFFSET ${(pagina - 1) * POR_PAGINA}`;
  return { itens, total: t.n };
}

export async function alertasNaoLidos(): Promise<number> {
  const [r] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM alertas WHERE lido_em IS NULL AND nivel <> 'info'`;
  return r?.n ?? 0;
}

/** Amostra para validar: só pessoas de verdade (sem recorte pequeno), com atributos ainda sem marcação. */
export async function amostraValidacao(tipo: 'pessoa' | 'veiculo', pagina: number) {
  const off = (pagina - 1) * 12;
  if (tipo === 'pessoa') {
    const filtro = sql`NOT (p.atributos ? 'pequeno') AND p.atributos ? 'genero' AND (SELECT count(*) FROM validacoes v WHERE v.tipo = 'pessoa' AND v.ref_id = p.id) < 7`;
    const [t] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM pessoas p WHERE ${filtro}`;
    const itens = await sql<{ id: number; inicio: Date; camera: string; atributos: AtributosPessoa; marcados: Record<string, boolean> | null }[]>`
      SELECT p.id, p.inicio, c.nome AS camera, p.atributos,
        (SELECT jsonb_object_agg(v.atributo, v.correto) FROM validacoes v WHERE v.tipo = 'pessoa' AND v.ref_id = p.id) AS marcados
      FROM pessoas p JOIN cameras c ON c.canal = p.canal WHERE ${filtro} ORDER BY p.id DESC LIMIT 12 OFFSET ${off}`;
    return { itens, total: t.n };
  }
  const filtro = sql`(SELECT count(*) FROM validacoes x WHERE x.tipo = 'veiculo' AND x.ref_id = v.id) < 2`;
  const [t] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM veiculos v WHERE ${filtro}`;
  const itens = await sql<{ id: number; inicio: Date; camera: string; classe: string; atributos: { cor?: Atributo }; marcados: Record<string, boolean> | null }[]>`
    SELECT v.id, v.inicio, c.nome AS camera, v.classe, v.atributos,
      (SELECT jsonb_object_agg(x.atributo, x.correto) FROM validacoes x WHERE x.tipo = 'veiculo' AND x.ref_id = v.id) AS marcados
    FROM veiculos v JOIN cameras c ON c.canal = v.canal WHERE ${filtro} ORDER BY v.id DESC LIMIT 12 OFFSET ${off}`;
  return { itens, total: t.n };
}

export async function resumoPeriodo(p: Periodo) {
  const ev = await sql<{ t: Date; tipo: string }[]>`SELECT ocorrido_em AS t, tipo FROM eventos WHERE tipo IN ('entrada','saida') AND ocorrido_em >= ${p.ini} AND ocorrido_em < ${p.fim} ORDER BY 1`;
  let oc = 0, pico = 0, picoEm: Date | null = null, entradas = 0;
  let dia = '';
  for (const e of ev) {
    const d = new Date(new Date(e.t).getTime() - 3 * 3600_000).toISOString().slice(0, 10);
    if (d !== dia) { oc = 0; dia = d; }
    if (e.tipo === 'entrada') { oc++; entradas++; } else oc = Math.max(0, oc - 1);
    if (oc > pico) { pico = oc; picoEm = e.t; }
  }
  const veic = await sql<{ classe: string; n: number }[]>`SELECT classe, count(*)::int AS n FROM eventos WHERE tipo = 'veiculo' AND ocorrido_em >= ${p.ini} AND ocorrido_em < ${p.fim} GROUP BY 1 ORDER BY 2 DESC`;
  const [vel] = await sql<{ media: number | null }[]>`SELECT avg(velocidade_kmh)::real AS media FROM veiculos WHERE inicio >= ${p.ini} AND inicio < ${p.fim}`;
  const [fach] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM pessoas WHERE canal IN (SELECT canal FROM cameras WHERE fachada) AND inicio >= ${p.ini} AND inicio < ${p.fim}`;
  const perfil = await sql<{ atributo: string; valor: string; n: number }[]>`
    SELECT k AS atributo, p.atributos->k->>'valor' AS valor, count(*)::int AS n
    FROM pessoas p CROSS JOIN unnest(ARRAY['genero','cima','baixo_tipo']) AS k
    WHERE p.inicio >= ${p.ini} AND p.inicio < ${p.fim} AND (p.atributos->k->>'conf')::real >= (SELECT (valor)::text::real FROM config WHERE chave = 'limiar_confianca')
    GROUP BY 1, 2 ORDER BY 1, 3 DESC`;
  const [pessoasTot] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM pessoas WHERE inicio >= ${p.ini} AND inicio < ${p.fim}`;
  const al = await sql<{ nivel: string; mensagem: string; quando: Date }[]>`SELECT nivel, mensagem, quando FROM alertas WHERE quando >= ${p.ini} AND quando < ${p.fim} ORDER BY quando DESC LIMIT 50`;
  return { entradas, pico, picoEm, permanencia: await permanenciaMedia(p), veic, velMedia: vel?.media ?? null, passaramCalcada: fach?.n ?? 0, perfil, pessoasTot: pessoasTot?.n ?? 0, alertas: al };
}

export async function ligacoesCameras(ids: number[]) {
  if (!ids.length) return new Map<number, { camera: string; inicio: Date; semelhanca: number }>();
  const alvo = await sql<{ id: number; inicio: Date; assinatura: number[] | null }[]>`SELECT id, inicio, assinatura FROM pessoas WHERE id = ANY(${ids}) AND assinatura IS NOT NULL`;
  if (!alvo.length) return new Map();
  const min = new Date(Math.min(...alvo.map((a) => new Date(a.inicio).getTime())) - 120_000);
  const fach = await sql<{ id: number; inicio: Date; assinatura: number[]; camera: string }[]>`
    SELECT p.id, p.inicio, p.assinatura, c.nome AS camera FROM pessoas p JOIN cameras c ON c.canal = p.canal AND c.fachada
    WHERE p.inicio >= ${min} AND p.assinatura IS NOT NULL`;
  const cos = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
  const saida = new Map<number, { camera: string; inicio: Date; semelhanca: number }>();
  for (const a of alvo) {
    const t = new Date(a.inicio).getTime();
    let melhor: { camera: string; inicio: Date; semelhanca: number } | null = null;
    for (const f of fach) {
      const dt = t - new Date(f.inicio).getTime();
      if (dt < 0 || dt > 120_000) continue;
      const s = cos(a.assinatura!, f.assinatura);
      if (s > 0.82 && (!melhor || s > melhor.semelhanca)) melhor = { camera: f.camera, inicio: f.inicio, semelhanca: s };
    }
    if (melhor) saida.set(a.id, melhor);
  }
  return saida;
}
export async function momento(tipo: 'pessoa' | 'veiculo', id: number) {
  const quadros = await sql<{ id: number; ts: Date }[]>`SELECT id, ts FROM quadros_momento WHERE tipo = ${tipo} AND ref_id = ${id} ORDER BY ts`;
  if (tipo === 'pessoa') {
    const [p] = await sql<{ id: number; inicio: Date; fim: Date; camera: string; atributos: AtributosPessoa }[]>`
      SELECT p.id, p.inicio, p.fim, c.nome AS camera, p.atributos FROM pessoas p JOIN cameras c ON c.canal = p.canal WHERE p.id = ${id}`;
    return p ? { ...p, quadros, tipo } : null;
  }
  const [v] = await sql<{ id: number; inicio: Date; fim: Date; camera: string; classe: string; atributos: { cor?: Atributo }; velocidade_kmh: number | null }[]>`
    SELECT v.id, v.inicio, v.fim, c.nome AS camera, v.classe, v.atributos, v.velocidade_kmh FROM veiculos v JOIN cameras c ON c.canal = v.canal WHERE v.id = ${id}`;
  return v ? { ...v, quadros, tipo } : null;
}
export const REGRAS: { k: string; t: string; d: string }[] = [
  { k: 'loja_fechada', t: 'Loja fechada vigiada', d: 'Fora do horário, qualquer pessoa na Recepção, no Salão ou na Sala de Máquinas gera alerta urgente.' },
  { k: 'fechamento', t: 'Fechamento seguro', d: '15 min antes de fechar avisa se ainda tem gente; 5 min depois confere se a loja fechou vazia (pela contagem da porta).' },
  { k: 'sala_maquinas', t: 'Sala de Máquinas fora do horário', d: 'Pessoa na Sala de Máquinas fora do horário da limpeza vira alerta.' },
  { k: 'camera_caida', t: 'Câmera sem imagem', d: 'Avisa quando uma câmera para de mandar imagem por 2 minutos. Todas juntas com a loja fechada: urgente.' },
  { k: 'pet', t: 'Cachorro ou gato na loja', d: 'Pet não pode entrar. Fica registrado para a higienização da máquina usada depois.' },
  { k: 'fachada_fechada', t: 'Pessoa parada na fachada (loja fechada)', d: 'Com a loja fechada, alerta quem ficar parado na calçada mais do que o tempo configurado. Quem só passa não conta.' },
  { k: 'totem', t: 'Cliente parado no totem', d: 'Avisa quando alguém fica no totem mais do que o tempo configurado (desenhe a zona do totem na câmera Recepção).' },
];
export async function precisao() {
  const linhas = await sql<{ atributo: string; certos: number; total: number }[]>`
    SELECT atributo, count(*) FILTER (WHERE correto)::int AS certos, count(*)::int AS total FROM validacoes GROUP BY 1`;
  const manuais = await sql<{ de: Date; ate: Date; manual: number; automatico: number }[]>`SELECT de, ate, manual, automatico FROM contagens_manuais ORDER BY em DESC LIMIT 20`;
  return { linhas, manuais };
}
