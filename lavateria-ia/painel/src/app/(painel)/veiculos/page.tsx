import { Numero, Secao, Tabela, TituloPagina } from '@/components/Comum';
import { ChipAtributo } from '@/components/Atributos';
import { BASE } from '@/lib/base';
import { BarrasPorHora } from '@/components/Graficos';
import { FiltroPeriodo } from '@/components/Periodo';
import { Paginacao } from '@/components/Paginacao';
import { cameras, config, NOMES_VEICULO, parados, resumo, resumoVeiculos, veiculosPeriodo, velocidades } from '@/lib/dados';
import { lerPagina, lerPeriodo, POR_PAGINA } from '@/lib/periodo';

const hora = (d: Date) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Sao_Paulo' });

export default async function Veiculos({ searchParams }: { searchParams: Promise<{ p?: string; de?: string; ate?: string; pag?: string }> }) {
  const sp = await searchParams;
  const per = lerPeriodo(sp);
  const pagina = lerPagina(sp.pag);
  const cfg = await config();
  const [r, rv, { itens: lista, total }, vel, par, cams] = await Promise.all([resumo(per), resumoVeiculos(per, cfg.limiar), veiculosPeriodo(per, pagina), velocidades(per), parados(per, cfg.paradoMin), cameras()]);
  const params = { p: per.chave, de: per.chave === 'personalizado' ? per.de : undefined, ate: per.chave === 'personalizado' ? per.ate : undefined };
  const calibrada = cams.some((c) => c.tipo_linha === 'veiculos' && c.calibracao);
  const kmh = (v: number | null) => (v == null ? '—' : `${v.toFixed(0)} km/h`);
  const tipos = [...new Set(r.porClasse.map((x) => x.classe))];
  const n = (classe: string, sentido: string) => r.porClasse.find((x) => x.classe === classe && x.sentido === sentido)?.n ?? 0;
  const totalA = r.porClasse.filter((x) => x.sentido === 'a').reduce((s, x) => s + x.n, 0);
  const totalB = r.porClasse.filter((x) => x.sentido === 'b').reduce((s, x) => s + x.n, 0);
  return (
    <>
      <TituloPagina titulo="Veículos" descricao="Câmera da rua (Frente2): passagens pela linha virtual, por tipo, cor e sentido. A cor é uma ESTIMATIVA, com a confiança; à noite (imagem sem cor) ela não é estimada." />
      <FiltroPeriodo caminho="/veiculos" periodo={per} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Secao titulo={`Passaram (${per.rotulo.toLowerCase()})`}>
          <Numero rotulo="pela linha da rua" valor={r.veiculos} />
        </Secao>
        <Secao titulo="Sentido A">
          <Numero rotulo="veículos" valor={totalA} />
        </Secao>
        <Secao titulo="Sentido B">
          <Numero rotulo="veículos" valor={totalB} />
        </Secao>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Secao titulo="Por tipo e sentido">
          {tipos.length ? (
            <Tabela cabecalho={['Tipo', 'Sentido A', 'Sentido B', 'Total']} alinharDireita={[1, 2, 3]} linhas={tipos.map((t) => [NOMES_VEICULO[t] ?? t, n(t, 'a'), n(t, 'b'), n(t, 'a') + n(t, 'b')])} />
          ) : (
            <p className="text-sm text-on-surface-variant">Nenhum veículo contado no período.</p>
          )}
        </Secao>
        <Secao titulo="Por cor (todos os veículos vistos)" descricao={`Abaixo de ${Math.round(cfg.limiar * 100)}% de confiança conta como indefinido.`}>
          {rv.porCor.length ? <Tabela cabecalho={['Cor', 'Veículos']} alinharDireita={[1]} linhas={rv.porCor.map((c) => [c.cor, c.n])} /> : <p className="text-sm text-on-surface-variant">Sem veículos analisados ainda.</p>}
        </Secao>
      </div>
 <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Secao titulo={`Velocidade média ${per.dias === 1 ? 'por hora' : 'por dia'}`} descricao={calibrada ? `Média do período: ${kmh(vel.media)} (${vel.n} veículos medidos). Estimativa pela calibração da câmera.` : 'Velocidade não calibrada: marque os 4 pontos e as medidas da rua em Configuração.'}>
          {calibrada ? <BarrasPorHora dados={vel.horas} series={[{ chave: 'media', nome: 'km/h (média)', cor: '#a855f7' }]} /> : <p className="text-sm text-on-surface-variant">não calibrada</p>}
        </Secao>
        <Secao titulo="Maiores velocidades do período">
          {vel.maiores.length ? (
            <Tabela cabecalho={['Hora', 'Tipo', 'Sentido', 'km/h']} alinharDireita={[3]} linhas={vel.maiores.map((m) => [hora(m.inicio), NOMES_VEICULO[m.classe] ?? m.classe, m.sentido ? m.sentido.toUpperCase() : '—', m.velocidade_kmh.toFixed(0)])} />
          ) : (
            <p className="text-sm text-on-surface-variant">{calibrada ? 'Nenhum veículo medido no período.' : 'não calibrada'}</p>
          )}
        </Secao>
      </div>
      <Secao titulo={`Parados em frente à loja por mais de ${cfg.paradoMin} min`} className="mt-4">
        {par.length ? (
          <Tabela cabecalho={['Chegou', 'Saiu', 'Tipo', 'Cor']} linhas={par.map((p) => [hora(p.inicio), hora(p.fim), NOMES_VEICULO[p.classe] ?? p.classe, p.cor && (p.cor_conf ?? 0) >= cfg.limiar ? p.cor : 'indefinido'])} />
        ) : (
          <p className="text-sm text-on-surface-variant">Nenhum veículo parado por tanto tempo no período.</p>
        )}
      </Secao>
      <Secao titulo="Veículos vistos" className="mt-4" descricao="Um registro por veículo. Inclui os que passaram sem cruzar a linha (sentido em branco) e os parados.">
        {lista.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {lista.map((v) => (
              <li key={v.id} className="rounded border border-outline-variant p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- recorte do banco */}
                <img src={`${BASE}/api/recorte/veiculo/${v.id}`} alt={`${NOMES_VEICULO[v.classe] ?? v.classe} às ${hora(v.inicio)}`} loading="lazy" className="aspect-[4/3] w-full rounded-sm bg-black object-contain" />
                <p className="mt-2 text-xs font-semibold text-on-surface">
                  {hora(v.inicio)} · {NOMES_VEICULO[v.classe] ?? v.classe}
                  {v.sentido ? ` · sentido ${v.sentido.toUpperCase()}` : ''}
                </p>
                <div className="mt-1 space-y-0.5">
                  <ChipAtributo rotulo="Cor (estimada)" a={v.atributos.cor} limiar={cfg.limiar} />
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Velocidade</span>
                    <span className="font-medium text-on-surface">{v.velocidade_kmh != null ? kmh(v.velocidade_kmh) : calibrada ? '—' : 'não calibrada'}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-on-surface-variant">Nenhum veículo no período.</p>
        )}
        <Paginacao caminho="/veiculos" pagina={pagina} total={total} porPagina={POR_PAGINA} params={params} />
      </Secao>
    </>
  );
}
