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
    -- Etapa 2: uma linha por pessoa ou veículo rastreado, com o melhor recorte e os atributos.
    CREATE TABLE IF NOT EXISTS pessoas (
      id BIGSERIAL PRIMARY KEY,
      canal TEXT NOT NULL,
      track_id INT NOT NULL,
      inicio TIMESTAMPTZ NOT NULL,
      fim TIMESTAMPTZ NOT NULL,
      recorte BYTEA,
      atributos JSONB NOT NULL DEFAULT '{}',
      noturna BOOLEAN NOT NULL DEFAULT false,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS pessoas_inicio ON pessoas (inicio);
    CREATE INDEX IF NOT EXISTS pessoas_canal_track ON pessoas (canal, track_id, inicio);
    CREATE TABLE IF NOT EXISTS veiculos (
      id BIGSERIAL PRIMARY KEY,
      canal TEXT NOT NULL,
      track_id INT NOT NULL,
      classe TEXT NOT NULL,
      inicio TIMESTAMPTZ NOT NULL,
      fim TIMESTAMPTZ NOT NULL,
      sentido TEXT,
      recorte BYTEA,
      cor TEXT,
      cor_conf REAL,
      atributos JSONB NOT NULL DEFAULT '{}',
      noturna BOOLEAN NOT NULL DEFAULT false,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS veiculos_inicio ON veiculos (inicio);
    -- Etapa 3: velocidade (calibração por câmera), papel da câmera (fachada),
    -- assinatura visual da pessoa (comparar câmeras) e sequência de imagens do momento.
    ALTER TABLE cameras ADD COLUMN IF NOT EXISTS calibracao JSONB;
    ALTER TABLE cameras ADD COLUMN IF NOT EXISTS fachada BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE pessoas ADD COLUMN IF NOT EXISTS assinatura REAL[];
    ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS velocidade_kmh REAL;
    ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS deslocamento REAL;
    CREATE TABLE IF NOT EXISTS quadros_momento (
      id BIGSERIAL PRIMARY KEY,
      tipo TEXT NOT NULL CHECK (tipo IN ('pessoa', 'veiculo')),
      ref_id BIGINT NOT NULL,
      ts TIMESTAMPTZ NOT NULL,
      img BYTEA NOT NULL
    );
    CREATE INDEX IF NOT EXISTS quadros_momento_ref ON quadros_momento (tipo, ref_id, ts);
    -- Etapa 4: regras da loja (alertas), validação de precisão e contagem manual.
    ALTER TABLE cameras ADD COLUMN IF NOT EXISTS interna BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE cameras ADD COLUMN IF NOT EXISTS zona_totem JSONB;
    ALTER TABLE cameras ADD COLUMN IF NOT EXISTS conf_min REAL;
    ALTER TABLE cameras ADD COLUMN IF NOT EXISTS exclusao JSONB;
    ALTER TABLE cameras ADD COLUMN IF NOT EXISTS zona_atributos JSONB;
    ALTER TABLE cameras ADD COLUMN IF NOT EXISTS area_interna JSONB;
    ALTER TABLE cameras ADD COLUMN IF NOT EXISTS ajuste_video_ms INT NOT NULL DEFAULT 0;
    CREATE TABLE IF NOT EXISTS alertas (
      id BIGSERIAL PRIMARY KEY,
      tipo TEXT NOT NULL,
      canal TEXT,
      nivel TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      imagem BYTEA,
      quando TIMESTAMPTZ NOT NULL DEFAULT now(),
      lido_em TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS alertas_quando ON alertas (quando);
    CREATE TABLE IF NOT EXISTS validacoes (
      id BIGSERIAL PRIMARY KEY,
      tipo TEXT NOT NULL CHECK (tipo IN ('pessoa', 'veiculo')),
      ref_id BIGINT NOT NULL,
      atributo TEXT NOT NULL,
      estimado TEXT,
      correto BOOLEAN NOT NULL,
      usuario_id INT,
      em TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (tipo, ref_id, atributo)
    );
    CREATE TABLE IF NOT EXISTS contagens_manuais (
      id BIGSERIAL PRIMARY KEY,
      de TIMESTAMPTZ NOT NULL,
      ate TIMESTAMPTZ NOT NULL,
      manual INT NOT NULL,
      automatico INT NOT NULL,
      usuario_id INT,
      em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE motor_status ADD COLUMN IF NOT EXISTS detector TEXT;
  `);


  await sql`INSERT INTO config (chave, valor) VALUES ('borrar_rostos', 'false'), ('retencao_dias', '30'), ('limiar_confianca', '0.7') ON CONFLICT DO NOTHING`;

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

  // Migração 3: Frente1 é a câmera da calçada (conversão da fachada).
  const [v3] = await sql`SELECT 1 FROM config WHERE chave = 'migracao_3'`;
  if (!v3) {
    await sql`UPDATE cameras SET fachada = true WHERE canal = 'cam1'`;
    await sql`INSERT INTO config (chave, valor) VALUES ('migracao_3', 'true'), ('parado_min', '3') ON CONFLICT DO NOTHING`;
  }

  // Migração 4: câmeras internas (regras da loja) e horários padrão da loja.
  const [v4] = await sql`SELECT 1 FROM config WHERE chave = 'migracao_4'`;
  if (!v4) {
    await sql`UPDATE cameras SET interna = true WHERE canal IN ('cam3', 'cam4', 'cam5')`;
    const loja = { abre: 6, fecha: 23, limpeza_de: 14, limpeza_ate: 17, fachada_s: 60, totem_s: 180, regras: { loja_fechada: true, fechamento: true, sala_maquinas: true, camera_caida: true, pet: true, fachada_fechada: true, totem: true } };
    await sql`INSERT INTO config (chave, valor) VALUES ('loja', ${sql.json(loja)}) ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO config (chave, valor) VALUES ('migracao_4', 'true')`;
  }

  // Migração 5: confiança mínima maior nas câmeras da frente (lixo e sombra viravam "pessoa").
  const [v5] = await sql`SELECT 1 FROM config WHERE chave = 'migracao_5'`;
  if (!v5) {
    await sql`UPDATE cameras SET conf_min = CASE WHEN canal IN ('cam1', 'cam2') THEN 0.5 ELSE 0.4 END WHERE conf_min IS NULL`;
    await sql`INSERT INTO config (chave, valor) VALUES ('migracao_5', 'true')`;
  }

  // Migração 6: confiança mínima de 70% para mostrar um atributo.
  const [v6] = await sql`SELECT 1 FROM config WHERE chave = 'migracao_6'`;
  if (!v6) {
    await sql`UPDATE config SET valor = '0.7' WHERE chave = 'limiar_confianca' AND (valor)::text::real < 0.7`;
    await sql`INSERT INTO config (chave, valor) VALUES ('migracao_6', 'true')`;
  }

  // Migração 7: área interna (só o chão de dentro da loja, sem a porta de vidro
  // nem a vitrine) no Salão e na Recepção: as regras da loja só valem dentro dela.
  const [v7] = await sql`SELECT 1 FROM config WHERE chave = 'migracao_7'`;
  if (!v7) {
    const areas: Record<string, [number, number][]> = {
      cam5: [[0.37, 0.29], [0.58, 0.29], [0.8, 0.47], [1, 0.72], [1, 1], [0.27, 1], [0.24, 0.62], [0.3, 0.42]],
      cam3: [[0, 0.27], [0.4, 0.3], [0.52, 0.55], [0.68, 0.86], [0.66, 1], [0, 1]],
    };
    for (const [canal, area] of Object.entries(areas)) await sql`UPDATE cameras SET area_interna = ${sql.json(area)} WHERE canal = ${canal} AND area_interna IS NULL`;
    await sql`INSERT INTO config (chave, valor) VALUES ('migracao_7', 'true')`;
  }

  await sql`DELETE FROM sessoes WHERE expira < now()`;
}
