import { Numero, Secao, Tabela, TituloPagina } from '@/components/Comum';
import { Atualizar } from '@/components/Atualizar';
import { BarrasPorHora } from '@/components/Graficos';
import { cameras, NOMES_VEICULO, resumoHoje } from '@/lib/dados';

export default async function VisaoGeral() {
  const [r, cams] = await Promise.all([resumoHoje(), cameras()]);
  const camEntrada = cams.find((c) => c.tipo_linha === 'entrada' && c.ativa);
  const camVeiculos = cams.find((c) => c.tipo_linha === 'veiculos' && c.ativa);
  const tipos = [...new Set(r.porClasse.map((x) => x.classe))];
  const n = (classe: string, sentido: string) => r.porClasse.find((x) => x.classe === classe && x.sentido === sentido)?.n ?? 0;

  return (
    <>
      <Atualizar segundos={30} />
      <TituloPagina titulo="Visão geral" descricao="Hoje, desde a meia-noite (horário de Brasília). Atualiza sozinho a cada 30 segundos." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Secao titulo="Entradas na loja">
          <Numero rotulo="hoje" valor={r.entradas} detalhe={camEntrada ? `linha da porta na câmera ${camEntrada.nome}` : 'linha da porta não configurada'} />
        </Secao>
        <Secao titulo="Ocupação agora">
          <Numero rotulo="pessoas dentro (entradas menos saídas)" valor={r.ocupacao} detalhe={`${r.saidas} saídas hoje`} />
        </Secao>
        <Secao titulo="Veículos na rua">
          <Numero rotulo="passaram hoje" valor={r.veiculos} detalhe={camVeiculos ? `linha na câmera ${camVeiculos.nome}` : 'linha de veículos não configurada'} />
        </Secao>
        <Secao titulo="Conversão da fachada">
          <Numero rotulo="calçada × entradas" valor="—" detalhe="chega na etapa 3" />
        </Secao>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Secao titulo="Pessoas por hora" descricao="Entradas e saídas pela linha da porta">
          <BarrasPorHora dados={r.horas} series={[{ chave: 'entradas', nome: 'Entradas', cor: 'var(--color-primary)' }, { chave: 'saidas', nome: 'Saídas', cor: '#94a3b8' }]} />
        </Secao>
        <Secao titulo="Veículos por hora" descricao="Passagens pela linha da rua, nos dois sentidos">
          <BarrasPorHora dados={r.horas} series={[{ chave: 'veiculos', nome: 'Veículos', cor: '#f59e0b' }]} />
        </Secao>
      </div>

      <Secao titulo="Veículos por tipo e sentido" className="mt-4" descricao="Sentido A e sentido B são os dois lados da linha desenhada na configuração.">
        {tipos.length ? (
          <Tabela
            cabecalho={['Tipo', 'Sentido A', 'Sentido B', 'Total']}
            alinharDireita={[1, 2, 3]}
            linhas={tipos.map((t) => [NOMES_VEICULO[t] ?? t, n(t, 'a'), n(t, 'b'), n(t, 'a') + n(t, 'b')])}
          />
        ) : (
          <p className="text-sm text-on-surface-variant">Nenhum veículo contado hoje ainda.</p>
        )}
      </Secao>
    </>
  );
}
