"use client";

import { useEffect, useRef, useState } from "react";

type Fonte = { src: string; tipo: string; celular?: boolean };

/**
 * Vídeo de seção em quadro 16:9, inteiro (sem corte), tocando sozinho em loop,
 * sem som e sem controles. Só baixa o vídeo quando a seção chega perto da
 * tela; até lá, e enquanto carrega, mostra a imagem de capa.
 * `fontes` em ordem de preferência (WebM antes do MP4); as marcadas com
 * `celular` valem até 767px de largura.
 */
export default function VideoSecao({ fontes, poster, rotulo }: { fontes: Fonte[]; poster: string; rotulo: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [perto, setPerto] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPerto(true);
          obs.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // As fontes entram no DOM só agora: o navegador escolhe uma e começa a baixar.
  useEffect(() => {
    const el = video.current;
    if (!perto || !el) return;
    el.load();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) el.play().catch(() => {});
  }, [perto]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <video
        ref={video}
        muted
        loop
        playsInline
        autoPlay
        preload="none"
        poster={poster}
        aria-label={rotulo}
        className="absolute inset-0 h-full w-full object-contain"
      >
        {perto && fontes.map((f) => <source key={f.src} src={f.src} type={f.tipo} media={f.celular ? "(max-width: 767px)" : undefined} />)}
      </video>
    </div>
  );
}
