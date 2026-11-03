"use client";

import { useActionState, type ReactNode } from "react";
import Link from "next/link";
import { enviarContato, type EstadoContato } from "../contato/acoes";

const CAMPO = "w-full rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 text-white outline-none transition-colors placeholder:text-white/40 focus:border-white aria-invalid:border-white";

function Rotulo({ nome, rotulo, erro, children }: { nome: string; rotulo: string; erro?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={nome} className="mb-2 block text-sm text-white/85">{rotulo}</label>
      {children}
      {erro && <p id={`${nome}-erro`} className="mt-1.5 text-sm font-medium text-white">{erro}</p>}
    </div>
  );
}

function Opcoes({ nome, legenda, opcoes, padrao, erro }: { nome: string; legenda: string; opcoes: string[]; padrao?: string; erro?: string }) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm text-white/85">{legenda}</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <label key={o} className="cursor-pointer rounded-xl border border-white/20 px-4 py-2.5 text-sm transition-colors hover:border-white/60 has-checked:border-white has-checked:bg-white has-checked:text-black has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-white">
            <input type="radio" name={nome} value={o} defaultChecked={padrao === o} className="sr-only" />
            {o}
          </label>
        ))}
      </div>
      {erro && <p className="mt-1.5 text-sm font-medium text-white">{erro}</p>}
    </fieldset>
  );
}

export default function FormContato({ solucao, tipo, origem }: { solucao?: string; tipo?: string; origem: string }) {
  const [estado, acao, enviando] = useActionState<EstadoContato, FormData>(enviarContato, { ok: false });

  if (estado.ok) {
    return (
      <div role="status" className="rounded-2xl border border-white/20 p-8 md:p-12">
        <p className="titulo-secao">Recebemos suas informações.</p>
        <p className="corpo mt-4">Nossa equipe entrará em contato.</p>
      </div>
    );
  }

  const v = estado.valores ?? {};
  const e = estado.erros ?? {};
  const texto = (nome: string, rotulo: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Rotulo nome={nome} rotulo={rotulo} erro={e[nome]}>
      <input id={nome} name={nome} defaultValue={v[nome]} aria-invalid={e[nome] ? true : undefined} aria-describedby={e[nome] ? `${nome}-erro` : undefined} className={CAMPO} {...extra} />
    </Rotulo>
  );

  return (
    <form action={acao} noValidate className="grid gap-6 sm:grid-cols-2">
      {/* Honeypot: invisível para pessoas, robôs preenchem. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="site_web">Não preencha este campo</label>
        <input id="site_web" name="site_web" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="origem" value={origem} />

      {texto("nome", "Nome", { autoComplete: "name", required: true })}
      {texto("email", "E-mail", { type: "email", autoComplete: "email", required: true })}
      {texto("whatsapp", "WhatsApp", { type: "tel", autoComplete: "tel", required: true })}
      {texto("empresa", "Empresa ou órgão", { autoComplete: "organization", required: true })}
      {texto("cargo", "Cargo (opcional)", { autoComplete: "organization-title" })}
      {texto("cidade_estado", "Cidade e estado", { required: true })}

      <Opcoes nome="tipo_organizacao" legenda="Tipo de organização" opcoes={["Empresa", "Órgão público ou instituição"]} padrao={v.tipo_organizacao ?? tipo} erro={e.tipo_organizacao} />
      <Opcoes nome="solucao" legenda="Solução de interesse" opcoes={["Câmeras IA", "Totem IA", "Ainda não sei"]} padrao={v.solucao ?? solucao} erro={e.solucao} />
      <Opcoes nome="quantidade_cameras" legenda="Quantidade aproximada de câmeras" opcoes={["Ainda não possuo câmeras", "Até 10", "De 11 a 30", "De 31 a 100", "Mais de 100", "Não sei informar"]} padrao={v.quantidade_cameras} erro={e.quantidade_cameras} />

      <div className="sm:col-span-2">
        <Rotulo nome="mensagem" rotulo="Mensagem" erro={e.mensagem}>
          <textarea id="mensagem" name="mensagem" rows={5} defaultValue={v.mensagem} aria-invalid={e.mensagem ? true : undefined} className={CAMPO} />
        </Rotulo>
      </div>

      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-sm text-white/85">
          <input type="checkbox" name="aceite" className="mt-0.5 h-5 w-5 shrink-0 accent-white" />
          <span>
            Li e aceito a{" "}
            <Link href="/privacidade" target="_blank" className="underline underline-offset-2">Política de Privacidade</Link>.
          </span>
        </label>
        {e.aceite && <p className="mt-1.5 text-sm font-medium text-white">{e.aceite}</p>}
      </div>

      {estado.erro && <p role="alert" className="font-medium sm:col-span-2">{estado.erro}</p>}

      <div className="sm:col-span-2">
        <button type="submit" disabled={enviando} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-7 font-medium text-black transition-colors hover:bg-white/85 disabled:opacity-60">
          {enviando ? "Enviando..." : "Solicitar contato"}
        </button>
      </div>
    </form>
  );
}
