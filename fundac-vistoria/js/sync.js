// Sincronização com o sistema. O aparelho continua salvando tudo na hora
// (funciona sem internet); quando há conexão, envia o que mudou e recebe o que
// os outros aparelhos marcaram. Vale a versão mais nova de cada registro.
// Nada é apagado do aparelho se ainda tiver alteração local não enviada.
import { kv, vistorias as dbV, pontos as dbP, fotos as dbF, trajeto as dbT } from './db.js';

let rodando = false, deNovo = false, timer = null, cb = null;
const estado = { status: 'aguardando', pendentes: 0, ultimoOk: null, erro: null };
const pendente = (x) => x.enviadoEm !== x.atualizadoEm;

/** cb: { aoReceber({ vistorias, pontos, apagados, trajeto, encaixe }), aoEnviado({ vistorias, pontos }), aoStatus(estado) } */
export function iniciarSync(callbacks) {
  cb = callbacks;
  window.addEventListener('online', () => sincronizar());
  window.addEventListener('offline', () => contar().then((n) => atualizar('offline', { pendentes: n })));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sincronizar(); });
  setInterval(() => sincronizar(), 20000);
  sincronizar();
}
export function agendarSync(ms = 1500) { clearTimeout(timer); timer = setTimeout(() => sincronizar(), ms); }
export const statusSync = () => estado;

function atualizar(status, extra = {}) {
  Object.assign(estado, { status }, extra);
  cb?.aoStatus?.(estado);
}

export async function contar() {
  const [v, p, f, t, enc, encEnv] = await Promise.all([dbV.todos(), dbP.todos(), dbF.resumo(), dbT.todos(), kv.get('encaixeEm'), kv.get('encaixeEnviado')]);
  return v.filter(pendente).length + p.filter(pendente).length + f.filter((x) => !x.enviada).length + (t.some((x) => !x.enviado) ? 1 : 0) + (enc && enc !== encEnv ? 1 : 0);
}

async function req(caminho, opcoes = {}) {
  const r = await fetch(`api/${caminho}`, { cache: 'no-store', credentials: 'same-origin', ...opcoes });
  if (r.status === 401) throw Object.assign(new Error('login'), { login: true });
  if (!r.ok) throw new Error(`${caminho}: ${r.status}`);
  return r;
}
const postJson = (c, corpo) => req(c, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) }).then((r) => r.json());

