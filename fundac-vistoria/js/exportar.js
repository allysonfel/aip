// Exportar (arquivo completo, CSV e PNG), compartilhar e importar.
import * as D from './dados.js';
import { fotos as dbFotos } from './db.js';
import { imagemTile, urlTile } from './offline.js';
import { baixarFoto } from './sync.js';

const carimbo = () => { const d = new Date(), z = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`; };
const dataBR = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR').replace(',', '') : '');
const num = (v, casas = 7) => (v == null || Number.isNaN(v) ? '' : Number(v).toFixed(casas));

// ------------------------------------------------------------------ JSON completo
function blobParaBase64(blob) {
  return new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = erro; r.readAsDataURL(blob); });
}
export async function exportarJSON(est) {
  const fotos = [];
  const quais = new Set(est.pontos.flatMap((p) => p.fotos || []));
  for (const f of await dbFotos.todas()) if (quais.has(f.id) && f.blob) fotos.push({ id: f.id, pontoId: f.pontoId, criadoEm: f.criadoEm, gps: f.gps, tipo: f.blob.type || 'image/jpeg', base64: await blobParaBase64(f.blob) });
  // fotos tiradas em outro aparelho e ainda não abertas neste: busca no sistema
  const tem = new Set(fotos.map((f) => f.id));
  for (const p of est.pontos) for (const id of p.fotos || []) {
    if (tem.has(id)) continue;
    try { const blob = await baixarFoto(id, p.id); fotos.push({ id, pontoId: p.id, criadoEm: p.atualizadoEm, gps: null, tipo: 'image/jpeg', base64: await blobParaBase64(blob) }); tem.add(id); } catch { /* sem internet ou foto ainda não enviada */ }
  }
  const pontos = est.pontos.map(({ _pos, _plano, enviadoEm, ...p }) => { delete p._t; return { ...p, latitude: _pos[0], longitude: _pos[1], plantaX: Math.round(_plano[0] * D.PLANTA.largura), plantaY: Math.round(_plano[1] * D.PLANTA.altura) }; });
  const ids = new Set(pontos.map((p) => p.vistoriaId));
  const vistorias = [...est.vistorias.values()].filter((v) => ids.has(v.id)).map(({ enviadoEm, ...v }) => v);
  const trajeto = est.trajeto.filter((t) => ids.has(t.vistoriaId)).map(({ enviado, ...t }) => t);
  const dados = { app: 'fundac-vistoria', versao: 2, exportadoEm: new Date().toISOString(), vistorias, encaixe: est.encaixe, trajeto, pontos, fotos };
  return new File([JSON.stringify(dados)], `fundac-vistoria-${carimbo()}.json`, { type: 'application/json' });
}

export async function importarArquivo(arq) {
  const d = JSON.parse(await arq.text());
  if (d.app !== 'fundac-vistoria' || !Array.isArray(d.pontos)) throw new Error('arquivo de outro app');
  const fotos = (d.fotos || []).map((f) => {
    const bin = atob(f.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { id: f.id, pontoId: f.pontoId, criadoEm: f.criadoEm, gps: f.gps, blob: new Blob([bytes], { type: f.tipo || 'image/jpeg' }) };
  });
  const pontos = d.pontos.map(({ latitude, longitude, plantaX, plantaY, ...p }) => p);
  return { pontos, fotos, trajeto: d.trajeto || [], vistorias: d.vistorias || [], encaixe: d.encaixe, conf: d.conferencia, vistoria: d.vistoria };
}

// ------------------------------------------------------------------ CSV
export function exportarCSV(est) {
  const cab = ['vistoria', 'data da vistoria', 'código', 'tipo', 'grupo', 'local', 'rua', 'situação', 'tipo de câmera', 'direção (graus)', 'abertura', 'abertura (graus)', 'alcance (m)', 'altura', 'pega rosto', 'cobertura', 'prioridade IA', 'latitude', 'longitude', 'planta x (px)', 'planta y (px)', 'marcado por', 'ajustado à mão', 'precisão GPS (m)', 'fotos', 'observações', 'criado em', 'alterado em'];
  const linhas = est.pontos.map((p) => {
    const cam = p.tipo === 'camera';
    const ab = D.ABERTURAS.find((a) => a.id === p.abertura);
    const outro = D.OUTROS.find((x) => x.id === p.categoria);
    const v = est.vistorias.get(p.vistoriaId);
    return [
      v ? v.nome : '', v && v.data ? v.data.split('-').reverse().join('/') : '',
      cam ? p.codigo : '', cam ? 'câmera' : (outro ? outro.nome : 'outro ponto'), cam ? p.grupo : '', cam ? p.local : '', cam ? (p.rua ?? '') : '',
      cam ? p.situacao : '', cam ? p.tipoCam : '', cam && p.direcao != null ? Math.round(p.direcao) : '', cam && ab ? ab.nome : '', cam && ab ? ab.graus : '', cam ? p.alcance : '',
      cam ? (D.ALTURAS.find((a) => a.id === p.altura)?.nome || '') : '', cam ? p.rosto : '', cam ? (p.cobre || []).join(', ') : '', cam ? (p.prioridadeIA || '') : '',
      num(p._pos[0]), num(p._pos[1]), Math.round(p._plano[0] * D.PLANTA.largura), Math.round(p._plano[1] * D.PLANTA.altura),
      p.origem === 'gps' ? 'GPS' : 'toque no mapa', p.manual ? 'sim' : 'não', p.gps ? Math.round(p.gps.acc) : '', (p.fotos || []).length, (p.obs || '').replace(/\s+/g, ' ').trim(),
      dataBR(p.criadoEm), dataBR(p.atualizadoEm),
    ];
  });
  const cel = (v) => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = '﻿' + [cab, ...linhas].map((l) => l.map(cel).join(';')).join('\r\n');
  return new File([csv], `fundac-vistoria-${carimbo()}.csv`, { type: 'text/csv' });
}

// ------------------------------------------------------------------ PNG do mapa
function mundo([lat, lng], z) {
  const n = 256 * 2 ** z;
  const s = Math.sin((lat * Math.PI) / 180);
  return [((lng + 180) / 360) * n, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n];
}
function carregarImagem(src) { return new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }); }
function triangulo(ctx, img, s, d) {
  const [[x0, y0], [x1, y1], [x2, y2]] = s, [[u0, v0], [u1, v1], [u2, v2]] = d;
  const det = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
  if (!det) return;
  const lin = (w0, w1, w2) => [
    (w0 * (y1 - y2) + w1 * (y2 - y0) + w2 * (y0 - y1)) / det,
    (w0 * (x2 - x1) + w1 * (x0 - x2) + w2 * (x1 - x0)) / det,
    (w0 * (x1 * y2 - x2 * y1) + w1 * (x2 * y0 - x0 * y2) + w2 * (x0 * y1 - x1 * y0)) / det,
  ];
  const [a, c, e] = lin(u0, u1, u2), [b, dd, f] = lin(v0, v1, v2);
  const cx = (u0 + u1 + u2) / 3, cy = (v0 + v1 + v2) / 3;
  const ex = (u, v) => [u + (u - cx) * 0.02 + Math.sign(u - cx) * 0.6, v + (v - cy) * 0.02 + Math.sign(v - cy) * 0.6];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...ex(u0, v0)); ctx.lineTo(...ex(u1, v1)); ctx.lineTo(...ex(u2, v2)); ctx.closePath();
  ctx.clip();
  ctx.transform(a, b, c, dd, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

export async function exportarPNG(est) {
  const zt = est.provedor === 'mapbox' ? 19 : 18;
  const zr = 19; // escala de desenho
  const k = 2 ** (zr - zt);
  const cantos = est.encaixe.map((c) => mundo(c, zr));
  const margem = 70, topo = 96, base = 70;
  const minx = Math.floor(Math.min(...cantos.map((c) => c[0])) - margem), maxx = Math.ceil(Math.max(...cantos.map((c) => c[0])) + margem);
  const miny = Math.floor(Math.min(...cantos.map((c) => c[1])) - margem), maxy = Math.ceil(Math.max(...cantos.map((c) => c[1])) + margem);
  const W = Math.ceil(maxx - minx), H = Math.ceil(maxy - miny) + topo + base;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const P = (ll) => { const [x, y] = mundo(ll, zr); return [x - minx, y - miny + topo]; };

  // satélite
  ctx.save();
  ctx.beginPath(); ctx.rect(0, topo, W, H - topo - base); ctx.clip();
  const t0 = [Math.floor(minx / k / 256), Math.floor(miny / k / 256)], t1 = [Math.floor(maxx / k / 256), Math.floor(maxy / k / 256)];
  const base_ = urlTile(est.provedor, est.mapboxToken);
  const tarefas = [];
  for (let x = t0[0]; x <= t1[0]; x++) for (let y = t0[1]; y <= t1[1]; y++) {
    const u = base_.replace('{z}', zt).replace('{x}', x).replace('{y}', y);
    tarefas.push(imagemTile(u).then((img) => { if (img) ctx.drawImage(img, x * 256 * k - minx, y * 256 * k - miny + topo, 256 * k + 1, 256 * k + 1); }));
  }
  await Promise.all(tarefas);
  ctx.restore();

  // planta (perspectiva por malha de triângulos)
  if (est.camadas.planta) {
    const img = await carregarImagem(D.PLANTA.arquivo);
    if (img) {
      ctx.save();
      ctx.globalAlpha = est.opacidade;
      const N = 20, iw = img.naturalWidth, ih = img.naturalHeight;
      const pt = (i, j) => P(est.planoParaLL([i / N, j / N]));
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const s00 = [(i / N) * iw, (j / N) * ih], s10 = [((i + 1) / N) * iw, (j / N) * ih], s01 = [(i / N) * iw, ((j + 1) / N) * ih], s11 = [((i + 1) / N) * iw, ((j + 1) / N) * ih];
        const d00 = pt(i, j), d10 = pt(i + 1, j), d01 = pt(i, j + 1), d11 = pt(i + 1, j + 1);
        triangulo(ctx, img, [s00, s10, s11], [d00, d10, d11]);
        triangulo(ctx, img, [s00, s11, s01], [d00, d11, d01]);
      }
      ctx.restore();
    }
  }

  const sombra = (f) => { ctx.save(); ctx.shadowColor = '#000'; ctx.shadowBlur = 5; f(); ctx.restore(); };
  // portões
  ctx.font = '700 15px "Barlow Condensed", sans-serif';
  ctx.textBaseline = 'middle';
  for (const g of est.portoes) {
    const [x, y] = P(g.ll);
    ctx.fillStyle = g.inicio ? '#5fd3ff' : '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.strokeRect(x - 7, y - 7, 14, 14); ctx.fillRect(x - 7, y - 7, 14, 14);
    sombra(() => { ctx.fillStyle = g.inicio ? '#5fd3ff' : '#fff'; ctx.fillText(g.inicio ? `Portão ${g.n} · Entrada` : `Portão ${g.n}`, x + 11, y); });
  }
  // trajeto
  if (est.camadas.trajeto && est.trajetoCorrigido.length > 1) {
    ctx.save(); ctx.strokeStyle = 'rgba(95,211,255,0.9)'; ctx.lineWidth = 3; ctx.setLineDash([3, 7]); ctx.lineCap = 'round';
    ctx.beginPath(); est.trajetoCorrigido.forEach((ll, i) => { const [x, y] = P(ll); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore();
  }
  // cones
  const raioPx = (ll, m) => m / (40075016.686 * Math.cos((ll[0] * Math.PI) / 180) / (256 * 2 ** zr));
  for (const p of est.pontos) {
    if (p.tipo !== 'camera' || p.direcao == null || !est.camadas.cones) continue;
    const [x, y] = P(p._pos);
    const ab = (D.ABERTURAS.find((a) => a.id === p.abertura) || D.ABERTURAS[1]).graus;
    const r = raioPx(p._pos, Number(p.alcance) || 25);
    const a0 = ((p.direcao - ab / 2 - 90) * Math.PI) / 180, a1 = ((p.direcao + ab / 2 - 90) * Math.PI) / 180;
    ctx.save(); ctx.fillStyle = est.corPino(p); ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, a0, a1); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.9; ctx.strokeStyle = est.corPino(p); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
  }
  // outros pontos
  for (const p of est.pontos) {
    if (p.tipo === 'camera') continue;
    const [x, y] = P(p._pos);
    const o = D.OUTROS.find((q) => q.id === p.categoria);
    ctx.fillStyle = o ? o.cor : '#888'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x - 10, y - 10, 20, 20, 4); ctx.fill(); ctx.stroke();
  }
  // câmeras
  ctx.font = '700 14px "Barlow Condensed", sans-serif';
  for (const p of est.pontos) {
    if (p.tipo !== 'camera') continue;
    const [x, y] = P(p._pos);
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = est.corPino(p); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = est.bordaGrupo(p.grupo); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.arc(x, y, 12.5, 0, Math.PI * 2); ctx.stroke();
    sombra(() => { ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(p.codigo, x, y + 22); ctx.textAlign = 'left'; });
  }

  // cabeçalho e legenda
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, topo); ctx.fillRect(0, H - base, W, base);
  const logo = await carregarImagem('img/aip-logo.png');
  if (logo) ctx.drawImage(logo, 24, 26, 150, 150 * (586 / 2238));
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic';
  ctx.font = '700 30px "Barlow Condensed", sans-serif';
  ctx.fillText('Vistoria de câmeras · Feira da Fundac, Caruaru', 200, 48);
  const cams = est.pontos.filter((p) => p.tipo === 'camera');
  ctx.font = '500 17px Barlow, sans-serif'; ctx.fillStyle = '#bdbdbd';
  ctx.fillText(`${new Date().toLocaleString('pt-BR')} · ${cams.length} câmeras · ${est.pontos.length - cams.length} outros pontos${est.erroMedio != null ? ` · conferência com erro médio de ${est.erroMedio.toFixed(1).replace('.', ',')} m` : ''}`, 200, 76);
  const leg = [['#22c55e', 'Funcionando'], ['#ff4d4d', 'Parada / sem sinal'], ['#9ca3af', 'Não sei'], [D.COR_NOVA, 'Nova sugerida']];
  let lx = 24; const ly = H - base / 2;
  ctx.font = '600 16px Barlow, sans-serif'; ctx.textBaseline = 'middle';
  for (const [c, t] of leg) { ctx.beginPath(); ctx.arc(lx + 9, ly, 8, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillText(t, lx + 24, ly); lx += 34 + ctx.measureText(t).width; }
  ctx.fillStyle = '#9a9a9a'; ctx.font = '500 13px Barlow, sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(est.provedor === 'mapbox' ? 'Satélite: © Mapbox © Maxar' : 'Satélite: Esri, Maxar, Earthstar Geographics', W - 20, ly);
  ctx.textAlign = 'left';

  const blob = await new Promise((ok) => cv.toBlob(ok, 'image/png'));
  return new File([blob], `fundac-vistoria-mapa-${carimbo()}.png`, { type: 'image/png' });
}

// ------------------------------------------------------------------ compartilhar ou baixar
export async function compartilharOuBaixar(arq, compartilhar) {
  if (compartilhar && navigator.canShare && navigator.canShare({ files: [arq] })) {
    try { await navigator.share({ files: [arq], title: 'Vistoria de câmeras · Fundac' }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  const u = URL.createObjectURL(arq);
  const a = document.createElement('a');
  a.href = u; a.download = arq.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 4000);
}
