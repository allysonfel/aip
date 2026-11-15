'use client';

import { useEffect, useRef, useState } from 'react';
import { BASE } from '@/lib/base';

type Objeto = { id: number; c: string; b: [number, number, number, number]; r?: string };
type Quadro = { ts: number; objetos: Objeto[] };
type Linha = { a: [number, number]; b: [number, number] } | null;

// O motor marca cada análise com a hora do PRÓPRIO quadro (PTS do stream, na
// régua do relógio do mediamtx); o vídeo (HLS) traz a hora de cada trecho na
// mesma régua. As caixas são desenhadas pela hora do quadro que está na tela.
const ATRASO_MOTOR_MS = 0;
const COR: Record<string, string> = { pessoa: '#38bdf8', carro: '#f59e0b', moto: '#f97316', caminhao: '#eab308', onibus: '#eab308', bicicleta: '#a3e635', gato: '#f472b6', cachorro: '#f472b6' };
const NOME: Record<string, string> = { pessoa: 'pessoa', carro: 'carro', moto: 'moto', caminhao: 'caminhão', onibus: 'ônibus', bicicleta: 'bicicleta', gato: 'gato', cachorro: 'cachorro' };

/** Posição de cada objeto no instante t, interpolando entre as duas análises vizinhas. */
function caixasNoInstante(buf: Quadro[], t: number): Objeto[] {
  if (!buf.length) return [];
  let i = buf.findIndex((q) => q.ts > t);
  if (i === -1) {
    const ult = buf[buf.length - 1];
    return t - ult.ts < 400 ? ult.objetos : [];
  }
  if (i === 0) return buf[0].ts - t < 300 ? buf[0].objetos : [];
  const a = buf[i - 1];
  const b = buf[i];
  const vao = b.ts - a.ts;
  if (vao > 3000) return t - a.ts < 400 ? a.objetos : [];
  const k = (t - a.ts) / vao;
  const depois = new Map(b.objetos.map((o) => [o.id, o]));
  const saida: Objeto[] = [];
  for (const o of a.objetos) {
    const n = depois.get(o.id);
    if (n) saida.push({ ...o, b: o.b.map((v, j) => v + (n.b[j] - v) * k) as Objeto['b'] });
    else if (k < 0.6) saida.push(o);
  }
  for (const n of b.objetos) if (!a.objetos.some((o) => o.id === n.id) && k > 0.4) saida.push(n);
  return saida;
}

