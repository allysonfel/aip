// Funciona sem internet: o app (código, fontes, planta) fica guardado na
// primeira visita; as imagens de satélite ficam num cache próprio.
const VERSAO = 'fv-app-v2';
const TILES = 'fv-tiles-v1';
const APP = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/dados.js', 'js/geo.js', 'js/db.js', 'js/exportar.js', 'js/offline.js',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css',
  'fonts/barlow-latin-400-normal.woff2', 'fonts/barlow-latin-500-normal.woff2', 'fonts/barlow-latin-600-normal.woff2',
  'fonts/barlow-condensed-latin-600-normal.woff2', 'fonts/barlow-condensed-latin-700-normal.woff2',
  'img/aip-logo.png', 'img/aip-icone-192.png', 'img/aip-icone-512.png', 'img/aip-icone-apple.png',
  'img/planta-transparente.webp', 'img/planta-restaurada.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO && k !== TILES).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const ehTile = (u) => u.hostname === 'server.arcgisonline.com' || u.hostname === 'api.mapbox.com';

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (ehTile(u)) {
    // satélite: primeiro o guardado; se não tiver, busca e guarda
    e.respondWith((async () => {
      const c = await caches.open(TILES);
      const r = await c.match(req.url);
      if (r) return r;
      try {
        const n = await fetch(req.url, { mode: 'cors' });
        if (n.ok) c.put(req.url, n.clone());
        return n;
      } catch {
        return new Response('', { status: 504 });
      }
    })());
    return;
  }
  if (u.origin !== self.location.origin) return;
  // app: responde com o guardado na hora e atualiza em segundo plano
  e.respondWith((async () => {
    const c = await caches.open(VERSAO);
    const chave = req.mode === 'navigate' ? new URL('index.html', self.registration.scope).href : req.url;
    const r = await c.match(chave, { ignoreSearch: true });
    const rede = fetch(req).then((n) => { if (n.ok && n.type === 'basic') c.put(chave, n.clone()); return n; }).catch(() => null);
    if (r) { e.waitUntil(rede); return r; }
    const n = await rede;
    return n || new Response('Sem conexão.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
