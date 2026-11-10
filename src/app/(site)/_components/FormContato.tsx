"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { enviarContato, type EstadoContato } from "../contato/acoes";
import { CANAIS, SOLUCOES, TIPOS, UFS } from "../contato/opcoes";
import { bandeira, PAIS_PADRAO, PAISES } from "../_config/paises";
import Escolha, { type OpcaoEscolha } from "./Escolha";

const OPCOES_PAIS: OpcaoEscolha[] = PAISES.map((p) => ({ valor: p.iso, rotulo: p.nome, icone: bandeira(p.iso) }));
const OPCOES_DDI: OpcaoEscolha[] = PAISES.map((p) => ({ valor: p.iso, rotulo: p.nome, detalhe: `+${p.ddi}`, icone: bandeira(p.iso) }));
const OPCOES_UF: OpcaoEscolha[] = UFS.map(([sigla, nome]) => ({ valor: sigla, rotulo: nome }));

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
function Opcoes({ nome, legenda, opcoes, marcados, multiplo = false, erro }: { nome: string; legenda: string; opcoes: readonly string[]; marcados: string[]; multiplo?: boolean; erro?: string }) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm text-white/85">{legenda}</legend>
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
      <div className="mb-3 flex flex-wrap gap-0.5 min-[380px]:gap-1 sm:gap-2">
        {CANAIS.map((c) => (
          <label key={c} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-transparent px-2 py-1.5 text-sm min-[380px]:px-2.5 sm:gap-2 sm:px-3 text-white/70 transition-colors hover:text-white has-checked:border-white/40 has-checked:bg-white/10 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-white">
            <input type="radio" name="canal" value={c} checked={canal === c} onChange={() => setCanal(c)} className="sr-only" />
            <IconeCanal canal={c} />
            {c}
          </label>
        ))}
      </div>
      <div className={`flex rounded-xl border bg-white/[0.04] transition-colors focus-within:border-white ${erro ? "border-white" : "border-white/20"}`}>
        <div className="shrink-0 border-r border-white/15">
          <Escolha
            nome="ddi_pais"
            opcoes={OPCOES_DDI}
            valor={ddi}
            aoMudar={setDdi}
            busca
            rotuloAcessivel={`Código do país: ${pais.nome} +${pais.ddi}`}
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
  const [cidade, setCidade] = useState(valores.cidade || "");
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
        <Escolha id="pais" nome="pais" opcoes={OPCOES_PAIS} valor={pais} aoMudar={setPais} busca invalido={!!erros.pais} />
      </Rotulo>
      {brasil ? (
        <>
          <Rotulo nome="uf" rotulo="Estado" erro={erros.uf}>
            <Escolha
              id="uf"
              nome="uf"
              opcoes={OPCOES_UF}
              valor={uf}
              aoMudar={(novo) => {
                setUf(novo);
                if (novo !== uf) setCidade("");
              }}
              busca
              invalido={!!erros.uf}
            />
          </Rotulo>
          <Rotulo nome="cidade" rotulo="Cidade" erro={erros.cidade}>
            {/* Se a lista não carregar, a pessoa digita a cidade. */}
            {municipios && uf && cidades.length === 0 ? (
              <input id="cidade" name="cidade" defaultValue={valores.cidade} className={CAMPO} />
            ) : (
              <Escolha
                id="cidade"
                nome="cidade"
                opcoes={cidades.map((c) => ({ valor: c, rotulo: c }))}
                valor={cidade}
                aoMudar={setCidade}
                busca
                desativado={!uf || !municipios}
                marcador={uf ? (municipios ? "Selecione" : "Carregando...") : "Escolha o estado primeiro"}
                invalido={!!erros.cidade}
              />
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
          {enviando ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </form>
  );
}
