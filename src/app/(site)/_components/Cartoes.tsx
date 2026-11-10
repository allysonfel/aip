import Image from "next/image";
import Link from "next/link";
import { hrefSegmento, type Segmento } from "../_content/solucoes";
import { SetaBotao } from "./Base";

const M = "/site/media";

/** Foto em cima, título e texto embaixo (aplicações do Totem). */
export function CartaoFoto({ foto, alt, titulo, texto }: { foto: string; alt: string; titulo: string; texto: string }) {
  return (
    <>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-painel">
        <Image src={`${M}/${foto}`} alt={alt} fill draggable={false} sizes="(min-width: 640px) 420px, 82vw" quality={85} className="object-cover" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{titulo}</h3>
      <p className="mt-1 leading-snug text-cinza">{texto}</p>
    </>
  );
}

/** Cartão claro de "Como a tecnologia é usada". */
export function CartaoClaro({ titulo, texto, sobProjeto }: { titulo: string; texto: string; sobProjeto?: boolean }) {
  return (
    <div className="flex h-full min-h-[15rem] flex-col rounded-2xl bg-[#f1f1f1] p-7 text-black sm:min-h-[17rem] sm:p-8">
      {sobProjeto && <span className="mb-5 w-fit rounded-full border border-black/25 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-black/65">Sob projeto</span>}
      <h3 className="font-titulo text-[1.75rem] font-bold leading-[1.05]">{titulo}</h3>
      <p className="mt-auto pt-6 leading-snug text-black/70">{texto}</p>
    </div>
  );
}

/** Foto vertical com o nome do segmento por cima e o botão para a página. */
export function CartaoSegmento({ segmento, linha, cta = "Ver", fotoDoHero = false }: { segmento: Segmento; linha?: string; cta?: string; fotoDoHero?: boolean }) {
  const foto = fotoDoHero ? segmento.hero : segmento.cartao;
  return (
    <div className="relative isolate flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl bg-painel p-6 sm:p-7">
      <Image src={`${M}/${foto.foto}`} alt={foto.alt} fill draggable={false} sizes="(min-width: 640px) 600px, 130vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <h3 className="font-titulo text-[2rem] font-bold leading-none">{segmento.nome}</h3>
      {linha && <p className="mt-2 leading-snug text-white/80">{linha}</p>}
      <Link href={hrefSegmento(segmento)} draggable={false} className="botao botao-claro botao-pequeno mt-5 w-fit">
        <span>
          {cta}
          <span className="sr-only">: {segmento.nome}</span>
        </span>
        <SetaBotao />
      </Link>
    </div>
  );
}
