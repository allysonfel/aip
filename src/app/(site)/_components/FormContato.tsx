"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import { useIdioma } from "../_i18n/Contexto";
import { f } from "../_i18n/dicionario";
import type { Idioma } from "../_i18n/idiomas";
import Link from "../_i18n/LinkI";
import { SetaBotao } from "./Base";
import { enviarContato, type EstadoContato } from "../_contato/acoes";
import { CANAIS, TIPOS } from "../_contato/opcoes";
import { bandeira, PAIS_PADRAO, PAISES } from "../_config/paises";
import Escolha, { type OpcaoEscolha } from "./Escolha";

/** Países com o nome no idioma da página (em português, a lista pronta; nos outros, Intl.DisplayNames), em ordem alfabética. */
function paisesNoIdioma(idioma: Idioma) {
  if (idioma === "pt") return PAISES;
  const nomes = new Intl.DisplayNames([idioma], { type: "region" });
  return PAISES.map((p) => ({ ...p, nome: nomes.of(p.iso) ?? p.nome })).sort((a, b) => a.nome.localeCompare(b.nome, idioma));
}

// Ícones dos canais de contato (traço simples, na cor do texto).
const ICONES: Record<string, ReactNode> = {
  Telefone: <path d="M6.6 3.5h2.6l1.4 3.6-1.8 1.2a9.5 9.5 0 0 0 4.9 4.9l1.2-1.8 3.6 1.4v2.6a1.8 1.8 0 0 1-1.8 1.8A13.9 13.9 0 0 1 4.8 5.3a1.8 1.8 0 0 1 1.8-1.8Z" />,
  Telegram: <path d="M20.5 4.2 3.6 10.8c-.8.3-.8 1.4 0 1.7l4.2 1.4 1.6 5c.2.6 1 .8 1.5.3l2.4-2.3 4.3 3.1c.6.4 1.4.1 1.6-.6l2.6-13.9c.2-.9-.6-1.6-1.3-1.3ZM8 13.7l9.3-6.1-7.2 7.3-.3 3.1" />,
  WhatsApp: (
    <>
      <path d="M4 20l1.2-4.1A8.3 8.3 0 1 1 8.4 19L4 20Z" />
      <path d="M9.2 8.2c.2-.4.6-.4.8 0l.7 1.5c.1.3 0 .6-.2.8l-.5.5a5.6 5.6 0 0 0 2.9 2.9l.5-.5c.2-.2.5-.3.8-.2l1.5.7c.4.2.4.6 0 .8-.6.6-1.4 1-2.3.7a8 8 0 0 1-4.9-4.9c-.3-.9.1-1.7.7-2.3Z" />
    </>
  ),
};

function IconeCanal({ canal }: { canal: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {ICONES[canal]}
    </svg>
  );
}

const CAMPO = "w-full rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 text-white outline-none transition-colors placeholder:text-white/40 focus:border-white aria-invalid:border-white";

function Erro({ id, texto }: { id?: string; texto?: string }) {
  return texto ? <p id={id} className="mt-1.5 text-sm font-medium text-white">{texto}</p> : null;
}

function Rotulo({ nome, rotulo, erro, children }: { nome: string; rotulo: string; erro?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={nome} className="mb-2 block text-sm text-white/85">{rotulo}</label>
      {children}
      <Erro id={`${nome}-erro`} texto={erro} />
    </div>
  );
}

/** Grupo de botões marcáveis. `multiplo` permite escolher mais de uma opção. */
function Opcoes({ nome, legenda, opcoes, rotulos, marcados, multiplo = false, erro }: { nome: string; legenda: string; opcoes: readonly string[]; rotulos: Record<string, string>; marcados: string[]; multiplo?: boolean; erro?: string }) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm text-white/85">{legenda}</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <label key={o} className="cursor-pointer rounded-xl border border-white/20 px-4 py-2.5 text-sm transition-colors hover:border-white/60 has-checked:border-white has-checked:bg-white has-checked:text-black has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-white">
            <input type={multiplo ? "checkbox" : "radio"} name={nome} value={o} defaultChecked={marcados.includes(o)} className="sr-only" />
            {rotulos[o] ?? o}
          </label>
        ))}
      </div>
      <Erro texto={erro} />
    </fieldset>
  );
}

