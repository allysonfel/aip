import 'server-only';
import bcrypt from 'bcryptjs';
import { sql } from './db';

// Schema do piloto. O painel é o dono: cria tudo no boot (idempotente) e
// o motor só espera as tabelas existirem.
export async function garantirSchema() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      login TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      nome TEXT NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS sessoes (
      token TEXT PRIMARY KEY,
      usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      expira TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS config (
      chave TEXT PRIMARY KEY,
      valor JSONB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cameras (
      canal TEXT PRIMARY KEY,
      caminho TEXT NOT NULL,
      nome TEXT NOT NULL,
      funcao TEXT NOT NULL DEFAULT '',
      ordem INT NOT NULL DEFAULT 0,
      ativa BOOLEAN NOT NULL DEFAULT false,
      fps REAL NOT NULL DEFAULT 2 CHECK (fps BETWEEN 0.2 AND 10),
      tipo_linha TEXT CHECK (tipo_linha IN ('entrada', 'veiculos')),
      linha JSONB,
      online BOOLEAN NOT NULL DEFAULT false,
      erro TEXT,
      quadro BYTEA,
      quadro_em TIMESTAMPTZ,
      quadro_cru BYTEA,
      quadro_cru_em TIMESTAMPTZ,
      largura INT,
      altura INT,
      pessoas_agora INT NOT NULL DEFAULT 0,
      veiculos_agora INT NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS eventos (
      id BIGSERIAL PRIMARY KEY,
      canal TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'veiculo')),
      classe TEXT NOT NULL,
      sentido TEXT,
      track_id INT,
      ocorrido_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS eventos_quando ON eventos (ocorrido_em);
    CREATE INDEX IF NOT EXISTS eventos_canal_quando ON eventos (canal, ocorrido_em);
    CREATE TABLE IF NOT EXISTS motor_status (
      id INT PRIMARY KEY,
      cpu_pct REAL,
      mem_mb INT,
      ms_inferencia REAL,
      threads INT,
      cameras JSONB,
      atualizado_em TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS motor_amostras (
      id BIGSERIAL PRIMARY KEY,
      em TIMESTAMPTZ NOT NULL DEFAULT now(),
      cpu_pct REAL,
      mem_mb INT,
      ms_inferencia REAL,
      cameras_ativas INT,
      fps_total REAL
    );
    CREATE INDEX IF NOT EXISTS motor_amostras_em ON motor_amostras (em);
    -- Caixas da última análise de cada câmera (o navegador desenha por cima do vídeo).
    CREATE TABLE IF NOT EXISTS deteccoes (
      id BIGSERIAL PRIMARY KEY,
      canal TEXT NOT NULL,
      ts BIGINT NOT NULL,
      objetos JSONB NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS deteccoes_canal_ts ON deteccoes (canal, ts);
    ALTER TABLE cameras ADD COLUMN IF NOT EXISTS contagem_hoje JSONB;
    ALTER TABLE motor_status ADD COLUMN IF NOT EXISTS detector TEXT;
  `);


  await sql`INSERT INTO config (chave, valor) VALUES ('borrar_rostos', 'false'), ('retencao_dias', '30') ON CONFLICT DO NOTHING`;

  // As 5 câmeras da unidade Bezerros (canais conferidos no mediamtx em
  // 14/11/2026). Começa com 3 ligadas, a 2 quadros por segundo.
  const cams = [
    { canal: 'cam1', caminho: 'cam1', nome: 'Frente1', funcao: 'Calçada e fachada (lateral da loja)', ordem: 1, ativa: false, tipo: null, linha: null },
    { canal: 'cam2', caminho: 'cam2', nome: 'Frente2', funcao: 'Rua em frente à loja: carros e motos', ordem: 2, ativa: true, tipo: 'veiculos', linha: { a: [0.1, 0.55], b: [0.82, 0.4] } },
    { canal: 'cam3', caminho: 'cam3', nome: 'Recepção', funcao: 'Interior: máquinas, totem e cadeiras', ordem: 3, ativa: true, tipo: null, linha: null },
    { canal: 'cam4', caminho: 'cam4', nome: 'Sala de Máquinas', funcao: 'Área restrita', ordem: 4, ativa: false, tipo: null, linha: null },
    { canal: 'cam5', caminho: 'cam5-video', nome: 'Salão', funcao: 'Interior: cadeiras, mesa e a porta de entrada', ordem: 5, ativa: true, tipo: 'entrada', linha: { a: [0.28, 0.42], b: [0.6, 0.42] } },
  ];
  for (const c of cams) {
    await sql`INSERT INTO cameras (canal, caminho, nome, funcao, ordem, ativa, tipo_linha, linha)
              VALUES (${c.canal}, ${c.caminho}, ${c.nome}, ${c.funcao}, ${c.ordem}, ${c.ativa}, ${c.tipo}, ${c.linha ? sql.json(c.linha) : null})
              ON CONFLICT (canal) DO NOTHING`;
  }

  // Primeiro acesso: administrador vindo das variáveis do app.
  const login = process.env.ADMIN_USUARIO?.trim().toLowerCase();
  const senha = process.env.ADMIN_SENHA ?? '';
  if (login && senha) {
    const hash = await bcrypt.hash(senha, 11);
    await sql`INSERT INTO usuarios (login, senha_hash, nome) VALUES (${login}, ${hash}, 'Administrador') ON CONFLICT (login) DO NOTHING`;
  }
  // Migração 2 (uma vez só): sem borrão por padrão (sistema interno) e as 5
  // câmeras ligadas, com quadros por segundo conforme a necessidade de cada uma.
  const [v2] = await sql`SELECT 1 FROM config WHERE chave = 'migracao_2'`;
  if (!v2) {
    await sql`UPDATE config SET valor = 'false' WHERE chave = 'borrar_rostos'`;
    const fps: Record<string, number> = { cam2: 5, cam5: 4, cam3: 2, cam1: 2, cam4: 1 };
    for (const [canal, q] of Object.entries(fps)) await sql`UPDATE cameras SET ativa = true, fps = ${q} WHERE canal = ${canal}`;
    await sql`INSERT INTO config (chave, valor) VALUES ('migracao_2', 'true')`;
  }

  await sql`DELETE FROM sessoes WHERE expira < now()`;
}
