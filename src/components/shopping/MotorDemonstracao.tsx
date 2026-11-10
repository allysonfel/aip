'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { Secao } from '@/components/shopping/Comum';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { consultarMotor, mudarMotor } from '@/app/(sistema)/shopping/configuracoes/motorAcoes';
import type { EstadoMotor } from '@/lib/shopping/motor';

// Liga o motor das câmeras só na hora da demonstração. Desligado, as telas que
// dependem do vídeo (Câmeras ao vivo, Criança perdida e o modo real de Mapa de
// calor, Zonas mortas e Rotas) ficam sem dados; a simulação continua.

const TEXTO: Record<EstadoMotor, { rotulo: string; cor: 'success' | 'warning' | 'neutral' | 'error' }> = {
  ligado: { rotulo: 'Ligado', cor: 'success' },
  ligando: { rotulo: 'Ligando…', cor: 'warning' },
  desligado: { rotulo: 'Desligado', cor: 'neutral' },
  sem_configuracao: { rotulo: 'Não configurado', cor: 'neutral' },
  erro: { rotulo: 'Sem resposta', cor: 'error' },
};

export function MotorDemonstracao() {
  const [estado, setEstado] = useState<EstadoMotor | null>(null);
  const [desde, setDesde] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [pendente, iniciar] = useTransition();

  const atualizar = useCallback(async () => {
    try {
      const r = await consultarMotor();
      setEstado(r.estado);
      setDesde(r.desde);
    } catch {
      setEstado('erro');
    }
  }, []);

  useEffect(() => {
    atualizar();
  }, [atualizar]);

  // Enquanto liga, confere a cada 10 s até ficar pronto.
  useEffect(() => {
    if (estado !== 'ligando') return;
    const t = setInterval(atualizar, 10_000);
    return () => clearInterval(t);
  }, [estado, atualizar]);

  const mudar = (ligar: boolean) =>
    iniciar(async () => {
      setErro('');
      const r = await mudarMotor(ligar);
      if (!r.ok) setErro(r.erro);
      setEstado(ligar ? 'ligando' : 'desligado');
      if (!ligar) setDesde(null);
      setTimeout(atualizar, 2_000);
    });

  const t = estado ? TEXTO[estado] : null;
  const ligadoHa = desde ? Math.max(0, Math.round((Date.now() - new Date(desde).getTime()) / 60_000)) : null;

  return (
    <Secao
      titulo="Motor das câmeras (demonstração)"
      descricao="Fica desligado no dia a dia para não gerar custo. Ligue antes de uma demonstração e desligue no final. Leva uns 2 minutos para ficar pronto."
      acao={t ? <Badge variant={t.cor}>{t.rotulo}</Badge> : null}
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-on-surface-variant">
          Desligado, ficam sem dados: Câmeras ao vivo, Criança perdida e o modo real de Mapa de calor, Zonas mortas e Rotas. A simulação do shopping continua funcionando.
        </p>
        {estado === 'ligado' && ligadoHa != null && (
          <Alert variant="warning">Ligado há {ligadoHa >= 60 ? `${Math.floor(ligadoHa / 60)} h ${ligadoHa % 60} min` : `${ligadoHa} min`}. Custa cerca de US$ 1,50 por dia ligado: desligue quando terminar.</Alert>
        )}
        {erro && <Alert variant="error">{erro}</Alert>}
        <div className="flex flex-wrap gap-3">
          {estado === 'ligado' || estado === 'ligando' ? (
            <Button variant="outline" onClick={() => mudar(false)} disabled={pendente}>
              {pendente ? 'Desligando…' : 'Desligar motor'}
            </Button>
          ) : (
            <Button onClick={() => mudar(true)} disabled={pendente || estado === null || estado === 'sem_configuracao'}>
              {pendente ? 'Ligando…' : 'Ligar para demonstração'}
            </Button>
          )}
        </div>
      </div>
    </Secao>
  );
}
