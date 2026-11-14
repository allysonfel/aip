'use client';

import { useEffect, useRef, useState } from 'react';
import { BASE } from '@/lib/base';

/** Quadro anotado pelo motor (caixas, linha e contagens), trocado a cada segundo. */
export function QuadroAnotado({ canal, nome }: { canal: string; nome: string }) {
  const [t, setT] = useState(() => Date.now());
  const [erro, setErro] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative aspect-[704/480] overflow-hidden rounded-sm bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element -- imagem que muda a cada segundo, sem otimização */}
      <img src={`${BASE}/api/quadro/${canal}?t=${t}`} alt={`Câmera ${nome} ao vivo, com as detecções`} className="h-full w-full object-contain" onError={() => setErro(true)} onLoad={() => setErro(false)} />
      {erro && <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Aguardando a primeira imagem do motor...</p>}
    </div>
  );
}

/** Vídeo cru do servidor de vídeo (só com a privacidade desligada). */
export function VideoAoVivo({ caminho }: { caminho: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const url = `${BASE}/api/hls/${caminho}/index.m3u8`;
    let hls: { destroy: () => void } | null = null;
    if (v.canPlayType('application/vnd.apple.mpegurl')) v.src = url;
    else
      import('hls.js').then(({ default: Hls }) => {
        if (!Hls.isSupported()) return;
        const h = new Hls({ lowLatencyMode: false });
        h.loadSource(url);
        h.attachMedia(v);
        hls = h;
      });
    return () => hls?.destroy();
  }, [caminho]);
  return <video ref={ref} muted autoPlay playsInline controls className="aspect-[704/480] w-full rounded-sm bg-black" />;
}
