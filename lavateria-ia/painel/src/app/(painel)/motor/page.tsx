import { Numero, Secao, Tabela, TituloPagina } from '@/components/Comum';
import { Atualizar } from '@/components/Atualizar';
import { LinhaCpu } from '@/components/Graficos';
import { statusMotor } from '@/lib/dados';

const LIMITE_VCPU = 2;
const v = (n: number | null | undefined, casas = 1) => (n == null ? '—' : n.toFixed(casas).replace('.', ','));

export default async function Motor() {
  const { status, amostras, cpuMedia30, cpuPico30 } = await statusMotor();
  const vcpu = status?.cpu_pct != null ? status.cpu_pct / 100 : null;
  const atrasado = !status?.atualizado_em || Date.now() - new Date(status.atualizado_em).getTime() > 30_000;
  const cams = Object.entries(status?.cameras ?? {});
  const fpsTotal = cams.reduce((s, [, c]) => s + c.fps_processado, 0);
  const dados = amostras.map((a) => ({
    hora: new Date(a.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }),
    vcpu: Math.round((a.cpu_pct / 100) * 100) / 100,
    fps: a.fps_total,
  }));
  return (
    <>
      <Atualizar segundos={10} />
      <TituloPagina titulo="Uso do servidor" descricao={`Quanto o motor de visão consome na VPS (limite de ${LIMITE_VCPU} vCPU no Coolify). Base para decidir se dá para ligar as 5 câmeras.`} />
      {atrasado && <p className="mb-4 rounded-sm border border-warning bg-warning-container px-4 py-2 text-sm text-on-warning-container">O motor não manda notícia há mais de 30 segundos (pode estar subindo ou parado).</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Secao titulo="CPU agora">
          <Numero rotulo={`vCPU em uso (de ${LIMITE_VCPU})`} valor={v(vcpu, 2)} detalhe={vcpu != null ? `${Math.round((vcpu / LIMITE_VCPU) * 100)}% do limite` : undefined} />
        </Secao>
        <Secao titulo="CPU, últimos 30 min">
          <Numero rotulo="média · pico (vCPU)" valor={`${v(cpuMedia30 != null ? cpuMedia30 / 100 : null, 2)} · ${v(cpuPico30 != null ? cpuPico30 / 100 : null, 2)}`} />
        </Secao>
        <Secao titulo="Memória">
          <Numero rotulo="MB em uso pelo motor" valor={status?.mem_mb ?? '—'} />
        </Secao>
        <Secao titulo="Tempo por quadro">
          <Numero rotulo={`ms de inferência (média, ${status?.detector === 'openvino' ? 'OpenVINO' : 'PyTorch'})`} valor={v(status?.ms_inferencia, 0)} detalhe={`${v(fpsTotal, 1)} quadros analisados por segundo no total`} />
        </Secao>
      </div>
      <Secao titulo="Últimas 2 horas" className="mt-4">
        {dados.length ? <LinhaCpu dados={dados} /> : <p className="text-sm text-on-surface-variant">Sem amostras ainda.</p>}
      </Secao>
      <Secao titulo="Por câmera" className="mt-4">
        <Tabela
          cabecalho={['Câmera', 'Alvo (q/s)', 'Analisados (q/s)', 'Chegando da câmera (q/s)', 'Situação']}
          alinharDireita={[1, 2, 3]}
          linhas={cams.map(([, c]) => [c.nome, v(c.fps_alvo), v(c.fps_processado), v(c.fps_camera), c.online ? 'recebendo' : 'sem imagem'])}
        />
      </Secao>
    </>
  );
}
