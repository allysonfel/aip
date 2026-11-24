"use server";

import { headers } from "next/headers";
import { sql } from "@/lib/db";
import { PAISES } from "../_config/paises";
import { dicionario } from "../_i18n/dicionario";
import { ehIdioma, PADRAO, SIGLA } from "../_i18n/idiomas";
import { CANAIS, TIPOS } from "./opcoes";

export type EstadoContato = {
  ok: boolean;
  erro?: string;
  erros?: Record<string, string>;
  valores?: Record<string, string>;
};


// Limite simples por IP, em memória: o serviço roda em uma instância só e o
// IP não precisa ficar guardado no banco.
const JANELA_MS = 60 * 60 * 1000;
const MAX_ENVIOS = 5;
const envios = new Map<string, number[]>();

function excedeuLimite(ip: string) {
  const agora = Date.now();
  for (const [chave, tempos] of envios) {
    const ativos = tempos.filter((t) => agora - t < JANELA_MS);
    if (ativos.length) envios.set(chave, ativos);
    else envios.delete(chave);
  }
  const tempos = envios.get(ip) ?? [];
  if (tempos.length >= MAX_ENVIOS) return true;
  envios.set(ip, [...tempos, agora]);
  return false;
}

export async function enviarContato(_anterior: EstadoContato, dados: FormData): Promise<EstadoContato> {
  const campo = (nome: string, max = 200) => String(dados.get(nome) ?? "").trim().slice(0, max);
  // Escolhas múltiplas: só as opções conhecidas, na ordem do formulário.
  const marcadas = (nome: string, opcoes: readonly string[]) => {
    const escolhidas = dados.getAll(nome).map(String);
    return opcoes.filter((o) => escolhidas.includes(o));
  };
  const tipos = marcadas("tipo_organizacao", TIPOS);
  const idiomaEnviado = campo("idioma", 2);
  const idioma = ehIdioma(idiomaEnviado) ? idiomaEnviado : PADRAO;
  const m = dicionario(idioma).contato.erros;
  const valores = {
    nome: campo("nome"),
    email: campo("email"),
    canal: campo("canal", 20),
    ddi_pais: campo("ddi_pais", 2),
    telefone: campo("telefone", 30),
    tipo_organizacao: tipos.join("|"),
    mensagem: campo("mensagem", 4000),
    // Volta junto com os outros valores: o React limpa o formulário depois do
    // envio, e sem isso a caixa de aceite voltava desmarcada a cada erro.
    aceite: dados.get("aceite") === "on" ? "on" : "",
  };
  const paisTelefone = PAISES.find((p) => p.iso === valores.ddi_pais);

  // Honeypot preenchido: robô. Responde como sucesso e não grava nada.
  if (campo("site_web")) return { ok: true };

  const erros: Record<string, string> = {};
  if (valores.nome.length < 2) erros.nome = m.nome;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.email)) erros.email = m.email;
  const digitos = valores.telefone.replace(/\D/g, "");
  if (!(CANAIS as readonly string[]).includes(valores.canal) || !paisTelefone) erros.telefone = m.canal;
  else if (digitos.length < (paisTelefone.iso === "BR" ? 10 : 6)) erros.telefone = paisTelefone.iso === "BR" ? m.telefoneDdd : m.telefone;
  if (!tipos.length) erros.tipo_organizacao = m.tipo;
  if (!valores.mensagem) erros.mensagem = m.mensagem;
  if (dados.get("aceite") !== "on") erros.aceite = m.aceite;
  if (Object.keys(erros).length) return { ok: false, erros, valores };

  const cabecalhos = await headers();
  const ip = cabecalhos.get("x-forwarded-for")?.split(",")[0].trim() || "desconhecido";
  if (excedeuLimite(ip)) return { ok: false, erro: m.limite, valores };

  // Grava nas colunas que já existem: o telefone vai com o canal e o código
  // do país. Empresa, cidade, solução e quantidade de câmeras não são mais
  // perguntadas e ficam vazias (o produto de origem continua em `origem`).
  const contato = `${valores.canal}: +${paisTelefone!.ddi} ${valores.telefone}`;
  // Origem com o idioma do visitante, ex.: "produto=cameras-ia · EN".
  const origem = `${campo("origem") || "direto"} · ${SIGLA[idioma]}`;
  try {
    await sql`
      INSERT INTO contatos_site (nome, email, whatsapp, empresa, cargo, cidade_estado, tipo_organizacao, solucao, quantidade_cameras, mensagem, aceite_privacidade, origem)
      VALUES (${valores.nome}, ${valores.email}, ${contato}, '', ${null}, '', ${tipos.join(", ")}, '', '', ${valores.mensagem}, true, ${origem})
    `;
  } catch (e) {
    console.error("Falha ao gravar contato do site:", e);
    return { ok: false, erro: m.falha, valores };
  }
  return { ok: true };
}
