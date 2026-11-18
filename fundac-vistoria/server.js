// Servidor da vistoria de câmeras da Fundac.
// - Entrega o app (PWA) em /fundac-vistoria, só para quem fez login.
// - Guarda vistorias, pontos, fotos, trajeto e encaixe da planta no Postgres
//   do projeto, para todos os aparelhos verem e continuarem a mesma vistoria.
// - O app continua salvando tudo no celular e sincroniza quando há internet.
//
// API (prefixo /fundac-vistoria/api):
//   POST login {login, senha} | POST logout | GET eu
//   GET  sync?desde=ISO -> { agora, vistorias, pontos, trajeto, encaixe }
//   POST sync { vistorias, pontos, trajeto, encaixe } -> { aceitos }
//   PUT  fotos/:id?ponto=&vistoria= (JPEG) | GET fotos/:id
// Conflitos: vale a versão com `atualizadoEm` mais recente (por registro).
// Apagar é um "túmulo" (apagado: true), para avisar os outros aparelhos.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const postgres = require('postgres');

const PREFIXO = '/fundac-vistoria';
const PUBLICO = path.resolve(process.env.FV_PUBLICO || path.join(__dirname, 'public'));
const PORTA = Number(process.env.PORT || 80);
const sql = postgres(process.env.DATABASE_URL, { max: 5, idle_timeout: 30, onnotice: () => {} });

const COOKIE = 'fv_sessao';
const SESSAO_DIAS = 180;
const LIVRES = [/^entrar\.html$/, /^fonts\//, /^img\/aip-logo\.png$/, /^img\/aip-icone-/, /^manifest\.webmanifest$/, /^sw\.js$/];

// ------------------------------------------------------------------ banco
async function prepararBanco() {
  await sql`CREATE TABLE IF NOT EXISTS usuarios (id serial PRIMARY KEY, login text UNIQUE NOT NULL, nome text NOT NULL, senha_hash text NOT NULL, criado_em timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS sessoes (token_hash text PRIMARY KEY, usuario_id int NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, expira timestamptz NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS vistorias (id text PRIMARY KEY, dados jsonb NOT NULL, atualizado_em text NOT NULL, apagado boolean NOT NULL DEFAULT false, servidor_em timestamptz NOT NULL DEFAULT clock_timestamp())`;
  await sql`CREATE TABLE IF NOT EXISTS pontos (id text PRIMARY KEY, vistoria_id text, dados jsonb NOT NULL, atualizado_em text NOT NULL, apagado boolean NOT NULL DEFAULT false, servidor_em timestamptz NOT NULL DEFAULT clock_timestamp())`;
  await sql`CREATE TABLE IF NOT EXISTS fotos (id text PRIMARY KEY, ponto_id text, vistoria_id text, mime text NOT NULL DEFAULT 'image/jpeg', tamanho int NOT NULL, bytes bytea NOT NULL, criado_em timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS trajeto (id text PRIMARY KEY, vistoria_id text, t bigint, lat double precision, lng double precision, acc real, servidor_em timestamptz NOT NULL DEFAULT clock_timestamp())`;
  await sql`CREATE TABLE IF NOT EXISTS config (chave text PRIMARY KEY, valor jsonb, atualizado_em text NOT NULL, servidor_em timestamptz NOT NULL DEFAULT clock_timestamp())`;
  await sql`CREATE INDEX IF NOT EXISTS pontos_servidor_em ON pontos (servidor_em)`;
  await sql`CREATE INDEX IF NOT EXISTS vistorias_servidor_em ON vistorias (servidor_em)`;
  await sql`CREATE INDEX IF NOT EXISTS trajeto_servidor_em ON trajeto (servidor_em)`;
  await sql`DELETE FROM sessoes WHERE expira < now()`;
  const [n] = await sql`SELECT count(*)::int AS n FROM usuarios`;
  if (!n.n && process.env.FV_USUARIO && process.env.FV_SENHA) {
    await sql`INSERT INTO usuarios (login, nome, senha_hash) VALUES (${process.env.FV_USUARIO.trim().toLowerCase()}, ${process.env.FV_NOME || 'Administrador'}, ${hashSenha(process.env.FV_SENHA)})`;
    console.log('usuário inicial criado a partir de FV_USUARIO');
  }
}

// ------------------------------------------------------------------ senha e sessão
function hashSenha(senha) {
  const sal = crypto.randomBytes(16);
  const h = crypto.scryptSync(senha, sal, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$${sal.toString('base64')}$${h.toString('base64')}`;
}
function conferirSenha(senha, guardado) {
  const [, sal, h] = String(guardado).split('$');
  if (!sal || !h) return false;
  const calc = crypto.scryptSync(senha, Buffer.from(sal, 'base64'), 32, { N: 16384, r: 8, p: 1 });
  const esperado = Buffer.from(h, 'base64');
  return calc.length === esperado.length && crypto.timingSafeEqual(calc, esperado);
}
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const cacheSessoes = new Map(); // hash -> { usuario, ate }

function lerCookie(req) {
  const m = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([A-Za-z0-9_-]+)`));
  return m ? m[1] : null;
}
async function usuarioDa(req) {
  const tok = lerCookie(req);
  if (!tok) return null;
  const h = sha(tok);
  const c = cacheSessoes.get(h);
  if (c && c.ate > Date.now()) return c.usuario;
  const [u] = await sql`SELECT u.id, u.login, u.nome FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token_hash = ${h} AND s.expira > now()`;
  if (u) cacheSessoes.set(h, { usuario: u, ate: Date.now() + 60000 });
  return u || null;
}
const cookieSessao = (tok, dias) => `${COOKIE}=${tok}; Path=${PREFIXO}; Max-Age=${dias * 86400}; HttpOnly;${process.env.FV_LOCAL ? "" : " Secure;"} SameSite=Lax`;
const falhas = new Map(); // ip -> { n, ate }