export async function sincronizar() {
  if (!cb) return;
  if (rodando) { deNovo = true; return; }
  if (!navigator.onLine) { atualizar('offline', { pendentes: await contar() }); return; }
  rodando = true;
  try {
    atualizar('enviando', { pendentes: await contar() });

    // 1) fotos (antes dos pontos, para quem receber o ponto já achar a foto)
    for (const r of await dbF.resumo()) {
      if (r.enviada) continue;
      const f = await dbF.pegar(r.id);
      if (!f || !f.blob) continue;
      const p = await dbP.pegar(f.pontoId);
      await req(`fotos/${f.id}?ponto=${encodeURIComponent(f.pontoId || '')}&vistoria=${encodeURIComponent((p && p.vistoriaId) || '')}`, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: f.blob });
      await dbF.marcarEnviada(f.id);
    }

    // 2) vistorias, pontos, trajeto e encaixe
    const vs = (await dbV.todos()).filter(pendente);
    const ps = (await dbP.todos()).filter(pendente);
    const ts = (await dbT.todos()).filter((t) => !t.enviado);
    const encEm = await kv.get('encaixeEm');
    const encaixe = encEm && encEm !== (await kv.get('encaixeEnviado')) ? { valor: await kv.get('encaixe'), em: encEm } : null;
    const limpa = ({ enviadoEm, _t, ...x }) => x;
    for (let i = 0; i < Math.max(vs.length, ps.length, ts.length, encaixe ? 1 : 0); i += 200) {
      const corpo = { vistorias: vs.slice(i, i + 200).map(limpa), pontos: ps.slice(i, i + 200).map(limpa), trajeto: ts.slice(i, i + 200).map(({ enviado, ...t }) => t), encaixe: i === 0 ? encaixe : null };
      const r = await postJson('sync', corpo);
      const okV = new Set(r.aceitos.vistorias), okP = new Set(r.aceitos.pontos), okT = new Set(r.aceitos.trajeto);
      // marca como enviada a versão que foi (se mudou de novo nesse meio tempo, continua pendente)
      const marcar = async (loja, lista, ok) => {
        const feitos = [];
        for (const x of lista) {
          if (!ok.has(x.id)) continue;
          const atual = await loja.pegar(x.id);
          if (atual && atual.atualizadoEm === x.atualizadoEm) { atual.enviadoEm = x.atualizadoEm; await loja.salvar(atual); feitos.push({ id: x.id, enviadoEm: x.atualizadoEm }); }
        }
        return feitos;
      };
      const ev = await marcar(dbV, corpo.vistorias, okV);
      const ep = await marcar(dbP, corpo.pontos, okP);
      for (const t of corpo.trajeto) if (okT.has(t.id)) await dbT.salvar({ ...t, enviado: true });
      if (corpo.encaixe) await kv.set('encaixeEnviado', corpo.encaixe.em);
      cb.aoEnviado({ vistorias: ev, pontos: ep });
    }

    // 3) o que veio dos outros aparelhos
    const desde = (await kv.get('ultimoPull')) || '';
    const d = await (await req(`sync?desde=${encodeURIComponent(desde)}`)).json();
    const recebidas = [], recebidos = [], apagados = [];
    for (const s of d.vistorias || []) {
      const l = await dbV.pegar(s.id);
      if (l && (l.atualizadoEm || '') >= s.atualizadoEm) continue;
      const v = { ...s, enviadoEm: s.atualizadoEm };
      await dbV.salvar(v);
      recebidas.push(v);
    }
    for (const s of d.pontos || []) {
      const l = await dbP.pegar(s.id);
      if (l && (l.atualizadoEm || '') >= s.atualizadoEm) continue; // a versão daqui é mais nova (ou igual)
      const p = { ...s, enviadoEm: s.atualizadoEm };
      await dbP.salvar(p);
      if (p.apagado) apagados.push(p.id); else recebidos.push(p);
    }
    const trajetoNovo = [];
    for (const t of d.trajeto || []) {
      if (await dbT.pegar(t.id)) continue;
      const x = { ...t, enviado: true };
      await dbT.salvar(x);
      trajetoNovo.push(x);
    }
    let encaixeNovo = null;
    if (d.encaixe && d.encaixe.em && d.encaixe.em > ((await kv.get('encaixeEm')) || '')) {
      await kv.set('encaixe', d.encaixe.valor);
      await kv.set('encaixeEm', d.encaixe.em);
      await kv.set('encaixeEnviado', d.encaixe.em);
      encaixeNovo = d.encaixe.valor;
    }
    await kv.set('ultimoPull', d.agora);
    if (recebidas.length || recebidos.length || apagados.length || trajetoNovo.length || encaixeNovo) await cb.aoReceber({ vistorias: recebidas, pontos: recebidos, apagados, trajeto: trajetoNovo, encaixe: encaixeNovo });
    atualizar('ok', { ultimoOk: new Date().toISOString(), pendentes: await contar(), erro: null });
  } catch (e) {
    const n = await contar().catch(() => estado.pendentes);
    if (e && e.login) atualizar('login', { pendentes: n });
    else atualizar(navigator.onLine ? 'erro' : 'offline', { erro: String(e && e.message), pendentes: n });
  } finally {
    rodando = false;
    if (deNovo) { deNovo = false; agendarSync(300); }
  }
}

/** Busca no sistema uma foto que este aparelho ainda não tem (ex.: tirada no celular, vista no computador). */
export async function baixarFoto(id, pontoId) {
  const r = await req(`fotos/${id}`);
  const blob = await r.blob();
  await dbF.salvar({ id, pontoId, blob, criadoEm: new Date().toISOString(), enviada: true });
  return blob;
}

export async function entrar(login, senha) {
  const r = await fetch('api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ login, senha }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.erro || 'Não foi possível entrar.');
  return d.usuario;
}
export async function quemSou() {
  try { const r = await fetch('api/eu', { cache: 'no-store', credentials: 'same-origin' }); return r.ok ? (await r.json()).usuario : null; } catch { return undefined; }
}