/**
 * "Li e aceito a Política de Privacidade". Botão com estado próprio em vez de
 * checkbox nativo: no iPhone o toque na caixa nativa não marcava. O valor vai
 * no formulário por um campo oculto (aceite=on), como o checkbox mandava.
 */
function Aceite({ inicial, invalido }: { inicial: boolean; invalido: boolean }) {
  const { d } = useIdioma();
  const [marcado, setMarcado] = useState(inicial);
  return (
    <div className="flex items-start text-sm text-white/85">
      {marcado && <input type="hidden" name="aceite" value="on" />}
      <button
        type="button"
        role="checkbox"
        aria-checked={marcado}
        aria-invalid={invalido || undefined}
        onClick={() => setMarcado((m) => !m)}
        className="-my-2 -ml-2 flex touch-manipulation items-start gap-3 rounded-lg py-2 pl-2 pr-[0.3em] text-left outline-none focus-visible:outline-2 focus-visible:outline-[#5FD3FF]"
      >
        <span aria-hidden className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${marcado ? "border-[#5FD3FF] bg-[#5FD3FF] text-black" : invalido ? "border-white" : "border-white/60"}`}>
          {marcado && (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12.5 4.2 4.2L19 7" />
            </svg>
          )}
        </span>
        <span className="pt-0.5">{d.contato.aceiteAntes}</span>
      </button>
      <span className="pt-0.5">
        <Link href="/privacidade" target="_blank" className="underline underline-offset-2">{d.contato.aceiteLink}</Link>.
      </span>
    </div>
  );
}

/** Canal (Telefone, Telegram, WhatsApp) + código do país + número. */
function Telefone({ valores, erro }: { valores: Record<string, string>; erro?: string }) {
  const { idioma, d } = useIdioma();
  const paises = useMemo(() => paisesNoIdioma(idioma), [idioma]);
  const opcoesDdi: OpcaoEscolha[] = useMemo(() => paises.map((p) => ({ valor: p.iso, rotulo: p.nome, detalhe: `+${p.ddi}`, icone: bandeira(p.iso) })), [paises]);
  const [canal, setCanal] = useState(valores.canal || "WhatsApp");
  const [ddi, setDdi] = useState(valores.ddi_pais || PAIS_PADRAO);
  const pais = paises.find((p) => p.iso === ddi) ?? paises[0];
  const rotuloCanal = (c: string) => d.contato.canais[c as keyof typeof d.contato.canais] ?? c;
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm text-white/85">{d.contato.telefone}</legend>
      <div className="mb-3 flex flex-wrap gap-0.5 min-[380px]:gap-1 sm:gap-2">
        {CANAIS.map((c) => (
          <label key={c} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-transparent px-2 py-1.5 text-sm min-[380px]:px-2.5 sm:gap-2 sm:px-3 text-white/70 transition-colors hover:text-white has-checked:border-white/40 has-checked:bg-white/10 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-white">
            <input type="radio" name="canal" value={c} checked={canal === c} onChange={() => setCanal(c)} className="sr-only" />
            <IconeCanal canal={c} />
            {rotuloCanal(c)}
          </label>
        ))}
      </div>
      <div className={`flex rounded-xl border bg-white/[0.04] transition-colors focus-within:border-white ${erro ? "border-white" : "border-white/20"}`}>
        <div className="shrink-0 border-r border-white/15">
          <Escolha
            nome="ddi_pais"
            opcoes={opcoesDdi}
            valor={ddi}
            aoMudar={setDdi}
            busca
            rotuloAcessivel={f(d.contato.codigoPais, { pais: pais.nome, ddi: pais.ddi })}
            classeGatilho="flex h-full items-center gap-1.5 rounded-l-xl py-3 pl-4 pr-3 outline-none focus-visible:bg-white/[0.06]"
            classePainel="w-[min(24rem,calc(100vw-2.5rem))]"
            gatilho={
              <>
                <span aria-hidden className="text-lg leading-none">{bandeira(pais.iso)}</span>
                <span className="text-white">+{pais.ddi}</span>
              </>
            }
          />
        </div>
        <input
          name="telefone"
          type="tel"
          autoComplete="tel-national"
          defaultValue={valores.telefone}
          aria-label={f(d.contato.numeroDo, { canal: rotuloCanal(canal) })}
          aria-invalid={erro ? true : undefined}
          placeholder={pais.iso === "BR" ? "(00) 00000-0000" : d.contato.numero}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-white/40"
        />
      </div>
      <Erro texto={erro} />
    </fieldset>
  );
}

export default function FormContato({ tipo, origem }: { tipo?: string; origem: string }) {
  const { idioma, d } = useIdioma();
  const [estado, acao, enviando] = useActionState<EstadoContato, FormData>(enviarContato, { ok: false });

  if (estado.ok) {
    return (
      <div role="status" className="rounded-2xl border border-white/20 p-8 md:p-12">
        <p className="titulo-secao">{d.contato.sucessoTitulo}</p>
        <p className="corpo mt-4">{d.contato.sucessoTexto}</p>
      </div>
    );
  }

  const v = estado.valores ?? {};
  const e = estado.erros ?? {};
  const lista = (nome: string, padrao?: string) => (v[nome] !== undefined ? v[nome].split("|").filter(Boolean) : padrao ? [padrao] : []);
  const texto = (nome: string, rotulo: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Rotulo nome={nome} rotulo={rotulo} erro={e[nome]}>
      <input id={nome} name={nome} defaultValue={v[nome]} aria-invalid={e[nome] ? true : undefined} aria-describedby={e[nome] ? `${nome}-erro` : undefined} className={CAMPO} {...extra} />
    </Rotulo>
  );

  return (
    <form action={acao} noValidate className="grid gap-6 sm:grid-cols-2">
      {/* Honeypot: invisível para pessoas, robôs preenchem. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="site_web">{d.contato.naoPreencha}</label>
        <input id="site_web" name="site_web" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="origem" value={origem} />
      <input type="hidden" name="idioma" value={idioma} />

      {texto("nome", d.contato.nome, { autoComplete: "name", required: true })}
      {texto("email", d.contato.email, { type: "email", autoComplete: "email", required: true })}

      <Telefone valores={v} erro={e.telefone} />

      <Opcoes nome="tipo_organizacao" legenda={d.contato.tipoOrganizacao} opcoes={TIPOS} rotulos={d.contato.tipos} marcados={lista("tipo_organizacao", tipo)} multiplo erro={e.tipo_organizacao} />

      <div className="sm:col-span-2">
        <Rotulo nome="mensagem" rotulo={d.contato.mensagem} erro={e.mensagem}>
          <textarea id="mensagem" name="mensagem" rows={5} defaultValue={v.mensagem} aria-invalid={e.mensagem ? true : undefined} className={CAMPO} />
        </Rotulo>
      </div>

      <div className="sm:col-span-2">
        <Aceite inicial={v.aceite === "on"} invalido={Boolean(e.aceite)} />
        <Erro texto={e.aceite} />
      </div>

      {estado.erro && <p role="alert" className="font-medium sm:col-span-2">{estado.erro}</p>}

      <div className="sm:col-span-2">
        <button type="submit" disabled={enviando} className="botao botao-claro">
          {enviando ? d.contato.enviando : d.contato.enviar}
          <SetaBotao />
        </button>
      </div>
    </form>
  );
}
