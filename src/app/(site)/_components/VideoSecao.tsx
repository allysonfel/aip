"use client";

import { useEffect, useRef, useState } from "react";

type Fonte = { src: string; tipo: string; celular?: boolean };

/**
 * Vídeo de seção em quadro 16:9, inteiro (sem corte), em loop, sem som e sem
 * controles. Começa do início só quando a seção aparece na tela e pausa ao sair. Só baixa o vídeo quando a seção chega perto da
 * tela; até lá, e enquanto carrega, mostra a imagem de capa.
 * `fontes` em ordem de preferência (WebM antes do MP4); as marcadas com
 * `celular` valem até 767px de largura.
 */
export default function VideoSecao({ fontes, poster, rotulo }: { fontes: Fonte[]; poster: string; rotulo: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [perto, setPerto] = useState(false);
  const [naTela, setNaTela] = useState(false);

  // Perto: começa a baixar antes de chegar, para não travar quando aparecer.
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

  // Na tela: só toca quando boa parte do vídeo está visível; pausa ao sair.
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting), { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // As fontes entram no DOM só agora: o navegador escolhe uma e começa a baixar.
  useEffect(() => {
    const el = video.current;
    if (!perto || !el) return;
    el.load();
  }, [perto]);

  useEffect(() => {
    const el = video.current;
    if (!perto || !el) return;
    if (naTela && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) el.play().catch(() => {});
    else el.pause();
  }, [perto, naTela]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <video
        ref={video}
        muted
        loop
        playsInline
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
