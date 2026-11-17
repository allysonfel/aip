// Satélite: Esri World Imagery (padrão) ou Mapbox Satellite (com chave).
// Download das imagens só da área da Fundac, para usar sem internet.
import { projetar, desprojetar } from './geo.js';

export const CACHE_TILES = 'fv-tiles-v1';
export const ATRIB_ESRI = 'Imagens © <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics e a comunidade GIS';
export const ATRIB_MAPBOX = '© <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener">Mapbox</a> © <a href="https://www.maxar.com" target="_blank" rel="noopener">Maxar</a>';

export function urlTile(prov, token = '') {
  if (prov === 'mapbox') return `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=${encodeURIComponent(token)}`;
  return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
}
const ZOOMS = { esri: [15, 18], mapbox: [15, 20] };

/** Limites da planta com margem (metros), em lat/lng. */
export function limitesComMargem(encaixe, margem = 200) {
  const p = encaixe.map(projetar);
  const k = 1 / Math.cos((encaixe[0][0] * Math.PI) / 180);
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  const sw = desprojetar([Math.min(...xs) - margem * k, Math.min(...ys) - margem * k]);
  const ne = desprojetar([Math.max(...xs) + margem * k, Math.max(...ys) + margem * k]);
  return { sw, ne };
}
function tileXY(lat, lng, z) {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const s = Math.sin((lat * Math.PI) / 180);
  const y = Math.floor((0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n);
  return [x, y];
}
export function listaTiles(prov, token, encaixe) {
  const { sw, ne } = limitesComMargem(encaixe);
  const [z0, z1] = ZOOMS[prov];
  const base = urlTile(prov, token);
  const urls = [];
  for (let z = z0; z <= z1; z++) {
    // Mapbox @2x com tileSize 512 e zoomOffset -1: o zoom da imagem é o do mapa menos 1.
    const [xa, ya] = tileXY(ne[0], sw[1], z), [xb, yb] = tileXY(sw[0], ne[1], z);
    for (let x = Math.min(xa, xb); x <= Math.max(xa, xb); x++) for (let y = Math.min(ya, yb); y <= Math.max(ya, yb); y++) urls.push(base.replace('{z}', z).replace('{x}', x).replace('{y}', y));
  }
  return urls;
}
export const contarTiles = (prov, encaixe) => listaTiles(prov, '', encaixe).length;

export async function baixarMapaOffline(prov, token, encaixe, aoProgresso) {
  const urls = listaTiles(prov, token, encaixe);
  const cache = await caches.open(CACHE_TILES);
  let feito = 0, ok = 0, falhas = 0, i = 0;
  const trabalhador = async () => {
    while (i < urls.length) {
      const u = urls[i++];
      try {
        if (!(await cache.match(u))) {
          const r = await fetch(u, { mode: 'cors' });
          if (!r.ok) throw new Error(String(r.status));
          await cache.put(u, r);
        }
        ok++;
      } catch { falhas++; }
      feito++;
      aoProgresso?.(feito, urls.length);
    }
  };
  await Promise.all(Array.from({ length: 6 }, trabalhador));
  return { ok, falhas, total: urls.length };
}

/** Imagem de um tile (do cache, ou da internet). */
export async function imagemTile(url) {
  let r = null;
  try { r = await (await caches.open(CACHE_TILES)).match(url); } catch { /* sem cache */ }
  if (!r) { try { r = await fetch(url, { mode: 'cors' }); } catch { return null; } }
  if (!r || !r.ok) return null;
  try { return await createImageBitmap(await r.blob()); } catch { return null; }
}
export { tileXY };
