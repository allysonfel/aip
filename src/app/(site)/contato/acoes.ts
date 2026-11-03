"use server";

import { headers } from "next/headers";
import { sql } from "@/lib/db";

export type EstadoContato = {
  ok: boolean;
  erro?: string;
  erros?: Record<string, string>;
  valores?: Record<string, string>;
};

const TIPOS = ["Empresa", "Órgão público ou instituição"];
const SOLUCOES = ["Câmeras IA", "Totem IA", "Ainda não sei"];
const QUANTIDADES = ["Ainda não possuo câmeras", "Até 10", "De 11 a 30", "De 31 a 100", "Mais de 100", "Não sei informar"];

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
  const valores = {
    nome: campo("nome"),
    email: campo("email"),
    whatsapp: campo("whatsapp", 40),
    empresa: campo("empresa"),
    cargo: campo("cargo"),
    cidade_estado: campo("cidade_estado"),
    tipo_organizacao: campo("tipo_organizacao"),
    solucao: campo("solucao"),
    quantidade_cameras: campo("quantidade_cameras"),
    mensagem: campo("mensagem", 4000),
  };

  // Honeypot preenchido: robô. Responde como sucesso e não grava nada.
  if (campo("site_web")) return { ok: true };

  const erros: Record<string, string> = {};
  if (valores.nome.length < 2) erros.nome = "Informe seu nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.email)) erros.email = "Informe um e-mail válido.";
  if (valores.whatsapp.replace(/\D/g, "").length < 10) erros.whatsapp = "Informe o WhatsApp com DDD.";
  if (!valores.empresa) erros.empresa = "Informe a empresa ou o órgão.";
  if (!valores.cidade_estado) erros.cidade_estado = "Informe a cidade e o estado.";
  if (!TIPOS.includes(valores.tipo_organizacao)) erros.tipo_organizacao = "Selecione o tipo de organização.";
  if (!SOLUCOES.includes(valores.solucao)) erros.solucao = "Selecione a solução de interesse.";
  if (!QUANTIDADES.includes(valores.quantidade_cameras)) erros.quantidade_cameras = "Selecione a quantidade de câmeras.";
  if (!valores.mensagem) erros.mensagem = "Escreva uma mensagem.";
  if (dados.get("aceite") !== "on") erros.aceite = "É preciso aceitar a Política de Privacidade.";
  if (Object.keys(erros).length) return { ok: false, erros, valores };

  const cabecalhos = await headers();
  const ip = cabecalhos.get("x-forwarded-for")?.split(",")[0].trim() || "desconhecido";
  if (excedeuLimite(ip)) return { ok: false, erro: "Muitos envios em pouco tempo. Tente novamente mais tarde.", valores };

  try {
    await sql`
      INSERT INTO contatos_site (nome, email, whatsapp, empresa, cargo, cidade_estado, tipo_organizacao, solucao, quantidade_cameras, mensagem, aceite_privacidade, origem)
      VALUES (${valores.nome}, ${valores.email}, ${valores.whatsapp}, ${valores.empresa}, ${valores.cargo || null}, ${valores.cidade_estado}, ${valores.tipo_organizacao}, ${valores.solucao}, ${valores.quantidade_cameras}, ${valores.mensagem}, true, ${campo("origem") || null})
    `;
  } catch (e) {
    console.error("Falha ao gravar contato do site:", e);
    return { ok: false, erro: "Não foi possível enviar agora. Tente novamente em instantes.", valores };
  }
  return { ok: true };
}
