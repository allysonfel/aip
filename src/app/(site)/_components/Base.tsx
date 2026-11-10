import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";

const M = "/site/media";

// Foto 3:2 cobrindo a tela inteira: em telas mais altas que 3:2 (celular,
// notebook) ela é escalada pela altura, então precisa de 150vh de largura.
const CAPA = "(max-aspect-ratio: 3/2) 150vh, 100vw";

/** Seta dentro do círculo dos botões (ver .botao no CSS). */
export function SetaBotao() {
  return (
    <span aria-hidden className="botao-seta">
      <svg viewBox="0 0 18 12" className="h-3 w-[1.125rem]" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 6h15M11.5 1.5 16 6l-4.5 4.5" />
      </svg>
    </span>
  );
}

export function Botao({ href, children, contorno = false }: { href: string; children: ReactNode; contorno?: boolean }) {
  return (
    <Link href={href} className={`botao ${contorno ? "botao-contorno" : "botao-claro"}`}>
      {children}
      <SetaBotao />
    </Link>
  );
}

export function Foto({ src, alt, className = "", sizes = "(min-width: 1024px) 60vw, 130vw" }: { src: string; alt: string; className?: string; sizes?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-painel ${className}`}>
      <Image src={`${M}/${src}`} alt={alt} fill sizes={sizes} quality={85} className="object-cover" />
    </div>
  );
}

// `videoCelular`: versão mais leve do vídeo para telas pequenas (opcional).
type Midia = { foto: string; alt: string } | { video: string; videoCelular?: string; poster: string };

/** Hero em tela cheia: mídia escurecida, título à esquerda na metade inferior. */
export function Hero({ sobretitulo, migalhas, titulo, texto, botoes, midia, sobreposicao, escurecer = "bg-black/35" }: { sobretitulo?: string; migalhas?: ReactNode; titulo: string; texto: string; botoes?: ReactNode; midia?: Midia; sobreposicao?: ReactNode; escurecer?: string }) {
  return (
    <section className="relative isolate flex min-h-svh items-end overflow-hidden">
      {/* Entrada em camadas: foto, título, texto e botões (ver .entra-* no CSS). */}
      <div className="entra-foto absolute inset-0 -z-20">
        <div className="parallax absolute inset-0">
          {midia && "foto" in midia && <Image src={`${M}/${midia.foto}`} alt={midia.alt} fill priority sizes={CAPA} quality={85} className="object-cover" />}
          {midia && "video" in midia && (
            <video autoPlay muted loop playsInline preload="metadata" poster={`${M}/${midia.poster}`} aria-hidden className="h-full w-full object-cover">
              {midia.videoCelular && <source src={`${M}/${midia.videoCelular}`} type="video/mp4" media="(max-width: 767px)" />}
              <source src={`${M}/${midia.video}`} type="video/mp4" />
            </video>
          )}
        </div>
      </div>
      <div aria-hidden className={`absolute inset-0 -z-10 ${escurecer}`} />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/55 to-transparent lg:bg-gradient-to-r lg:from-black/90 lg:via-black/35" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-black to-transparent" />
      {sobreposicao}
      <div className="margem pb-16 pt-32 sm:pb-24">
        <div className="max-w-[46rem]">
          {migalhas && <div className="entra-1 mb-6">{migalhas}</div>}
          {sobretitulo && <p className="entra-1 rotulo mb-5 text-white/80">{sobretitulo}</p>}
          <h1 className="entra-1 titulo-hero">{titulo}</h1>
          <p className="entra-2 mt-6 max-w-[36rem] text-lg leading-relaxed text-white/80">{texto}</p>
          {botoes && <div className="entra-3 mt-8 flex flex-wrap gap-3">{botoes}</div>}
        </div>
      </div>
    </section>
  );
}

/** Imagem ou visual de um lado; título, parágrafo e botão do outro. */
export function TelaDividida({ id, rotulo, titulo, texto, visual, lado = "esquerda", children, acao }: { id?: string; rotulo?: ReactNode; titulo: string; texto?: ReactNode; visual: ReactNode; lado?: "esquerda" | "direita"; children?: ReactNode; acao?: ReactNode }) {
  return (
    <section id={id} className="secao">
      <div className="margem grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <Reveal className={lado === "direita" ? "lg:order-2" : ""}>{visual}</Reveal>
        <Reveal atraso={120}>
          {rotulo && <div className="rotulo mb-4">{rotulo}</div>}
          <h2 className="titulo-secao">{titulo}</h2>
          {texto && <div className="corpo mt-6">{texto}</div>}
          {children && <div className="mt-6">{children}</div>}
          {acao && <div className="mt-8">{acao}</div>}
        </Reveal>
      </div>
    </section>
  );
}

/** Tela inteira com foto de fundo (Soluções, exemplos). */
/**
 * `original`: serve o arquivo como está, sem a recompressão do Next (fotos próprias da AIP).
 * `lateral`: para fotos com o lado esquerdo escuro e o assunto à direita. No
 * desktop o texto fica centralizado nesse lado escuro, quase sem película; no
 * celular a foto é enquadrada no assunto (`foco`) e o texto vai embaixo.
 */
export function TelaFoto({ foto, alt, titulo, texto, acao, rotulo, original = false, lateral = false, foco = "50% 50%" }: { foto: string; alt: string; titulo: string; texto: string; acao?: ReactNode; rotulo?: string; original?: boolean; lateral?: boolean; foco?: string }) {
  return (
    <section className={`relative isolate flex min-h-svh overflow-hidden ${lateral ? "items-end lg:items-center" : "items-end"}`}>
      <Image src={`${M}/${foto}`} alt={alt} fill sizes={CAPA} quality={85} unoptimized={original} style={{ objectPosition: foco }} className="-z-20 object-cover" />
      {lateral ? (
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/40 to-transparent lg:bg-gradient-to-r lg:from-black/60 lg:via-transparent lg:to-transparent" />
      ) : (
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/55 to-black/20" />
      )}
      <Reveal className={`margem ${lateral ? "pb-16 sm:pb-24 lg:py-24" : "pb-16 sm:pb-24"}`}>
        <div className="max-w-[40rem]">
          {rotulo && <p className="rotulo mb-4 text-white/80">{rotulo}</p>}
          <h2 className="titulo-tela">{titulo}</h2>
          <p className="mt-5 text-lg leading-relaxed text-white/80">{texto}</p>
          {acao && <div className="mt-8">{acao}</div>}
        </div>
      </Reveal>
    </section>
  );
}

export function Trio({ colunas }: { colunas: { titulo: string; texto: string }[] }) {
  return (
    <div className="grid gap-12 md:grid-cols-3 md:gap-10">
      {colunas.map((c, i) => (
        <Reveal key={c.titulo} atraso={i * 100}>
          <h3 className="font-titulo text-4xl font-semibold leading-none lg:text-5xl">{c.titulo}</h3>
          <p className="corpo mt-4">{c.texto}</p>
        </Reveal>
      ))}
    </div>
  );
}

/** Título + texto centralizados de abertura de seção. */
export function Cabecalho({ titulo, texto, centro = false }: { titulo: string; texto?: ReactNode; centro?: boolean }) {
  return (
    <Reveal className={`max-w-[52rem] ${centro ? "mx-auto text-center" : ""}`}>
      <h2 className="titulo-secao">{titulo}</h2>
      {texto && <div className="corpo mt-6">{texto}</div>}
    </Reveal>
  );
}

export function Lista({ itens, colunas = false }: { itens: ReactNode[]; colunas?: boolean }) {
  return (
    <ul className={`border-t border-linha ${colunas ? "sm:grid sm:grid-cols-2 sm:gap-x-12" : ""}`}>
      {itens.map((item, i) => (
        <li key={i} className="border-b border-linha py-3.5 leading-snug text-white/85">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Acordeao({ titulo = "Perguntas frequentes", itens }: { titulo?: string; itens: { p: string; r: string }[] }) {
  return (
    <section id="perguntas" className="secao">
      <div className="margem grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <Reveal>
          <h2 className="titulo-secao">{titulo}</h2>
        </Reveal>
        <Reveal atraso={100} className="border-t border-linha">
          {itens.map((i) => (
            <details key={i.p} className="group border-b border-linha">
              <summary className="flex items-center justify-between gap-6 py-6 font-titulo text-[1.5rem] font-semibold leading-tight sm:text-[1.75rem]">
                {i.p}
                <span aria-hidden className="relative h-4 w-4 shrink-0 text-cinza">
                  <span className="absolute left-0 top-1/2 h-px w-4 bg-current" />
                  <span className="absolute left-0 top-1/2 h-px w-4 rotate-90 bg-current transition-transform duration-300 group-open:rotate-0" />
                </span>
              </summary>
              <p className="corpo max-w-[44rem] pb-6">{i.r}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export function Encerramento({ titulo, texto, cta, href }: { titulo: string; texto?: string; cta: string; href: string }) {
  return (
    <section className="secao border-t border-linha">
      <Reveal className="margem flex flex-col items-center text-center">
        <h2 className="titulo-tela max-w-[56rem]">{titulo}</h2>
        {texto && <p className="corpo mt-5">{texto}</p>}
        <div className="mt-9">
          <Botao href={href}>{cta}</Botao>
        </div>
      </Reveal>
    </section>
  );
}
