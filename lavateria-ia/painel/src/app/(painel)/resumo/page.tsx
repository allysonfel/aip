import { Numero, Secao, Tabela, TituloPagina } from '@/components/Comum';
import { NOMES_VEICULO, resumoDoDia } from '@/lib/dados';

const hojeBr = () => new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
const NOME_ATR: Record<string, string> = { genero: 'Gênero (estimado)', cima: 'Cor da parte de cima', baixo_tipo: 'Parte de baixo' };

export default async function Resumo({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const dia = (await searchParams).dia || hojeBr();
  const r = await resumoDoDia(dia);
  const perm = r.permanencia != null ? `${Math.floor(r.permanencia / 60)} min ${Math.round(r.permanencia % 60)} s` : '—';
  const veicTotal = r.veic.reduce((s, v) => s + v.n, 0);
  const grupos = ['genero', 'cima', 'baixo_tipo'].map((g) => {
    const itens = r.perfil.filter((p) => p.atributo === g);
    const tot = itens.reduce((s, x) => s + x.n, 0);
    return { g, itens: itens.slice(0, 5).map((x) => [x.valor, `${Math.round((x.n / (tot || 1)) * 100)}%`, x.n]) };
  });
  return (
    <>
      <TituloPagina titulo="Resumo do dia" descricao="Números do dia escolhido (horário de Brasília). Perfil por atributos conta só estimativas acima da confiança mínima.">
        <form className="flex items-end gap-2">
          <input type="date" name="dia" defaultValue={dia} className="rounded-sm border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface" />
          <button className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-on-primary">Ver</button>
        </form>
      </TituloPagina>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Secao titulo="Entradas">
          <Numero rotulo="pela porta" valor={r.entradas} />
        </Secao>
        <Secao titulo="Pico de ocupação">
          <Numero rotulo="pessoas ao mesmo tempo" valor={r.pico} detalhe={r.picoEm ? `às ${new Date(r.picoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}` : undefined} />
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
        <Secao titulo="Perfil das pessoas" descricao={`${r.pessoasTot} pessoas analisadas no dia, em todas as câmeras`}>
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
      <Secao titulo={`Alertas do dia (${r.alertas.length})`} className="mt-4">
        {r.alertas.length ? (
          <Tabela cabecalho={['Hora', 'Nível', 'Alerta']} linhas={r.alertas.map((a) => [new Date(a.quando).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }), a.nivel, a.mensagem])} />
        ) : (
          <p className="text-sm text-on-surface-variant">Nenhum alerta no dia.</p>
        )}
      </Secao>
    </>
  );
}
