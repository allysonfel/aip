// Armazenamento no aparelho (IndexedDB): tudo é gravado a cada alteração,
// inclusive as fotos, e funciona sem internet. A sincronização (sync.js)
// envia para o sistema e traz o que os outros aparelhos marcaram.
//
// Versão 2: vistorias por dia; trajeto com id (para sincronizar). A migração
// da versão 1 preserva tudo o que já estava no aparelho.
const NOME = 'fundac-vistoria';
let dbp = null;

export const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);

function abrir() {
  if (dbp) return dbp;
  dbp = new Promise((ok, erro) => {
    const r = indexedDB.open(NOME, 2);
    r.onupgradeneeded = (ev) => {
      const db = r.result;
      const t = r.transaction;
      if (ev.oldVersion < 1) {
        db.createObjectStore('kv');
        db.createObjectStore('pontos', { keyPath: 'id' });
        db.createObjectStore('fotos', { keyPath: 'id' }).createIndex('ponto', 'pontoId');
      }
      if (ev.oldVersion < 2) {
        db.createObjectStore('vistorias', { keyPath: 'id' });
        const novo = (itens) => {
          const s = db.createObjectStore('trajeto', { keyPath: 'id' });
          s.createIndex('vistoria', 'vistoriaId');
          // id fixo pelo horário da leitura: o mesmo trajeto vindo de um arquivo importado não duplica
          for (const x of itens) s.put({ ...x, id: x.t ? `tr-${x.t}-${Math.round((x.lat || 0) * 1e5)}` : novoId(), vistoriaId: x.vistoriaId ?? null, enviado: false });
        };
        if (ev.oldVersion >= 1) {
          // trajeto antigo (chave automática): copia para o novo formato sem perder nada
          const g = t.objectStore('trajeto').getAll();
          g.onsuccess = () => { const itens = g.result || []; db.deleteObjectStore('trajeto'); novo(itens); };
        } else novo([]);
      }
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
    r.onblocked = () => erro(new Error('Feche as outras abas do app e abra de novo.'));
  });
  return dbp;
}

async function tx(loja, modo, fn) {
  const db = await abrir();
  return new Promise((ok, erro) => {
    const t = db.transaction(loja, modo);
    const s = t.objectStore(loja);
    let res;
    Promise.resolve(fn(s)).then((v) => { res = v; });
    t.oncomplete = () => ok(res);
    t.onerror = () => erro(t.error);
    t.onabort = () => erro(t.error);
  });
}
const req = (r) => new Promise((ok, erro) => { r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error); });

export const kv = {
  get: (k) => tx('kv', 'readonly', (s) => req(s.get(k))),
  set: (k, v) => tx('kv', 'readwrite', (s) => { s.put(v, k); }),
  del: (k) => tx('kv', 'readwrite', (s) => { s.delete(k); }),
};

const loja = (nome) => ({
  todos: () => tx(nome, 'readonly', (s) => req(s.getAll())),
  pegar: (id) => tx(nome, 'readonly', (s) => req(s.get(id))),
  salvar: (x) => tx(nome, 'readwrite', (s) => { s.put(x); }),
  salvarVarios: (xs) => tx(nome, 'readwrite', (s) => { for (const x of xs) s.put(x); }),
  apagar: (id) => tx(nome, 'readwrite', (s) => { s.delete(id); }),
});

export const vistorias = loja('vistorias');
export const pontos = loja('pontos');
export const trajeto = {
  ...loja('trajeto'),
  add: (p) => tx('trajeto', 'readwrite', (s) => { s.put(p); }),
};

// Fotos guardadas como bytes (ArrayBuffer): o Safari nem sempre aceita Blob
// no IndexedDB (ex.: aba privada). Para o resto do app, continuam sendo Blob.
const paraBlob = (f) => (f && f.bytes ? { ...f, blob: new Blob([f.bytes], { type: f.tipo || 'image/jpeg' }), bytes: undefined } : f);
export const fotos = {
  pegar: async (id) => paraBlob(await tx('fotos', 'readonly', (s) => req(s.get(id)))),
  todas: async () => (await tx('fotos', 'readonly', (s) => req(s.getAll()))).map(paraBlob),
  /** Só os dados (sem os bytes): para contar o que falta enviar. */
  resumo: () => tx('fotos', 'readonly', (s) => new Promise((ok) => {
    const out = [];
    const c = s.openCursor();
    c.onsuccess = () => { const k = c.result; if (!k) return ok(out); out.push({ id: k.value.id, pontoId: k.value.pontoId, enviada: !!k.value.enviada }); k.continue(); };
  })),
  salvar: async (f) => {
    const { blob, ...resto } = f;
    const bytes = blob ? await blob.arrayBuffer() : f.bytes;
    return tx('fotos', 'readwrite', (s) => { s.put({ ...resto, bytes, tipo: (blob && blob.type) || f.tipo || 'image/jpeg' }); });
  },
  apagar: (id) => tx('fotos', 'readwrite', (s) => { s.delete(id); }),
  marcarEnviada: (id) => tx('fotos', 'readwrite', (s) => {
    const r = s.get(id);
    r.onsuccess = () => { if (r.result) s.put({ ...r.result, enviada: true }); };
  }),
};

export async function pedirArmazenamentoPersistente() {
  try {
    if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist();
  } catch { /* sem suporte */ }
  return false;
}
