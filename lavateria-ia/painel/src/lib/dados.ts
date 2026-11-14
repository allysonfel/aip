import 'server-only';
import { sql } from './db';

const HOJE = sql`(date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo')`;

export const NOMES_VEICULO: Record<string, string> = { carro: 'Carro', moto: 'Moto', caminhao: 'Caminhão', onibus: 'Ônibus', bicicleta: 'Bicicleta' };

export type Calibracao = { pontos: [number, number][]; largura_m: number; comprimento_m: number };

export type CameraInfo = {
  canal: string; caminho: string; nome: string; funcao: string; ativa: boolean; fps: number;
  tipo_linha: 'entrada' | 'veiculos' | null; linha: { a: [number, number]; b: [number, number] } | null;
  online: boolean; erro: string | null; calibracao: Calibracao | null; fachada: boolean; contagem_hoje: Record<string, number> | null; quadro_em: Date | null; quadro_cru_em: Date | null;
  largura: number | null; altura: number | null; pessoas_agora: number; veiculos_agora: number;
};

export async function cameras(): Promise<CameraInfo[]> {
  return sql<CameraInfo[]>`
    SELECT canal, caminho, nome, funcao, ativa, fps, tipo_linha, linha, online, erro, calibracao, fachada, contagem_hoje, quadro_em, quadro_cru_em, largura, altura, pessoas_agora, veiculos_agora
    FROM cameras ORDER BY ordem, canal`;
}

export async function config() {
  const linhas = await sql<{ chave: string; valor: unknown }[]>`SELECT chave, valor FROM config`;
  const c = Object.fromEntries(linhas.map((l) => [l.chave, l.valor]));
  return { borrarRostos: c.borrar_rostos === true, retencaoDias: Number(c.retencao_dias ?? 30), limiar: Number(c.limiar_confianca ?? 0.65), paradoMin: Number(c.parado_min ?? 3) };
}