export function VideoComCaixas({ canal, caminho, nome, videoLiberado, aoEstado }: { canal: string; caminho: string; nome: string; videoLiberado: boolean; aoEstado?: (noAr: boolean) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const buf = useRef<Quadro[]>([]);
  const meta = useRef<{ linha: Linha; tipoLinha: string | null; contagem: Record<string, number>; cruzamentos: { ts: number; k: string }[] }>({ linha: null, tipoLinha: null, contagem: {}, cruzamentos: [] });
  const ultimaAnalise = useRef<number>(Date.now());
  const ajuste = useRef<number>(0); // diferença medida pelo motor: hora do motor - hora do vídeo (ms)
  const hlsRef = useRef<{ playingDate?: Date | null; destroy: () => void } | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'ao-vivo' | 'sem-video'>('carregando');
  const [foto, setFoto] = useState(() => Date.now());

  // Busca as caixas novas a cada 700 ms.
  useEffect(() => {
    let parar = false;
    const buscar = async () => {
      const ultimo = buf.current.at(-1)?.ts ?? 0;
      try {
        const r = await fetch(`${BASE}/api/deteccoes/${canal}?desde=${ultimo}`, { cache: 'no-store' });
        if (r.ok) {
          const d = await r.json();
          meta.current = { linha: d.linha, tipoLinha: d.tipoLinha, contagem: d.contagem ?? {}, cruzamentos: d.cruzamentos ?? [] };
          if (d.quadros.length) ultimaAnalise.current = Date.now();
          ajuste.current = Number(d.ajusteMs) || 0;
          aoEstado?.(d.ultimoQuadro != null && d.agora - d.ultimoQuadro < 15000);
          buf.current = [...buf.current, ...d.quadros].filter((q: Quadro) => d.agora - q.ts < 30000);
        }
      } catch {}
      if (!parar) setTimeout(buscar, 700);
    };
    buscar();
    return () => {
      parar = true;
    };
  }, [canal]);

  // Vídeo HLS (taxa nativa da câmera), com a hora de cada trecho.
  useEffect(() => {
    const v = video.current;
    if (!v || !videoLiberado) {
      setEstado('sem-video');
      return;
    }
    let cancelado = false;
    import('hls.js').then(({ default: Hls }) => {
      if (cancelado) return;
      if (!Hls.isSupported()) {
        setEstado('sem-video');
        return;
      }
      // Atraso calculado pelo tamanho dos trechos de cada câmera (o Salão usa
      // trechos de 4 s, as outras de 2 s): 2 trechos atrás do ao vivo.
      // Baixa latência (LL-HLS) quando o mediamtx oferece; senão, 2 trechos atrás do ao vivo.
      const h = new Hls({ lowLatencyMode: true, liveSyncDurationCount: 2, liveMaxLatencyDurationCount: 5, maxLiveSyncPlaybackRate: 1.2, backBufferLength: 10 });
      h.loadSource(`${BASE}/api/hls/${caminho}/index.m3u8`);
      h.attachMedia(v);
      let falhas = 0;
      h.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        falhas += 1;
        if (falhas > 6) return setEstado('sem-video');
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) h.recoverMediaError();
        else setTimeout(() => h.startLoad(), 2000);
      });
      // Se travar (aba em segundo plano, rede), volta para perto do ao vivo.
      const vigia = setInterval(() => {
        if (v.paused && v.readyState >= 2) v.play().catch(() => {});
      }, 3000);
      h.on(Hls.Events.DESTROYING, () => clearInterval(vigia));
      v.addEventListener('playing', () => setEstado('ao-vivo'), { once: true });
      hlsRef.current = h as unknown as { playingDate?: Date | null; destroy: () => void };
    });
    return () => {
      cancelado = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [caminho, videoLiberado]);

  // Sem vídeo: foto atual da câmera a cada 5 s, com as caixas mais recentes.
  useEffect(() => {
    if (estado !== 'sem-video') return;
    const id = setInterval(() => setFoto(Date.now()), 5000);
    return () => clearInterval(id);
  }, [estado]);

  // Desenho por cima do vídeo, a cada quadro de tela.
  useEffect(() => {
    let raf = 0;
    const desenhar = () => {
      raf = requestAnimationFrame(desenhar);
      const c = tela.current;
      const cx = caixa.current;
      if (!c || !cx) return;
      const dpr = window.devicePixelRatio || 1;
      const W = cx.clientWidth;
      const H = cx.clientHeight;
      if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
      }
      const g = c.getContext('2d');
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      // área real da imagem dentro do quadro (object-contain)
      const v = video.current;
      const iw = v?.videoWidth || 704;
      const ih = v?.videoHeight || 480;
      const esc = Math.min(W / iw, H / ih);
      const dw = iw * esc;
      const dh = ih * esc;
      const ox = (W - dw) / 2;
      const oy = (H - dh) / 2;

      const data = hlsRef.current?.playingDate;
      const t = estado === 'ao-vivo' && data ? data.getTime() + ATRASO_MOTOR_MS + ajuste.current : Date.now() - 200;
      const objetos = estado === 'ao-vivo' ? caixasNoInstante(buf.current, t) : (buf.current.at(-1)?.objetos ?? []);

      g.lineWidth = 2;
      g.font = '600 11px system-ui, sans-serif';
      for (const o of objetos) {
        const cor = COR[o.c] ?? '#38bdf8';
        const x = ox + o.b[0] * dw;
        const y = oy + o.b[1] * dh;
        const w = (o.b[2] - o.b[0]) * dw;
        const h = (o.b[3] - o.b[1]) * dh;
        g.strokeStyle = cor;
        g.strokeRect(x, y, w, h);
        const rot = o.c === 'pessoa' ? (o.r === 'condutor' ? `condutor ${o.id}` : `pessoa ${o.id}`) : (NOME[o.c] ?? o.c);
        const tw = g.measureText(rot).width + 8;
        g.fillStyle = cor;
        g.fillRect(x - 1, y - 16, tw, 16);
        g.fillStyle = '#0b0b0c';
        g.fillText(rot, x + 3, y - 4);
      }
      const { linha, tipoLinha, cruzamentos } = meta.current;
      // Número que o vídeo está mostrando AGORA: tira os cruzamentos que ainda
      // não aconteceram no vídeo (ele chega alguns segundos atrasado).
      const contagem = { ...meta.current.contagem };
      let piscar = false;
      for (const c of cruzamentos) {
        if (c.ts > t) contagem[c.k] = Math.max(0, (contagem[c.k] ?? 0) - 1);
        else if (t - c.ts < 700) piscar = true;
      }
      if (linha && tipoLinha) {
        g.strokeStyle = piscar ? '#ffffff' : '#4ade80';
        g.lineWidth = piscar ? 6 : 2.5;
        g.beginPath();
        g.moveTo(ox + linha.a[0] * dw, oy + linha.a[1] * dh);
        g.lineTo(ox + linha.b[0] * dw, oy + linha.b[1] * dh);
        g.stroke();
        // Setas perpendiculares à linha, uma para cada sentido, com o contador ao lado.
        const ax = ox + linha.a[0] * dw, ay = oy + linha.a[1] * dh, bx = ox + linha.b[0] * dw, by = oy + linha.b[1] * dh;
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        const vx = bx - ax, vy = by - ay, n = Math.hypot(vx, vy) || 1;
        const nx = -vy / n, ny = vx / n; // aponta para o lado "A" (o que o motor conta como sentido A / entrada)
        const seta = (dir: number, rot: string, cor: string) => {
          const L = 34;
          const x0 = mx - nx * dir * L * 0.2, y0 = my - ny * dir * L * 0.2;
          const x1 = mx + nx * dir * L, y1 = my + ny * dir * L;
          g.strokeStyle = cor; g.fillStyle = cor; g.lineWidth = 3;
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
          const ang = Math.atan2(y1 - y0, x1 - x0);
          g.beginPath(); g.moveTo(x1, y1);
          g.lineTo(x1 - 10 * Math.cos(ang - 0.5), y1 - 10 * Math.sin(ang - 0.5));
          g.lineTo(x1 - 10 * Math.cos(ang + 0.5), y1 - 10 * Math.sin(ang + 0.5));
          g.closePath(); g.fill();
          g.font = '700 13px system-ui, sans-serif';
          const tw = g.measureText(rot).width + 12;
          const tx = x1 + nx * dir * 6 - tw / 2, ty = y1 + ny * dir * 14;
          g.fillStyle = 'rgba(0,0,0,0.72)'; g.fillRect(tx, ty - 13, tw, 20);
          g.fillStyle = cor; g.fillText(rot, tx + 6, ty + 2);
        };
        // deslocadas ao longo da linha para as duas setas não se sobreporem
        const desloca = (f: number) => [vx / n * f, vy / n * f];
        const [dax, day] = desloca(-26), [dbx, dby] = desloca(26);
        g.save(); g.translate(dax, day); seta(1, tipoLinha === 'entrada' ? `entradas ${contagem.entrada ?? 0}` : `A ${contagem.a ?? 0}`, '#4ade80'); g.restore();
        g.save(); g.translate(dbx, dby); seta(-1, tipoLinha === 'entrada' ? `saídas ${contagem.saida ?? 0}` : `B ${contagem.b ?? 0}`, '#fbbf24'); g.restore();
      }
    };
    raf = requestAnimationFrame(desenhar);
    return () => cancelAnimationFrame(raf);
  }, [estado]);

  return (
    <div ref={caixa} className="relative aspect-[704/480] overflow-hidden rounded-sm bg-black">
      {estado !== 'sem-video' && <video ref={video} muted autoPlay playsInline className="absolute inset-0 h-full w-full object-contain" aria-label={`Câmera ${nome} ao vivo`} />}
      {estado === 'sem-video' && (
        // eslint-disable-next-line @next/next/no-img-element -- foto atual da câmera
        <img src={`${BASE}/api/quadro/${canal}?tipo=cru&t=${foto}`} alt={`Câmera ${nome}`} className="absolute inset-0 h-full w-full object-contain" />
      )}
      <canvas ref={tela} className="pointer-events-none absolute inset-0 h-full w-full" />
      {estado === 'carregando' && <p className="absolute inset-x-0 bottom-3 text-center text-xs text-white/70">Conectando ao vídeo...</p>}
    </div>
  );
}
