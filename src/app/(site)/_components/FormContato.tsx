"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { enviarContato, type EstadoContato } from "../contato/acoes";
import { CANAIS, SOLUCOES, TIPOS, UFS } from "../contato/opcoes";
import { bandeira, PAIS_PADRAO, PAISES } from "../_config/paises";

const CAMPO = "w-full rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 text-white outline-none transition-colors placeholder:text-white/40 focus:border-white aria-invalid:border-white";
const SELECAO = `${CAMPO} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='white' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10 [&>option]:bg-neutral-900`;

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
function Opcoes({ nome, legenda, opcoes, marcados, multiplo = false, erro }: { nome: string; legenda: string; opcoes: readonly string[]; marcados: string[]; multiplo?: boolean; erro?: string }) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm text-white/85">
        {legenda}
        {multiplo && <span className="text-white/50"> · pode marcar mais de uma</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <label key={o} className="cursor-pointer rounded-xl border border-white/20 px-4 py-2.5 text-sm transition-colors hover:border-white/60 has-checked:border-white has-checked:bg-white has-checked:text-black has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-white">
            <input type={multiplo ? "checkbox" : "radio"} name={nome} value={o} defaultChecked={marcados.includes(o)} className="sr-only" />
            {o}
          </label>
        ))}
      </div>
      <Erro texto={erro} />
    </fieldset>
  );
}

/** Canal (Telefone, Telegram, WhatsApp) + código do país + número. */
function Telefone({ valores, erro }: { valores: Record<string, string>; erro?: string }) {
  const [canal, setCanal] = useState(valores.canal || "WhatsApp");
  const [ddi, setDdi] = useState(valores.ddi_pais || PAIS_PADRAO);
  const pais = PAISES.find((p) => p.iso === ddi) ?? PAISES[0];
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm text-white/85">Telefone para contato</legend>
      <div className="mb-3 flex flex-wrap gap-2">
        {CANAIS.map((c) => (
          <label key={c} className="cursor-pointer rounded-lg border border-transparent px-3 py-1.5 text-sm text-white/70 transition-colors hover:text-white has-checked:border-white/40 has-checked:bg-white/10 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-white">
            <input type="radio" name="canal" value={c} checked={canal === c} onChange={() => setCanal(c)} className="sr-only" />
            {c}
          </label>
        ))}
      </div>
      <div className={`flex rounded-xl border bg-white/[0.04] transition-colors focus-within:border-white ${erro ? "border-white" : "border-white/20"}`}>
        {/* O select fica invisível por cima da bandeira + código: abre a lista completa de países. */}
        <div className="relative flex shrink-0 items-center gap-1.5 border-r border-white/15 pl-4 pr-3">
          <span aria-hidden className="text-lg leading-none">{bandeira(pais.iso)}</span>
          <span aria-hidden className="text-white">+{pais.ddi}</span>
          <svg viewBox="0 0 12 12" aria-hidden className="h-3 w-3 text-white/60">
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <select name="ddi_pais" value={ddi} onChange={(e) => setDdi(e.target.value)} aria-label="Código do país" className="absolute inset-0 cursor-pointer opacity-0 [&>option]:bg-neutral-900">
            {PAISES.map((p) => (
              <option key={p.iso} value={p.iso}>{`${bandeira(p.iso)} ${p.nome} +${p.ddi}`}</option>
            ))}
          </select>
        </div>
        <input
          name="telefone"
          type="tel"
          autoComplete="tel-national"
          defaultValue={valores.telefone}
          aria-label={`Número do ${canal}`}
          aria-invalid={erro ? true : undefined}
          placeholder={pais.iso === "BR" ? "(00) 00000-0000" : "Número"}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-white/40"
        />
      </div>
      <Erro texto={erro} />
    </fieldset>
  );
}

/** País (padrão Brasil). No Brasil, estado e cidade em listas; fora, cidade digitada. */
function Local({ valores, erros }: { valores: Record<string, string>; erros: Record<string, string> }) {
  const [pais, setPais] = useState(valores.pais || PAIS_PADRAO);
  const [uf, setUf] = useState(valores.uf || "");
  const [municipios, setMunicipios] = useState<Record<string, string[]> | null>(null);
  const brasil = pais === "BR";

  useEffect(() => {
    if (!brasil || municipios) return;
    fetch("/site/dados/municipios.json")
      .then((r) => r.json())
      .then(setMunicipios)
      .catch(() => setMunicipios({}));
  }, [brasil, municipios]);

  const cidades = uf && municipios ? municipios[uf] ?? [] : [];
  return (
    <>
      <Rotulo nome="pais" rotulo="País" erro={erros.pais}>
        <select id="pais" name="pais" value={pais} onChange={(e) => setPais(e.target.value)} className={SELECAO}>
          {PAISES.map((p) => (
            <option key={p.iso} value={p.iso}>{p.nome}</option>
          ))}
        </select>
      </Rotulo>
      {brasil ? (
        <>
          <Rotulo nome="uf" rotulo="Estado" erro={erros.uf}>
            <select id="uf" name="uf" value={uf} onChange={(e) => setUf(e.target.value)} aria-invalid={erros.uf ? true : undefined} className={SELECAO}>
              <option value="">Selecione</option>
              {UFS.map(([sigla, nome]) => (
                <option key={sigla} value={sigla}>{nome}</option>
              ))}
            </select>
          </Rotulo>
          <Rotulo nome="cidade" rotulo="Cidade" erro={erros.cidade}>
            {/* Se a lista não carregar, a pessoa digita a cidade. */}
            {municipios && uf && cidades.length === 0 ? (
              <input id="cidade" name="cidade" defaultValue={valores.cidade} className={CAMPO} />
            ) : (
              <select key={uf} id="cidade" name="cidade" defaultValue={valores.cidade ?? ""} disabled={!uf} aria-invalid={erros.cidade ? true : undefined} className={`${SELECAO} disabled:opacity-50`}>
                <option value="">{uf ? (municipios ? "Selecione" : "Carregando...") : "Escolha o estado primeiro"}</option>
                {cidades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </Rotulo>
        </>
      ) : (
        <Rotulo nome="cidade" rotulo="Cidade" erro={erros.cidade}>
          <input id="cidade" name="cidade" defaultValue={valores.cidade} aria-invalid={erros.cidade ? true : undefined} className={CAMPO} />
        </Rotulo>
      )}
    </>
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
        <label htmlFor="site_web">Não preencha este campo</label>
        <input id="site_web" name="site_web" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="origem" value={origem} />

      {texto("nome", "Nome", { autoComplete: "name", required: true })}
      {texto("email", "E-mail", { type: "email", autoComplete: "email", required: true })}

      <Telefone valores={v} erro={e.telefone} />
      <Local valores={v} erros={e} />

      <Opcoes nome="tipo_organizacao" legenda="Tipo de organização" opcoes={TIPOS} marcados={lista("tipo_organizacao", tipo)} multiplo erro={e.tipo_organizacao} />
      <Opcoes nome="solucao" legenda="Solução de interesse" opcoes={SOLUCOES} marcados={lista("solucao", solucao)} multiplo erro={e.solucao} />

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
        <Erro texto={e.aceite} />
      </div>

      {estado.erro && <p role="alert" className="font-medium sm:col-span-2">{estado.erro}</p>}

      <div className="sm:col-span-2">
        <button type="submit" disabled={enviando} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-7 font-medium text-black transition-colors hover:bg-white/85 disabled:opacity-60">
          {enviando ? "Enviando..." : "Solicitar consulta"}
        </button>
      </div>
    </form>
  );
}
