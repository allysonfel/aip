"use server";

import { headers } from "next/headers";
import { sql } from "@/lib/db";
import { PAISES } from "../_config/paises";
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
  const valores = {
    nome: campo("nome"),
    email: campo("email"),
    canal: campo("canal", 20),
    ddi_pais: campo("ddi_pais", 2),
    telefone: campo("telefone", 30),
    tipo_organizacao: tipos.join("|"),
    mensagem: campo("mensagem", 4000),
  };
  const paisTelefone = PAISES.find((p) => p.iso === valores.ddi_pais);

  // Honeypot preenchido: robô. Responde como sucesso e não grava nada.
  if (campo("site_web")) return { ok: true };

  const erros: Record<string, string> = {};
  if (valores.nome.length < 2) erros.nome = "Informe seu nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.email)) erros.email = "Informe um e-mail válido.";
  const digitos = valores.telefone.replace(/\D/g, "");
  if (!(CANAIS as readonly string[]).includes(valores.canal) || !paisTelefone) erros.telefone = "Escolha o canal e o código do país.";
  else if (digitos.length < (paisTelefone.iso === "BR" ? 10 : 6)) erros.telefone = paisTelefone.iso === "BR" ? "Informe o número com DDD." : "Informe o número.";
  if (!tipos.length) erros.tipo_organizacao = "Selecione o tipo de organização.";
  if (!valores.mensagem) erros.mensagem = "Escreva uma mensagem.";
  if (dados.get("aceite") !== "on") erros.aceite = "É preciso aceitar a Política de Privacidade.";
  if (Object.keys(erros).length) return { ok: false, erros, valores };

  const cabecalhos = await headers();
  const ip = cabecalhos.get("x-forwarded-for")?.split(",")[0].trim() || "desconhecido";
  if (excedeuLimite(ip)) return { ok: false, erro: "Muitos envios em pouco tempo. Tente novamente mais tarde.", valores };

  // Grava nas colunas que já existem: o telefone vai com o canal e o código
  // do país. Empresa, cidade, solução e quantidade de câmeras não são mais
  // perguntadas e ficam vazias (o produto de origem continua em `origem`).
  const contato = `${valores.canal}: +${paisTelefone!.ddi} ${valores.telefone}`;
  try {
    await sql`
      INSERT INTO contatos_site (nome, email, whatsapp, empresa, cargo, cidade_estado, tipo_organizacao, solucao, quantidade_cameras, mensagem, aceite_privacidade, origem)
      VALUES (${valores.nome}, ${valores.email}, ${contato}, '', ${null}, '', ${tipos.join(", ")}, '', '', ${valores.mensagem}, true, ${campo("origem") || null})
    `;
  } catch (e) {
    console.error("Falha ao gravar contato do site:", e);
    return { ok: false, erro: "Não foi possível enviar agora. Tente novamente em instantes.", valores };
  }
  return { ok: true };
}
