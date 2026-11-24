"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useIdioma } from "./Contexto";

/** next/link que leva o idioma atual no endereço ("/contato" → "/en/contato"). */
export default function LinkI({ href, ...resto }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const { l } = useIdioma();
  return <Link href={l(href)} {...resto} />;
}