// ------------------------------------------------------------------ http
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const CABECALHOS = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'Permissions-Policy': 'geolocation=(self), camera=(self)' };

function responder(res, status, corpo, tipo = 'application/json', extra = {}) {
  res.writeHead(status, { ...CABECALHOS, 'Content-Type': tipo, 'Cache-Control': 'no-store', ...extra });
  res.end(typeof corpo === 'string' || Buffer.isBuffer(corpo) ? corpo : JSON.stringify(corpo));
}
function lerCorpo(req, limite) {
  return new Promise((ok, erro) => {
    const partes = [];
    let tam = 0;
    req.on('data', (c) => { tam += c.length; if (tam > limite) { erro(Object.assign(new Error('grande demais'), { status: 413 })); req.destroy(); } else partes.push(c); });
    req.on('end', () => ok(Buffer.concat(partes)));
    req.on('error', erro);
  });
}
const lerJson = async (req, limite) => { const b = await lerCorpo(req, limite); return b.length ? JSON.parse(b.toString('utf8')) : {}; };
const idOk = (s) => typeof s === 'string' && /^[A-Za-z0-9-]{6,64}$/.test(s);
const textoOk = (s) => typeof s === 'string' && s.length <= 40;

function estatico(req, res, rel, extra = {}) {
  let arq = path.normalize(path.join(PUBLICO, rel));
  if (!arq.startsWith(PUBLICO)) return responder(res, 400, 'Caminho inválido.', 'text/plain; charset=utf-8');
  if (rel === '' || rel.endsWith('/')) arq = path.join(arq, 'index.html');
  fs.stat(arq, (erro, st) => {
    if (erro || !st.isFile()) return responder(res, 404, 'Não encontrado.', 'text/plain; charset=utf-8');
    const h = { ...CABECALHOS, 'Content-Type': TIPOS[path.extname(arq).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'Content-Length': st.size, ...extra };
    if (rel === 'sw.js') h['Service-Worker-Allowed'] = `${PREFIXO}/`;
    res.writeHead(200, h);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(arq).pipe(res);
  });
}

// ------------------------------------------------------------------ api
async function api(req, res, rota, url, usuario) {
  if (rota === 'login' && req.method === 'POST') {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const f = falhas.get(ip);
    if (f && f.n >= 8 && f.ate > Date.now()) return responder(res, 429, { erro: 'Muitas tentativas. Espere alguns minutos.' });
    const { login, senha } = await lerJson(req, 4000);
    const [u] = typeof login === 'string' ? await sql`SELECT id, login, nome, senha_hash FROM usuarios WHERE login = ${login.trim().toLowerCase()}` : [];
    if (!u || typeof senha !== 'string' || !conferirSenha(senha, u.senha_hash)) {
      falhas.set(ip, { n: (f && f.ate > Date.now() ? f.n : 0) + 1, ate: Date.now() + 10 * 60000 });
      await new Promise((r) => setTimeout(r, 600));
      return responder(res, 401, { erro: 'Usuário ou senha incorretos.' });
    }
    falhas.delete(ip);
    const tok = crypto.randomBytes(32).toString('base64url');
    await sql`INSERT INTO sessoes (token_hash, usuario_id, expira) VALUES (${sha(tok)}, ${u.id}, now() + ${`${SESSAO_DIAS} days`}::interval)`;
    return responder(res, 200, { usuario: { login: u.login, nome: u.nome } }, 'application/json', { 'Set-Cookie': cookieSessao(tok, SESSAO_DIAS) });
  }
  if (rota === 'logout' && req.method === 'POST') {
    const tok = lerCookie(req);
    if (tok) { await sql`DELETE FROM sessoes WHERE token_hash = ${sha(tok)}`; cacheSessoes.delete(sha(tok)); }
    return responder(res, 200, { ok: true }, 'application/json', { 'Set-Cookie': cookieSessao('x', 0) });
  }
  if (!usuario) return responder(res, 401, { erro: 'Faça login.' });

  if (rota === 'eu') return responder(res, 200, { usuario: { login: usuario.login, nome: usuario.nome } });

  if (rota === 'sync' && req.method === 'GET') {
    const desde = url.searchParams.get('desde');
    const d = desde && !Number.isNaN(Date.parse(desde)) ? desde : '1970-01-01T00:00:00Z';
    const [agora] = await sql`SELECT (clock_timestamp() - interval '30 seconds') AS t`;
    const vist = await sql`SELECT id, dados, atualizado_em, apagado FROM vistorias WHERE servidor_em > ${d}::timestamptz`;
    const pts = await sql`SELECT id, vistoria_id, dados, atualizado_em, apagado FROM pontos WHERE servidor_em > ${d}::timestamptz`;
    const traj = await sql`SELECT id, vistoria_id, t, lat, lng, acc FROM trajeto WHERE servidor_em > ${d}::timestamptz ORDER BY t`;
    const [enc] = await sql`SELECT valor, atualizado_em FROM config WHERE chave = 'encaixe' AND servidor_em > ${d}::timestamptz`;
    return responder(res, 200, {
      agora: agora.t.toISOString(),
      vistorias: vist.map((v) => ({ ...v.dados, id: v.id, atualizadoEm: v.atualizado_em, apagado: v.apagado })),
      pontos: pts.map((p) => ({ ...p.dados, id: p.id, vistoriaId: p.vistoria_id, atualizadoEm: p.atualizado_em, apagado: p.apagado })),
      trajeto: traj.map((t) => ({ id: t.id, vistoriaId: t.vistoria_id, t: Number(t.t), lat: t.lat, lng: t.lng, acc: t.acc })),
      encaixe: enc ? { valor: enc.valor, em: enc.atualizado_em } : null,
    });
  }

  if (rota === 'sync' && req.method === 'POST') {
    const c = await lerJson(req, 20e6);
    const aceitos = { vistorias: [], pontos: [], trajeto: [] };
    await sql.begin(async (tx) => {
      for (const v of Array.isArray(c.vistorias) ? c.vistorias : []) {
        if (!v || !idOk(v.id) || !textoOk(v.atualizadoEm)) continue;
        const { id, atualizadoEm, apagado = false, enviadoEm, ...dados } = v;
        await tx`INSERT INTO vistorias (id, dados, atualizado_em, apagado) VALUES (${id}, ${tx.json(dados)}, ${atualizadoEm}, ${!!apagado})
          ON CONFLICT (id) DO UPDATE SET dados = EXCLUDED.dados, atualizado_em = EXCLUDED.atualizado_em, apagado = EXCLUDED.apagado, servidor_em = clock_timestamp()
          WHERE vistorias.atualizado_em <= EXCLUDED.atualizado_em`;
        aceitos.vistorias.push(id);
      }
      for (const p of Array.isArray(c.pontos) ? c.pontos : []) {
        if (!p || !idOk(p.id) || !textoOk(p.atualizadoEm)) continue;
        const { id, vistoriaId = null, atualizadoEm, apagado = false, enviadoEm, _t, ...dados } = p;
        await tx`INSERT INTO pontos (id, vistoria_id, dados, atualizado_em, apagado) VALUES (${id}, ${vistoriaId}, ${tx.json(dados)}, ${atualizadoEm}, ${!!apagado})
          ON CONFLICT (id) DO UPDATE SET vistoria_id = COALESCE(EXCLUDED.vistoria_id, pontos.vistoria_id), dados = EXCLUDED.dados, atualizado_em = EXCLUDED.atualizado_em, apagado = EXCLUDED.apagado, servidor_em = clock_timestamp()
          WHERE pontos.atualizado_em <= EXCLUDED.atualizado_em`;
        aceitos.pontos.push(id);
      }
      for (const t of Array.isArray(c.trajeto) ? c.trajeto : []) {
        if (!t || !idOk(t.id) || typeof t.lat !== 'number' || typeof t.lng !== 'number') continue;
        await tx`INSERT INTO trajeto (id, vistoria_id, t, lat, lng, acc) VALUES (${t.id}, ${t.vistoriaId || null}, ${Math.round(t.t) || 0}, ${t.lat}, ${t.lng}, ${t.acc ?? null}) ON CONFLICT (id) DO NOTHING`;
        aceitos.trajeto.push(t.id);
      }
      const e = c.encaixe;
      if (e && Array.isArray(e.valor) && e.valor.length === 4 && textoOk(e.em)) {
        await tx`INSERT INTO config (chave, valor, atualizado_em) VALUES ('encaixe', ${tx.json(e.valor)}, ${e.em})
          ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = EXCLUDED.atualizado_em, servidor_em = clock_timestamp()
          WHERE config.atualizado_em <= EXCLUDED.atualizado_em`;
      }
    });
    return responder(res, 200, { aceitos });
  }

  const mf = rota.match(/^fotos\/([A-Za-z0-9-]{6,64})$/);
  if (mf && req.method === 'PUT') {
    const corpo = await lerCorpo(req, 6e6);
    if (corpo.length < 100 || corpo[0] !== 0xff || corpo[1] !== 0xd8) return responder(res, 400, { erro: 'Envie uma imagem JPEG.' });
    await sql`INSERT INTO fotos (id, ponto_id, vistoria_id, tamanho, bytes) VALUES (${mf[1]}, ${url.searchParams.get('ponto')}, ${url.searchParams.get('vistoria')}, ${corpo.length}, ${corpo}) ON CONFLICT (id) DO NOTHING`;
    return responder(res, 200, { ok: true });
  }
  if (mf && req.method === 'GET') {
    const [f] = await sql`SELECT mime, bytes FROM fotos WHERE id = ${mf[1]}`;
    if (!f) return responder(res, 404, { erro: 'Foto ainda não enviada.' });
    return responder(res, 200, f.bytes, f.mime, { 'Cache-Control': 'private, max-age=31536000, immutable' });
  }
  return responder(res, 404, { erro: 'Rota desconhecida.' });
}

// ------------------------------------------------------------------ servidor
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    let p = decodeURIComponent(url.pathname);
    if (p === '/saude' || p === `${PREFIXO}/saude`) return responder(res, 200, 'ok', 'text/plain');
    if (p === PREFIXO) return responder(res, 301, '', 'text/plain', { Location: `${PREFIXO}/` });
    if (p.startsWith(`${PREFIXO}/`)) p = p.slice(PREFIXO.length);
    const rel = p.replace(/^\/+/, '');
    if (rel.startsWith('api/')) return await api(req, res, rel.slice(4), url, await usuarioDa(req).catch(() => null));
    if (req.method !== 'GET' && req.method !== 'HEAD') return responder(res, 405, 'Método não permitido.', 'text/plain; charset=utf-8');
    if (LIVRES.some((r) => r.test(rel))) return estatico(req, res, rel);
    const usuario = await usuarioDa(req);
    if (usuario) return estatico(req, res, rel);
    // sem login: a página do app vira a tela de entrar; o resto é negado
    if (rel === '' || rel === 'index.html') return estatico(req, res, 'entrar.html', { 'X-Tela-Login': '1' });
    return responder(res, 401, 'Faça login.', 'text/plain; charset=utf-8');
  } catch (e) {
    console.error(e);
    if (!res.headersSent) responder(res, e.status || 500, { erro: e.status === 413 ? 'Arquivo grande demais.' : 'Falha no servidor.' });
  }
}).listen(PORTA, async () => {
  for (let i = 1; ; i++) {
    try { await prepararBanco(); break; } catch (e) { console.error(`banco indisponível (tentativa ${i}):`, e.message); await new Promise((r) => setTimeout(r, Math.min(30000, i * 2000))); }
  }
  console.log(`vistoria fundac na porta ${PORTA}`);
});
