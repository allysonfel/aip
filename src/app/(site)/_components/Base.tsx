import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";

const M = "/site/media";

export function Botao({ href, children, contorno = false }: { href: string; children: ReactNode; contorno?: boolean }) {
  return (
    <Link href={href} className={`inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-[0.95rem] font-medium transition-colors ${contorno ? "border border-white/40 text-white hover:border-white hover:bg-white/10" : "bg-white text-black hover:bg-white/85"}`}>
      {children}
    </Link>
  );
}

export function Legenda({ children = "Imagem ilustrativa" }: { children?: ReactNode }) {
  return <p className="mt-3 text-xs text-white/55">{children}</p>;
}

export function Foto({ src, alt, className = "", sizes = "(min-width: 1024px) 50vw, 100vw" }: { src: string; alt: string; className?: string; sizes?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-painel ${className}`}>
      <Image src={`${M}/${src}`} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}

type Midia = { foto: string; alt: string } | { video: string; poster: string };

/** Hero em tela cheia: mídia escurecida, título à esquerda na metade inferior. */
export function Hero({ sobretitulo, titulo, texto, botoes, midia, sobreposicao, legenda = false, escurecer = "bg-black/35" }: { sobretitulo?: string; titulo: string; texto: string; botoes?: ReactNode; midia?: Midia; sobreposicao?: ReactNode; legenda?: boolean | string; escurecer?: string }) {
  return (
    <section className="relative isolate flex min-h-svh items-end overflow-hidden">
      <div className="parallax absolute inset-0 -z-20">
        {midia && "foto" in midia && <Image src={`${M}/${midia.foto}`} alt={midia.alt} fill priority sizes="100vw" className="object-cover" />}
        {midia && "video" in midia && (
          <video autoPlay muted loop playsInline preload="metadata" poster={`${M}/${midia.poster}`} aria-hidden className="h-full w-full object-cover">
            <source src={`${M}/${midia.video}`} type="video/mp4" />
          </video>
        )}
      </div>
      <div aria-hidden className={`absolute inset-0 -z-10 ${escurecer}`} />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/55 to-transparent lg:bg-gradient-to-r lg:from-black/90 lg:via-black/35" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-black to-transparent" />
      {sobreposicao}
      <div className="margem pb-16 pt-32 sm:pb-24">
        <div className="max-w-[46rem]">
          {sobretitulo && <p className="rotulo mb-5 text-white/80">{sobretitulo}</p>}
          <h1 className="titulo-hero">{titulo}</h1>
          <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-white/80">{texto}</p>
          {botoes && <div className="mt-8 flex flex-wrap gap-3">{botoes}</div>}
          {legenda && <Legenda>{typeof legenda === "string" ? legenda : undefined}</Legenda>}
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
export function TelaFoto({ foto, alt, titulo, texto, acao, rotulo, legenda }: { foto: string; alt: string; titulo: string; texto: string; acao?: ReactNode; rotulo?: string; legenda?: boolean }) {
  return (
    <section className="relative isolate flex min-h-svh items-end overflow-hidden">
      <Image src={`${M}/${foto}`} alt={alt} fill sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/55 to-black/20" />
      <Reveal className="margem pb-16 sm:pb-24">
        <div className="max-w-[40rem]">
          {rotulo && <p className="rotulo mb-4 text-white/80">{rotulo}</p>}
          <h2 className="titulo-tela">{titulo}</h2>
          <p className="mt-5 text-lg leading-relaxed text-white/80">{texto}</p>
          {acao && <div className="mt-8">{acao}</div>}
          {legenda && <Legenda />}
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
              <summary className="flex items-center justify-between gap-6 py-5 text-lg font-medium">
                {i.p}
                <span aria-hidden className="text-2xl font-light leading-none text-cinza transition-transform group-open:rotate-45">+</span>
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
