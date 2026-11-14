import { Numero, Secao, Tabela, TituloPagina } from '@/components/Comum';
import { Atualizar } from '@/components/Atualizar';
import { BarrasPorHora } from '@/components/Graficos';
import { FiltroPeriodo } from '@/components/Periodo';
import { cameras, conversaoFachada, NOMES_VEICULO, permanenciaMedia, resumo } from '@/lib/dados';
import { lerPeriodo } from '@/lib/periodo';

export default async function VisaoGeral({ searchParams }: { searchParams: Promise<{ p?: string; de?: string; ate?: string }> }) {
  const per = lerPeriodo(await searchParams);
  const [r, cams, conv, perm] = await Promise.all([resumo(per), cameras(), conversaoFachada(per), permanenciaMedia(per)]);
  const minutos = perm != null ? `${Math.floor(perm / 60)} min ${Math.round(perm % 60)} s` : '—';
  const camEntrada = cams.find((c) => c.tipo_linha === 'entrada' && c.ativa);
  const camVeiculos = cams.find((c) => c.tipo_linha === 'veiculos' && c.ativa);
  const tipos = [...new Set(r.porClasse.map((x) => x.classe))];
  const n = (classe: string, sentido: string) => r.porClasse.find((x) => x.classe === classe && x.sentido === sentido)?.n ?? 0;
  const eixo = per.dias === 1 ? 'por hora' : 'por dia';

  return (
    <>
      {per.chave === 'hoje' && <Atualizar segundos={30} />}
      <TituloPagina titulo="Visão geral" descricao={`${per.rotulo} (horário de Brasília).${per.chave === 'hoje' ? ' Atualiza sozinho a cada 30 segundos.' : ''}`} />
      <FiltroPeriodo caminho="/" periodo={per} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Secao titulo="Entradas na loja">
          <Numero rotulo={per.rotulo.toLowerCase()} valor={r.entradas} detalhe={camEntrada ? `linha da porta na câmera ${camEntrada.nome} · ${r.saidas} saídas` : 'linha da porta não configurada'} />
        </Secao>
        <Secao titulo="Ocupação agora">
          <Numero rotulo="pessoas dentro (entradas menos saídas de hoje)" valor={r.ocupacao} />
        </Secao>
        <Secao titulo="Veículos na rua">
          <Numero rotulo={`passaram (${per.rotulo.toLowerCase()})`} valor={r.veiculos} detalhe={camVeiculos ? `linha na câmera ${camVeiculos.nome}` : 'linha de veículos não configurada'} />
        </Secao>
        <Secao titulo="Conversão da fachada">
          <Numero rotulo="entraram ÷ passaram na calçada" valor={conv.taxa != null ? `${(conv.taxa * 100).toFixed(1).replace('.', ',')}%` : '—'} detalhe={`${conv.entraram} entradas de ${conv.passaram} pessoas na calçada`} />
        </Secao>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Secao titulo={`Pessoas ${eixo}`} descricao="Entradas e saídas pela linha da porta">
          <BarrasPorHora dados={r.horas} series={[{ chave: 'entradas', nome: 'Entradas', cor: 'var(--color-primary)' }, { chave: 'saidas', nome: 'Saídas', cor: '#94a3b8' }]} />
        </Secao>
        <Secao titulo={`Veículos ${eixo}`} descricao="Passagens pela linha da rua, nos dois sentidos">
          <BarrasPorHora dados={r.horas} series={[{ chave: 'veiculos', nome: 'Veículos', cor: '#f59e0b' }]} />
        </Secao>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Secao titulo="Tempo médio na loja" descricao="Estimado pela ocupação ao longo do período (entradas e saídas pela porta).">
          <Numero rotulo="por pessoa" valor={minutos} />
        </Secao>
        <Secao titulo={`Calçada × entradas ${eixo}`} descricao="Pessoas vistas na câmera da calçada e pessoas que entraram pela porta">
          <BarrasPorHora dados={conv.horas} series={[{ chave: 'passaram', nome: 'Passaram na calçada', cor: '#94a3b8' }, { chave: 'entraram', nome: 'Entraram', cor: 'var(--color-primary)' }]} />
        </Secao>
      </div>

      <Secao titulo="Veículos por tipo e sentido" className="mt-4" descricao="Sentido A e sentido B são os dois lados da linha desenhada na configuração.">
        {tipos.length ? (
          <Tabela cabecalho={['Tipo', 'Sentido A', 'Sentido B', 'Total']} alinharDireita={[1, 2, 3]} linhas={tipos.map((t) => [NOMES_VEICULO[t] ?? t, n(t, 'a'), n(t, 'b'), n(t, 'a') + n(t, 'b')])} />
        ) : (
          <p className="text-sm text-on-surface-variant">Nenhum veículo contado no período.</p>
        )}
      </Secao>
    </>
  );
}
