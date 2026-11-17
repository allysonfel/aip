// Armazenamento no celular (IndexedDB): tudo é gravado a cada alteração,
// inclusive as fotos. Nada vai para servidor.
const NOME = 'fundac-vistoria';
let dbp = null;

function abrir() {
  if (dbp) return dbp;
  dbp = new Promise((ok, erro) => {
    const r = indexedDB.open(NOME, 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      db.createObjectStore('kv');
      db.createObjectStore('pontos', { keyPath: 'id' });
      const f = db.createObjectStore('fotos', { keyPath: 'id' });
      f.createIndex('ponto', 'pontoId');
      db.createObjectStore('trajeto', { autoIncrement: true });
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
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

export const pontos = {
  todos: () => tx('pontos', 'readonly', (s) => req(s.getAll())),
  salvar: (p) => tx('pontos', 'readwrite', (s) => { s.put(p); }),
  apagar: (id) => tx('pontos', 'readwrite', (s) => { s.delete(id); }),
  limpar: () => tx('pontos', 'readwrite', (s) => { s.clear(); }),
};

export const fotos = {
  pegar: (id) => tx('fotos', 'readonly', (s) => req(s.get(id))),
  todas: () => tx('fotos', 'readonly', (s) => req(s.getAll())),
  salvar: (f) => tx('fotos', 'readwrite', (s) => { s.put(f); }),
  apagar: (id) => tx('fotos', 'readwrite', (s) => { s.delete(id); }),
  limpar: () => tx('fotos', 'readwrite', (s) => { s.clear(); }),
};

export const trajeto = {
  todos: () => tx('trajeto', 'readonly', (s) => req(s.getAll())),
  add: (p) => tx('trajeto', 'readwrite', (s) => { s.add(p); }),
  limpar: () => tx('trajeto', 'readwrite', (s) => { s.clear(); }),
};

export async function pedirArmazenamentoPersistente() {
  try {
    if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist();
  } catch { /* sem suporte */ }
  return false;
}
