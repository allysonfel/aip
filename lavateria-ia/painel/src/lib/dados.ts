import 'server-only';
import { sql } from './db';

const HOJE = sql`(date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo')`;

export const NOMES_VEICULO: Record<string, string> = { carro: 'Carro', moto: 'Moto', caminhao: 'Caminhão', onibus: 'Ônibus', bicicleta: 'Bicicleta' };

export type CameraInfo = {
  canal: string; caminho: string; nome: string; funcao: string; ativa: boolean; fps: number;
  tipo_linha: 'entrada' | 'veiculos' | null; linha: { a: [number, number]; b: [number, number] } | null;
  online: boolean; erro: string | null; contagem_hoje: Record<string, number> | null; quadro_em: Date | null; quadro_cru_em: Date | null;
  largura: number | null; altura: number | null; pessoas_agora: number; veiculos_agora: number;
};

export async function cameras(): Promise<CameraInfo[]> {
  return sql<CameraInfo[]>`
    SELECT canal, caminho, nome, funcao, ativa, fps, tipo_linha, linha, online, erro, contagem_hoje, quadro_em, quadro_cru_em, largura, altura, pessoas_agora, veiculos_agora
    FROM cameras ORDER BY ordem, canal`;
}

export async function config() {
  const linhas = await sql<{ chave: string; valor: unknown }[]>`SELECT chave, valor FROM config`;
  const c = Object.fromEntries(linhas.map((l) => [l.chave, l.valor]));
  return { borrarRostos: c.borrar_rostos === true, retencaoDias: Number(c.retencao_dias ?? 30), limiar: Number(c.limiar_confianca ?? 0.65) };
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

export type VeiculoLinha = { id: number; canal: string; classe: string; inicio: Date; fim: Date; sentido: string | null; cor: string | null; cor_conf: number | null; noturna: boolean; atributos: { cor?: Atributo; pequeno?: boolean } };

export async function veiculosDoDia(limite = 300): Promise<VeiculoLinha[]> {
  return sql<VeiculoLinha[]>`
    SELECT id, canal, classe, inicio, fim, sentido, cor, cor_conf, noturna, atributos FROM veiculos
    WHERE inicio >= ${HOJE} ORDER BY inicio DESC LIMIT ${limite}`;
}

export async function resumoVeiculos(limiar: number) {
  const porCor = await sql<{ cor: string; n: number }[]>`
    SELECT CASE WHEN cor IS NULL OR cor_conf < ${limiar} THEN 'indefinido' ELSE cor END AS cor, count(*)::int AS n
    FROM veiculos WHERE inicio >= ${HOJE} GROUP BY 1 ORDER BY 2 DESC`;
  const porTipo = await sql<{ classe: string; n: number }[]>`SELECT classe, count(*)::int AS n FROM veiculos WHERE inicio >= ${HOJE} GROUP BY 1 ORDER BY 2 DESC`;
  return { porCor, porTipo };
}
