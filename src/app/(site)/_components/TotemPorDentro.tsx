"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Parte destacada, em % da imagem (centro x/y, largura/altura). */
type Alvo = { x: number; y: number; w: number; h: number; caixa?: boolean };
export type EtapaTotem = { titulo: string; texto: string; foto: string; alt: string; alvos: Alvo[]; zoom?: number };

const M = "/site/media";
const C = "#5FD3FF";

function reduzido() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Centro do conjunto de alvos: é dali que sai o zoom. */
function centro(alvos: Alvo[]) {
  const xs = alvos.map((a) => a.x);
  const ys = alvos.map((a) => a.y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

/**
 * Totem com troca suave de imagem (crossfade), leve zoom na parte em foco e
 * contorno com brilho ciano em volta dela. As imagens têm fundo preto e se
 * fundem ao fundo da página; o pé de cada uma some num degradê.
 */
function Palco({ etapas, ativa, className = "", style, refPalco }: { etapas: EtapaTotem[]; ativa: number; className?: string; style?: React.CSSProperties; refPalco?: React.Ref<HTMLDivElement> }) {
  const fotos = [...new Set(etapas.map((e) => e.foto))];
  const e = etapas[ativa];
  const z = e.zoom ?? 1.06;
  const o = centro(e.alvos);
  return (
    <div ref={refPalco} className={`relative aspect-[4/5] ${className}`} style={style}>
      <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" style={{ transform: `scale(${z})`, transformOrigin: `${o.x}% ${o.y}%` }}>
        <div className="absolute inset-0 funde-preto">
          {fotos.map((f) => {
            return (
              <Image
                key={f}
                src={`${M}/${f}`}
                alt={f === e.foto ? e.alt : ""}
                aria-hidden={f !== e.foto}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                quality={85}
                className="object-contain transition-opacity duration-700 ease-out motion-reduce:transition-none"
                style={{ opacity: f === e.foto ? 1 : 0 }}
                loading="eager"
              />
            );
          })}
        </div>
        {etapas.map((et, i) =>
          et.alvos.map((a, j) => (
            <span
              key={`${i}-${j}`}
              aria-hidden
              className={`pointer-events-none absolute border border-[#5FD3FF] transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${a.caixa ? "rounded-[2.5rem]" : "rounded-[50%]"}`}
              style={{
                left: `${a.x - a.w / 2}%`,
                top: `${a.y - a.h / 2}%`,
                width: `${a.w}%`,
                height: `${a.h}%`,
                opacity: i === ativa ? 1 : 0,
                transform: i === ativa ? "scale(1)" : "scale(0.92)",
                transitionDelay: i === ativa ? "350ms" : "0ms",
                borderWidth: `${1 / z}px`,
                boxShadow: "0 0 18px rgb(95 211 255 / 0.45), inset 0 0 18px rgb(95 211 255 / 0.25)",
              }}
            />
          )),
        )}
      </div>
    </div>
  );
}

function IconeMais({ aberto }: { aberto: boolean }) {
  return (
    <span aria-hidden className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${aberto ? "border-[#5FD3FF] text-[#5FD3FF]" : "border-white/40 text-white"}`}>
      <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition-transform duration-300 ${aberto ? "rotate-45" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8 3v10M3 8h10" />
      </svg>
    </span>
  );
}

function Seta({ cima }: { cima: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={cima ? "M3.5 10l4.5-4.5 4.5 4.5" : "M3.5 6l4.5 4.5 4.5-4.5"} />
    </svg>
  );
}

const BOTAO_SETA = "flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-white/60 disabled:pointer-events-none disabled:opacity-30";

/** Desktop: totem fixo à direita, lista "+" à esquerda e etapas pela rolagem. */
function Desktop({ titulo, etapas }: { titulo: string; etapas: EtapaTotem[] }) {
  const n = etapas.length;
  const secao = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const itens = useRef<(HTMLLIElement | null)[]>([]);
  const [ativa, setAtiva] = useState(0);
  const [linha, setLinha] = useState<{ d: string; fim: { x: number; y: number } } | null>(null);

  useEffect(() => {
    let quadro = 0;
    const calcular = () => {
      const el = secao.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      setAtiva(Math.min(n - 1, Math.floor(p * n)));
    };
    const rolar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(calcular);
    };
    calcular();
    window.addEventListener("scroll", rolar, { passive: true });
    window.addEventListener("resize", rolar);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", rolar);
      window.removeEventListener("resize", rolar);
    };
  }, [n]);

  // Linha fina da parte destacada até o texto do item aberto. Mede depois
  // que o item termina de abrir.
  const medir = useCallback(() => {
    const a = area.current?.getBoundingClientRect();
    const p = palco.current?.getBoundingClientRect();
    const li = itens.current[ativa]?.getBoundingClientRect();
    if (!a || !p || !li) return;
    const e = etapas[ativa];
    const z = e.zoom ?? 1.06;
    const o = centro(e.alvos);
    // Alvo mais à esquerda, já com o zoom aplicado.
    const alvo = [...e.alvos].sort((u, v) => u.x - u.w / 2 - (v.x - v.w / 2))[0];
    const px = o.x + z * (alvo.x - alvo.w / 2 - o.x);
    const py = o.y + z * (alvo.y - o.y);
    const x1 = p.left - a.left + (px / 100) * p.width;
    const y1 = p.top - a.top + (py / 100) * p.height;
    const x2 = li.right - a.left + 16;
    const y2 = li.top - a.top + li.height / 2;
    const meio = x2 + (x1 - x2) * 0.45;
    setLinha({ d: `M${x1} ${y1}H${meio}V${y2}H${x2}`, fim: { x: x2, y: y2 } });
  }, [ativa, etapas]);

  useLayoutEffect(() => {
    setLinha(null);
    const t = setTimeout(medir, 520);
    window.addEventListener("resize", medir);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", medir);
    };
  }, [medir]);

  const irPara = (i: number) => {
    const el = secao.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const topo = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: topo + ((Math.max(0, Math.min(n - 1, i)) + 0.5) / n) * total, behavior: "smooth" });
  };

  return (
    <div ref={secao} className="relative" style={{ height: `${n * 80 + 20}svh` }}>
      <div ref={area} className="sticky top-0 h-svh overflow-hidden">
        <div className="margem grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-16">
          <div className="relative z-10">
            <h2 className="titulo-secao max-w-[30rem]">{titulo}</h2>
            <div className="mt-10 flex gap-5">
              <div className="flex flex-col gap-2 pt-1">
                <button type="button" className={BOTAO_SETA} onClick={() => irPara(ativa - 1)} disabled={ativa === 0} aria-label="Item anterior">
                  <Seta cima />
                </button>
                <button type="button" className={BOTAO_SETA} onClick={() => irPara(ativa + 1)} disabled={ativa === n - 1} aria-label="Próximo item">
                  <Seta cima={false} />
                </button>
              </div>
              <ol className="flex max-w-[26rem] flex-1 flex-col items-start gap-2.5">
                {etapas.map((e, i) => {
                  const aberto = i === ativa;
                  return (
                    <li key={e.titulo} ref={(el) => { itens.current[i] = el; }} className={`overflow-hidden border transition-[background-color,border-color,border-radius] duration-500 ${aberto ? "w-full rounded-[1.5rem] border-white/15 bg-[#111214]" : "rounded-[1.75rem] border-white/10 bg-white/[0.03] hover:border-white/25"}`}>
                      <button type="button" onClick={() => irPara(i)} aria-expanded={aberto} className="flex w-full items-center gap-3 py-3 pl-3 pr-5 text-left">
                        <IconeMais aberto={aberto} />
                        <span className={`font-titulo text-lg font-semibold leading-tight tracking-wide ${aberto ? "text-white" : "text-white/80"}`}>{e.titulo}</span>
                      </button>
                      <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                        <p className="min-h-0 overflow-hidden px-5 pl-[3.25rem] text-[0.975rem] leading-relaxed text-white/70">
                          <span className="block pb-5">{e.texto}</span>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
          <div ref={palco} className="justify-self-center">
            <Palco etapas={etapas} ativa={ativa} className="h-[84svh] max-h-[52rem]" />
          </div>
        </div>
        {linha && (
          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" fill="none">
            <path key={ativa} d={linha.d} stroke={C} strokeOpacity="0.7" strokeWidth="1" pathLength={1} className="linha-totem" />
            <circle cx={linha.fim.x} cy={linha.fim.y} r="2.5" fill={C} className="ponto-totem" />
          </svg>
        )}
      </div>
    </div>
  );
}

/**
 * Celular: a mesma lógica do desktop. A seção prende na tela (sticky, 100svh)
 * e as etapas avançam com a rolagem: totem em cima (~57% da tela), tracinhos
 * de progresso e o texto da etapa ativa embaixo. Só transform e opacity animam.
 */
function Celular({ titulo, etapas }: { titulo: string; etapas: EtapaTotem[] }) {
  const n = etapas.length;
  const secao = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const textos = useRef<HTMLDivElement>(null);
  const [ativa, setAtiva] = useState(0);
  const [linha, setLinha] = useState<{ x: number; y1: number; y2: number } | null>(null);

  useEffect(() => {
    let quadro = 0;
    let ultima = -1;
    const calcular = () => {
      const el = secao.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      const i = Math.min(n - 1, Math.floor(p * n));
      if (i !== ultima) {
        ultima = i;
        setAtiva(i);
      }
    };
    const rolar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(calcular);
    };
    calcular();
    window.addEventListener("scroll", rolar, { passive: true });
    window.addEventListener("resize", rolar);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", rolar);
      window.removeEventListener("resize", rolar);
    };
  }, [n]);

  // Linha vertical do destaque até o texto: medida só quando a etapa muda.
  const medir = useCallback(() => {
    const a = area.current?.getBoundingClientRect();
    const p = palco.current?.getBoundingClientRect();
    const t = textos.current?.getBoundingClientRect();
    if (!a || !p || !t) return;
    const e = etapas[ativa];
    const z = e.zoom ?? 1.06;
    const o = centro(e.alvos);
    const alvo = [...e.alvos].sort((u, v) => v.y + v.h / 2 - (u.y + u.h / 2))[0];
    const px = o.x + z * (alvo.x - o.x);
    const py = Math.min(100, o.y + z * (alvo.y + alvo.h / 2 - o.y));
    setLinha({ x: p.left - a.left + (px / 100) * p.width, y1: p.top - a.top + (py / 100) * p.height, y2: t.top - a.top - 6 });
  }, [ativa, etapas]);

  useEffect(() => {
    setLinha(null);
    const t = setTimeout(medir, 450);
    window.addEventListener("resize", medir);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", medir);
    };
  }, [medir]);

  const irPara = (i: number) => {
    const el = secao.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const topo = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: topo + ((i + 0.5) / n) * total, behavior: "smooth" });
  };

  return (
    <>
      <div className="margem pb-6 pt-24">
        <h2 className="titulo-secao">{titulo}</h2>
      </div>
      <div ref={secao} className="relative" style={{ height: `${n * 90 + 100}svh` }}>
        <div ref={area} className="sticky top-0 flex h-svh flex-col overflow-hidden">
          {/* Totem: parte de cima da tela */}
          <div className="flex h-[57svh] shrink-0 items-end justify-center pt-12">
            <Palco refPalco={palco} etapas={etapas} ativa={ativa} style={{ height: "min(calc(57svh - 3rem), calc((100vw - 2rem) * 1.25))" }} />
          </div>
          {/* Progresso */}
          <div className="margem relative z-10 flex gap-1.5 py-4">
            {etapas.map((x, i) => (
              <button key={x.titulo} type="button" onClick={() => irPara(i)} aria-label={`Ir para ${x.titulo}`} className="flex h-6 w-6 items-center">
                <span className={`block h-[3px] w-full origin-left rounded-full transition-[background-color,transform] duration-300 ${i === ativa ? "bg-[#5FD3FF]" : "scale-x-50 bg-white/25"}`} />
              </button>
            ))}
          </div>
          {/* Texto da etapa ativa */}
          <div ref={textos} className="margem relative flex-1" aria-live="polite">
            {etapas.map((e, i) => (
              <div
                key={e.titulo}
                aria-hidden={i !== ativa}
                className="absolute inset-x-0 top-0 px-[inherit] transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none"
                style={{ opacity: i === ativa ? 1 : 0, transform: `translateY(${i === ativa ? 0 : i < ativa ? -28 : 28}px)` }}
              >
                <p className="font-titulo text-sm font-medium tracking-[0.18em] text-white/45">
                  {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                </p>
                <h3 className="mt-1.5 font-titulo text-[1.75rem] font-bold leading-[1.05]">{e.titulo}</h3>
                <p className="corpo mt-2">{e.texto}</p>
              </div>
            ))}
          </div>
          {linha && linha.y2 > linha.y1 && (
            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" fill="none">
              <path key={ativa} d={`M${linha.x} ${linha.y1}V${linha.y2}`} stroke={C} strokeOpacity="0.7" strokeWidth="1" pathLength={1} className="linha-totem" />
              <circle cx={linha.x} cy={linha.y2} r="2.5" fill={C} className="ponto-totem" />
            </svg>
          )}
        </div>
      </div>
    </>
  );
}

/** "Reduzir movimento": imagem fixa e os textos em lista. */
function Estatico({ titulo, etapas, foto }: { titulo: string; etapas: EtapaTotem[]; foto: { src: string; alt: string } }) {
  return (
    <div className="margem grid items-center gap-12 lg:grid-cols-2">
      <div>
        <h2 className="titulo-secao">{titulo}</h2>
        <ol className="mt-10 space-y-7">
          {etapas.map((e, i) => (
            <li key={e.titulo} className="border-t border-white/10 pt-5">
              <p className="font-titulo text-sm font-medium tracking-[0.18em] text-white/45">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-1 font-titulo text-2xl font-bold">{e.titulo}</h3>
              <p className="corpo mt-1">{e.texto}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="relative mx-auto aspect-[4/5] h-[70svh] max-h-[48rem] funde-preto">
        <Image src={`${M}/${foto.src}`} alt={foto.alt} fill sizes="(min-width: 1024px) 40vw, 90vw" quality={85} className="object-contain" />
      </div>
    </div>
  );
}

export default function TotemPorDentro({ id, titulo, etapas, fotoFixa }: { id?: string; titulo: string; etapas: EtapaTotem[]; fotoFixa: { src: string; alt: string } }) {
  const [calmo, setCalmo] = useState(false);
  useEffect(() => setCalmo(reduzido()), []);
  if (calmo) {
    return (
      <section id={id} className="secao scroll-mt-16">
        <Estatico titulo={titulo} etapas={etapas} foto={fotoFixa} />
      </section>
    );
  }
  return (
    <section id={id} className="scroll-mt-0">
      <div className="hidden lg:block">
        <Desktop titulo={titulo} etapas={etapas} />
      </div>
      <div className="lg:hidden">
        <Celular titulo={titulo} etapas={etapas} />
      </div>
    </section>
  );
}