export async function resumoHoje() {
  const [p] = await sql<{ entradas: number; saidas: number }[]>`
    SELECT count(*) FILTER (WHERE tipo = 'entrada')::int AS entradas, count(*) FILTER (WHERE tipo = 'saida')::int AS saidas
    FROM eventos WHERE ocorrido_em >= ${HOJE}`;
  const porClasse = await sql<{ classe: string; sentido: string; n: number }[]>`
    SELECT classe, sentido, count(*)::int AS n FROM eventos WHERE tipo = 'veiculo' AND ocorrido_em >= ${HOJE} GROUP BY 1, 2`;
  const porHora = await sql<{ hora: number; entradas: number; saidas: number; veiculos: number }[]>`
    SELECT extract(hour FROM ocorrido_em AT TIME ZONE 'America/Sao_Paulo')::int AS hora,
           count(*) FILTER (WHERE tipo = 'entrada')::int AS entradas,
           count(*) FILTER (WHERE tipo = 'saida')::int AS saidas,
           count(*) FILTER (WHERE tipo = 'veiculo')::int AS veiculos
    FROM eventos WHERE ocorrido_em >= ${HOJE} GROUP BY 1`;
  const horas = Array.from({ length: 24 }, (_, h) => {
    const r = porHora.find((x) => x.hora === h);
    return { hora: `${String(h).padStart(2, '0')}h`, entradas: r?.entradas ?? 0, saidas: r?.saidas ?? 0, veiculos: r?.veiculos ?? 0 };
  });
  const veiculos = porClasse.reduce((s, r) => s + r.n, 0);
  return { entradas: p.entradas, saidas: p.saidas, ocupacao: Math.max(0, p.entradas - p.saidas), veiculos, porClasse, horas };
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

// ---------------------------------------------------------------- etapa 2

export type Atributo = { valor: string | boolean | null; conf?: number; motivo?: string };
export type AtributosPessoa = Partial<Record<'genero' | 'baixo_tipo' | 'bone' | 'mochila' | 'bolsa' | 'cima' | 'baixo_cor', Atributo>> & { pequeno?: boolean };

export type PessoaLinha = { id: number; canal: string; track_id: number; inicio: Date; fim: Date; atributos: AtributosPessoa; noturna: boolean; camera: string };

export async function pessoasDoDia(dia?: string, canal?: string, limite = 300): Promise<PessoaLinha[]> {
  const inicio = dia ? sql`(${dia}::date::timestamp AT TIME ZONE 'America/Sao_Paulo')` : HOJE;
  return sql<PessoaLinha[]>`
    SELECT p.id, p.canal, p.track_id, p.inicio, p.fim, p.atributos, p.noturna, c.nome AS camera
    FROM pessoas p JOIN cameras c ON c.canal = p.canal
    WHERE p.inicio >= ${inicio} AND p.inicio < ${inicio} + interval '1 day' ${canal ? sql`AND p.canal = ${canal}` : sql``}
    ORDER BY p.inicio DESC LIMIT ${limite}`;
}

export type VeiculoLinha = { id: number; canal: string; classe: string; inicio: Date; fim: Date; sentido: string | null; cor: string | null; cor_conf: number | null; noturna: boolean; atributos: { cor?: Atributo; pequeno?: boolean }; velocidade_kmh: number | null; deslocamento: number | null };

export async function veiculosDoDia(limite = 300): Promise<VeiculoLinha[]> {
  return sql<VeiculoLinha[]>`
    SELECT id, canal, classe, inicio, fim, sentido, cor, cor_conf, noturna, atributos, velocidade_kmh, deslocamento FROM veiculos
    WHERE inicio >= ${HOJE} ORDER BY inicio DESC LIMIT ${limite}`;
}

export async function resumoVeiculos(limiar: number) {
  const porCor = await sql<{ cor: string; n: number }[]>`
    SELECT CASE WHEN cor IS NULL OR cor_conf < ${limiar} THEN 'indefinido' ELSE cor END AS cor, count(*)::int AS n
    FROM veiculos WHERE inicio >= ${HOJE} GROUP BY 1 ORDER BY 2 DESC`;
  const porTipo = await sql<{ classe: string; n: number }[]>`SELECT classe, count(*)::int AS n FROM veiculos WHERE inicio >= ${HOJE} GROUP BY 1 ORDER BY 2 DESC`;
  return { porCor, porTipo };
}

// ---------------------------------------------------------------- etapa 3

export async function velocidades() {
  const porHora = await sql<{ hora: number; media: number | null; n: number }[]>`
    SELECT extract(hour FROM inicio AT TIME ZONE 'America/Sao_Paulo')::int AS hora, avg(velocidade_kmh)::real AS media, count(velocidade_kmh)::int AS n
    FROM veiculos WHERE inicio >= ${HOJE} AND velocidade_kmh IS NOT NULL GROUP BY 1`;
  const maiores = await sql<{ id: number; classe: string; velocidade_kmh: number; inicio: Date; sentido: string | null; cor: string | null; cor_conf: number | null }[]>`
    SELECT id, classe, velocidade_kmh, inicio, sentido, cor, cor_conf FROM veiculos
    WHERE inicio >= ${HOJE} AND velocidade_kmh IS NOT NULL ORDER BY velocidade_kmh DESC LIMIT 10`;
  const [m] = await sql<{ media: number | null; n: number }[]>`SELECT avg(velocidade_kmh)::real AS media, count(velocidade_kmh)::int AS n FROM veiculos WHERE inicio >= ${HOJE}`;
  const horas = Array.from({ length: 24 }, (_, h) => ({ hora: `${String(h).padStart(2, '0')}h`, media: Math.round((porHora.find((x) => x.hora === h)?.media ?? 0) * 10) / 10 }));
  return { horas, maiores, media: m?.media ?? null, n: m?.n ?? 0 };
}

/** Veículos que ficaram quase parados em frente à loja por mais de `min` minutos. */
export async function parados(min: number) {
  return sql<{ id: number; classe: string; inicio: Date; fim: Date; cor: string | null; cor_conf: number | null }[]>`
    SELECT id, classe, inicio, fim, cor, cor_conf FROM veiculos
    WHERE inicio >= ${HOJE} AND coalesce(deslocamento, 1) < 0.05 AND fim - inicio >= make_interval(mins => ${min})
    ORDER BY inicio DESC LIMIT 30`;
}

/** Calçada (câmeras de fachada) x entradas pela porta, por hora. */
export async function conversaoFachada() {
  const passantes = await sql<{ hora: number; n: number }[]>`
    SELECT extract(hour FROM p.inicio AT TIME ZONE 'America/Sao_Paulo')::int AS hora, count(*)::int AS n
    FROM pessoas p JOIN cameras c ON c.canal = p.canal AND c.fachada
    WHERE p.inicio >= ${HOJE} GROUP BY 1`;
  const entradas = await sql<{ hora: number; n: number }[]>`
    SELECT extract(hour FROM ocorrido_em AT TIME ZONE 'America/Sao_Paulo')::int AS hora, count(*)::int AS n
    FROM eventos WHERE tipo = 'entrada' AND ocorrido_em >= ${HOJE} GROUP BY 1`;
  const horas = Array.from({ length: 24 }, (_, h) => {
    const p = passantes.find((x) => x.hora === h)?.n ?? 0;
    const e = entradas.find((x) => x.hora === h)?.n ?? 0;
    return { hora: `${String(h).padStart(2, '0')}h`, passaram: p, entraram: e, taxa: p ? Math.round((e / p) * 1000) / 10 : 0 };
  });
  const tp = horas.reduce((s, x) => s + x.passaram, 0);
  const te = horas.reduce((s, x) => s + x.entraram, 0);
  return { horas, passaram: tp, entraram: te, taxa: tp ? te / tp : null };
}

/**
 * Tempo médio de permanência pela lei de Little: a ocupação ao longo do dia
 * (entradas menos saídas, minuto a minuto) dividida pelo número de entradas.
 * Não depende de reconhecer a mesma pessoa na entrada e na saída.
 */
export async function permanenciaMedia(): Promise<number | null> {
  const ev = await sql<{ t: Date; tipo: string }[]>`SELECT ocorrido_em AS t, tipo FROM eventos WHERE tipo IN ('entrada','saida') AND ocorrido_em >= ${HOJE} ORDER BY ocorrido_em`;
  if (!ev.length) return null;
  let ocup = 0;
  let ultimo = new Date(ev[0].t).getTime();
  let area = 0; // pessoa x segundo
  let entradas = 0;
  for (const e of ev) {
    const t = new Date(e.t).getTime();
    area += ocup * ((t - ultimo) / 1000);
    ultimo = t;
    if (e.tipo === 'entrada') {
      ocup += 1;
      entradas += 1;
    } else ocup = Math.max(0, ocup - 1);
  }
  area += ocup * ((Date.now() - ultimo) / 1000);
  return entradas ? area / entradas : null;
}

/** Possível ligação calçada -> porta (experimental): assinatura visual parecida até 2 min antes. */
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

// ---------------------------------------------------------------- busca

export type Filtros = {
  tipo: 'pessoas' | 'veiculos'; data: string; de: string; ate: string; camera: string;
  cima: string; baixo_tipo: string; baixo_cor: string; genero: string; bone: string; mochila: string; bolsa: string;
  classe: string; cor: string;
};

export const CORES_PESSOA = ['preto', 'branco', 'cinza', 'vermelho', 'azul', 'verde', 'amarelo', 'laranja', 'rosa', 'roxo', 'marrom', 'bege'];
export const CORES_VEICULO = ['branco', 'cinza', 'amarelo', 'vermelho', 'verde', 'azul', 'preto'];

/** Busca por características: só conta o atributo com confiança acima do limiar. */
export async function buscar(f: Filtros, limiar: number) {
  const ini = sql`((${f.data}::date + ${f.de || '00:00'}::time)::timestamp AT TIME ZONE 'America/Sao_Paulo')`;
  const fim = sql`((${f.data}::date + ${f.ate || '23:59'}::time)::timestamp AT TIME ZONE 'America/Sao_Paulo' + interval '59 seconds')`;
  const attr = (chave: string, valor: string | boolean) =>
    sql`AND p.atributos->${chave}->>'valor' = ${String(valor)} AND (p.atributos->${chave}->>'conf')::real >= ${limiar}`;
  if (f.tipo === 'veiculos') {
    return {
      tipo: 'veiculos' as const,
      itens: await sql<{ id: number; inicio: Date; camera: string; classe: string; cor: string | null; cor_conf: number | null; velocidade_kmh: number | null }[]>`
        SELECT v.id, v.inicio, c.nome AS camera, v.classe, v.cor, v.cor_conf, v.velocidade_kmh FROM veiculos v JOIN cameras c ON c.canal = v.canal
        WHERE v.inicio BETWEEN ${ini} AND ${fim}
          ${f.camera ? sql`AND v.canal = ${f.camera}` : sql``}
          ${f.classe ? sql`AND v.classe = ${f.classe}` : sql``}
          ${f.cor ? sql`AND v.cor = ${f.cor} AND v.cor_conf >= ${limiar}` : sql``}
        ORDER BY v.inicio DESC LIMIT 200`,
    };
  }
  return {
    tipo: 'pessoas' as const,
    itens: await sql<{ id: number; inicio: Date; camera: string; atributos: AtributosPessoa }[]>`
      SELECT p.id, p.inicio, c.nome AS camera, p.atributos FROM pessoas p JOIN cameras c ON c.canal = p.canal
      WHERE p.inicio BETWEEN ${ini} AND ${fim}
        ${f.camera ? sql`AND p.canal = ${f.camera}` : sql``}
        ${f.cima ? attr('cima', f.cima) : sql``}
        ${f.baixo_tipo ? attr('baixo_tipo', f.baixo_tipo) : sql``}
        ${f.baixo_cor ? attr('baixo_cor', f.baixo_cor) : sql``}
        ${f.genero ? attr('genero', f.genero) : sql``}
        ${f.bone ? attr('bone', f.bone === 'sim') : sql``}
        ${f.mochila ? attr('mochila', f.mochila === 'sim') : sql``}
        ${f.bolsa ? attr('bolsa', f.bolsa === 'sim') : sql``}
      ORDER BY p.inicio DESC LIMIT 200`,
  };
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
