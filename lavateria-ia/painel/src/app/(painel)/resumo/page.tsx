import { Numero, Secao, Tabela, TituloPagina } from '@/components/Comum';
import { FiltroPeriodo } from '@/components/Periodo';
import { NOMES_VEICULO, resumoPeriodo } from '@/lib/dados';
import { lerPeriodo } from '@/lib/periodo';

const NOME_ATR: Record<string, string> = { genero: 'Gênero (estimado)', cima: 'Cor da parte de cima', baixo_tipo: 'Parte de baixo' };

export default async function Resumo({ searchParams }: { searchParams: Promise<{ p?: string; de?: string; ate?: string }> }) {
  const per = lerPeriodo(await searchParams);
  const r = await resumoPeriodo(per);
  const perm = r.permanencia != null ? `${Math.floor(r.permanencia / 60)} min ${Math.round(r.permanencia % 60)} s` : '—';
  const veicTotal = r.veic.reduce((s, v) => s + v.n, 0);
  const grupos = ['genero', 'cima', 'baixo_tipo'].map((g) => {
    const itens = r.perfil.filter((p) => p.atributo === g);
    const tot = itens.reduce((s, x) => s + x.n, 0);
    return { g, itens: itens.slice(0, 5).map((x) => [x.valor, `${Math.round((x.n / (tot || 1)) * 100)}%`, x.n]) };
  });
  return (
    <>
      <TituloPagina titulo="Resumo do dia" descricao={`${per.rotulo} (horário de Brasília). O perfil por atributos conta só estimativas acima da confiança mínima.`} />
      <FiltroPeriodo caminho="/resumo" periodo={per} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Secao titulo="Entradas">
          <Numero rotulo="pela porta" valor={r.entradas} />
        </Secao>
        <Secao titulo="Pico de ocupação">
          <Numero rotulo="pessoas ao mesmo tempo" valor={r.pico} detalhe={r.picoEm ? `em ${new Date(r.picoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}` : undefined} />
        </Secao>
        <Secao titulo="Tempo médio na loja">
          <Numero rotulo="por pessoa (estimado)" valor={perm} />
        </Secao>
        <Secao titulo="Conversão da fachada">
          <Numero rotulo="entraram ÷ passaram na calçada" valor={r.passaramCalcada ? `${((r.entradas / r.passaramCalcada) * 100).toFixed(1).replace('.', ',')}%` : '—'} detalhe={`${r.passaramCalcada} pessoas na calçada`} />
        </Secao>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Secao titulo="Veículos" descricao={`${veicTotal} passagens pela linha · velocidade média ${r.velMedia != null ? `${r.velMedia.toFixed(0)} km/h` : 'não calibrada'}`}>
          {r.veic.length ? <Tabela cabecalho={['Tipo', 'Passagens']} alinharDireita={[1]} linhas={r.veic.map((v) => [NOMES_VEICULO[v.classe] ?? v.classe, v.n])} /> : <p className="text-sm text-on-surface-variant">Nenhum veículo contado.</p>}
        </Secao>
        <Secao titulo="Perfil das pessoas" descricao={`${r.pessoasTot} pessoas analisadas no período, em todas as câmeras`}>
          <div className="grid gap-4 sm:grid-cols-3">
            {grupos.map(({ g, itens }) => (
              <div key={g}>
                <p className="mb-1 text-xs font-semibold text-on-surface-variant">{NOME_ATR[g]}</p>
                {itens.length ? <Tabela cabecalho={['', '%', 'n']} alinharDireita={[1, 2]} linhas={itens} /> : <p className="text-xs text-on-surface-variant">sem dados</p>}
              </div>
            ))}
          </div>
        </Secao>
      </div>
      <Secao titulo={`Alertas do período (${r.alertas.length}${r.alertas.length === 50 ? '+' : ''})`} className="mt-4">
        {r.alertas.length ? (
          <Tabela cabecalho={['Hora', 'Nível', 'Alerta']} linhas={r.alertas.map((a) => [new Date(a.quando).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }), a.nivel, a.mensagem])} />
        ) : (
          <p className="text-sm text-on-surface-variant">Nenhum alerta no período.</p>
        )}
      </Secao>
    </>
  );
}
