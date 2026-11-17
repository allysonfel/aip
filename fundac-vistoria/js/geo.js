// Contas de geometria: homografia (perspectiva), semelhança (escala, giro e
// deslocamento) e projeção em metros (Web Mercator, a mesma do mapa).

/** Homografia 3x3 que leva 4 pontos src em 4 pontos dst. */
export function homografia(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  const h = resolver(A, b);
  return [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], 1]];
}

function resolver(A, b) {
  const n = b.length;
  const M = A.map((l, i) => [...l, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / d;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((l, i) => l[n] / (l[i] || 1e-12));
}

export function aplicar(H, [x, y]) {
  const w = H[2][0] * x + H[2][1] * y + H[2][2];
  return [(H[0][0] * x + H[0][1] * y + H[0][2]) / w, (H[1][0] * x + H[1][1] * y + H[1][2]) / w];
}

export function inversa(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ];
}

/** CSS matrix3d de uma homografia (para a imagem da planta no mapa). */
export function matrix3d(H) {
  return `matrix3d(${H[0][0]},${H[1][0]},0,${H[2][0]},${H[0][1]},${H[1][1]},0,${H[2][1]},0,0,1,0,${H[0][2]},${H[1][2]},0,${H[2][2]})`;
}

// ---------- projeção em metros
const R = 6378137;
export function projetar([lat, lng]) {
  const s = Math.max(-0.9999, Math.min(0.9999, Math.sin((lat * Math.PI) / 180)));
  return [(R * lng * Math.PI) / 180, (R * Math.log((1 + s) / (1 - s))) / 2];
}
export function desprojetar([x, y]) {
  return [((2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180) / Math.PI, (x / R) * (180 / Math.PI)];
}
/** Fator de escala do Mercator (metros projetados por metro real) na latitude. */
export function escalaMercator(lat) {
  return 1 / Math.cos((lat * Math.PI) / 180);
}

/** Distância em metros (haversine). */
export function distancia(a, b) {
  const r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(s));
}

/** Ponto a `metros` de `origem` no rumo `graus` (0 = norte, horário). */
export function destino(origem, graus, metros) {
  const [x, y] = projetar(origem);
  const k = escalaMercator(origem[0]);
  const a = (graus * Math.PI) / 180;
  return desprojetar([x + Math.sin(a) * metros * k, y + Math.cos(a) * metros * k]);
}

/** Rumo de a para b (graus, 0 = norte). */
export function rumo(a, b) {
  const [x0, y0] = projetar(a), [x1, y1] = projetar(b);
  return (Math.atan2(x1 - x0, y1 - y0) * 180 / Math.PI + 360) % 360;
}

/**
 * Semelhança (escala, giro, deslocamento) que leva src em dst, por mínimos
 * quadrados (pontos em metros projetados). Com 1 par, só deslocamento.
 * Devolve { a, b, tx, ty } com x' = a x - b y + tx ; y' = b x + a y + ty.
 */
export function semelhanca(src, dst) {
  const n = src.length;
  if (!n) return { a: 1, b: 0, tx: 0, ty: 0 };
  if (n === 1) return { a: 1, b: 0, tx: dst[0][0] - src[0][0], ty: dst[0][1] - src[0][1] };
  let sx = 0, sy = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { sx += src[i][0]; sy += src[i][1]; dx += dst[i][0]; dy += dst[i][1]; }
  sx /= n; sy /= n; dx /= n; dy /= n;
  let num1 = 0, num2 = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const px = src[i][0] - sx, py = src[i][1] - sy, qx = dst[i][0] - dx, qy = dst[i][1] - dy;
    num1 += px * qx + py * qy;
    num2 += px * qy - py * qx;
    den += px * px + py * py;
  }
  const a = num1 / (den || 1), b = num2 / (den || 1);
  return { a, b, tx: dx - (a * sx - b * sy), ty: dy - (b * sx + a * sy) };
}
export function aplicarSem(T, [x, y]) {
  return [T.a * x - T.b * y + T.tx, T.b * x + T.a * y + T.ty];
}
export function inversaSem(T) {
  const d = T.a * T.a + T.b * T.b;
  const a = T.a / d, b = -T.b / d;
  return { a, b, tx: -(a * T.tx - b * T.ty), ty: -(b * T.tx + a * T.ty) };
}
export function descreverSem(T) {
  return { escala: Math.hypot(T.a, T.b), giro: (Math.atan2(T.b, T.a) * 180) / Math.PI, desloc: Math.hypot(T.tx, T.ty) };
}

/** Média ponderada pela precisão (amostras de GPS). */
export function mediaGps(amostras) {
  let sw = 0, la = 0, lo = 0;
  for (const s of amostras) {
    const w = 1 / Math.max(1, s.acc) ** 2;
    sw += w; la += s.lat * w; lo += s.lng * w;
  }
  const lat = la / sw, lng = lo / sw;
  const precisoes = amostras.map((s) => s.acc).sort((a, b) => a - b);
  const melhor = precisoes[0];
  // precisão da média: melhor leitura, levemente melhorada pelo número de amostras
  const acc = Math.max(melhor / Math.sqrt(Math.min(amostras.length, 4)), 1);
  return { lat, lng, acc, n: amostras.length };
}
