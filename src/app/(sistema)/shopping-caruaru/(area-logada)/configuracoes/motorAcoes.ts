'use server';

import { registrarAuditoria } from '@/lib/auditoria';
import { exigirAbaAcao } from '@/lib/sessaoServidor';
import { desligarMotor, estadoMotor, ligarMotor, type EstadoMotor } from '@/lib/shopping/motor';

// Botão do motor de visão (Configurações, só administrador geral).

export async function consultarMotor(): Promise<{ estado: EstadoMotor; desde: string | null }> {
  await exigirAbaAcao('configuracoes');
  return estadoMotor();
}

export async function mudarMotor(ligar: boolean): Promise<{ ok: true } | { ok: false; erro: string }> {
  const eu = await exigirAbaAcao('configuracoes');
  try {
    if (ligar) await ligarMotor();
    else await desligarMotor();
  } catch (e) {
    const m = e instanceof Error ? e.message : '';
    return { ok: false, erro: m === 'sem_configuracao' ? 'O botão ainda não foi configurado no servidor (token do Railway).' : 'Não foi possível falar com o servidor das câmeras. Tente de novo em instantes.' };
  }
  await registrarAuditoria({ empresaId: eu.empresaId, usuarioId: eu.id, acao: ligar ? 'motor_ligado' : 'motor_desligado' }).catch(() => {});
  return { ok: true };
}
