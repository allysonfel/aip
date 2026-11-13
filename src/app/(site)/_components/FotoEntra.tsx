"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * Foto do topo que só começa a animar a entrada depois de carregada.
 * Assim a animação não termina antes de a imagem aparecer (o que fazia a foto
 * "brotar" parada na tela). Usa a mesma entrada do topo das páginas (.entra-foto no site-theme.css).
 */
export default function FotoEntra(props: ImageProps) {
  const [pronta, setPronta] = useState(false);
  return (
    <Image
      {...props}
      alt={props.alt}
      onLoad={() => setPronta(true)}
      className={`${props.className ?? ""} ${pronta ? "entra-foto" : "opacity-0"}`}
    />
  );
}
