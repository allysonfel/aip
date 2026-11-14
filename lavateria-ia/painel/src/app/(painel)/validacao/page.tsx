import Link from 'next/link';
import { Secao, Tabela, TituloPagina } from '@/components/Comum';
import { BASE } from '@/lib/base';
import { amostraValidacao, config, NOMES_VEICULO, precisao, type Atributo } from '@/lib/dados';
import { contagemManual } from './acoes';
import { Marcador } from './Marcador';

const ROTULOS: Record<string, string> = {
  genero: 'Gênero', cima: 'Cor de cima', baixo_tipo: 'Parte de baixo', baixo_cor: 'Cor de baixo', bone: 'Boné/chapéu', mochila: 'Mochila', bolsa: 'Bolsa', veiculo_tipo: 'Tipo de veículo', veiculo_cor: 'Cor do veículo',
};
const fmt = (v: Atributo['valor']) => (v === true ? 'sim' : v === false ? 'não' : String(v));
const hora = (d: Date) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

export default async function Validacao({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const tipo = (await searchParams).tipo === 'veiculo' ? 'veiculo' : 'pessoa';
  const [cfg, p] = await Promise.all([config(), precisao()]);
  const amostra = await amostraValidacao(tipo);
  const linhasPrecisao = Object.keys(ROTULOS)
    .map((k) => p.linhas.find((l) => l.atributo === k))
    .filter((l): l is { atributo: string; certos: number; total: number } => Boolean(l))
    .map((l) => [ROTULOS[l.atributo], `${Math.round((l.certos / l.total) * 100)}%`, `${l.certos} de ${l.total}`]);
  const somaManual = p.manuais.reduce((s, m) => s + m.manual, 0);
  const somaAuto = p.manuais.reduce((s, m) => s + m.automatico, 0);
  return (
    <>
      <TituloPagina titulo="Validação de precisão" descricao={`Marque "certo" ou "errado" em cada estimativa. O painel calcula a precisão REAL de cada atributo a partir das suas marcações. Só aparecem estimativas acima de ${Math.round(cfg.limiar * 100)}% (as "indefinidas" não são afirmações do sistema).`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Secao titulo="Precisão medida">
          {linhasPrecisao.length ? <Tabela cabecalho={['Atributo', 'Precisão', 'Marcações']} alinharDireita={[1, 2]} linhas={linhasPrecisao} /> : <p className="text-sm text-on-surface-variant">Nenhuma marcação ainda. Comece pela amostra abaixo.</p>}
        </Secao>
        <Secao titulo="Contagem de entradas" descricao="Conte quantas pessoas entraram num intervalo (olhando a câmera do Salão) e compare com o sistema.">
          <form action={contagemManual} className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <input type="datetime-local" name="de" required className="col-span-2 rounded-sm border border-outline-variant bg-surface px-2 py-1.5 text-on-surface sm:col-span-1" aria-label="De" />
            <input type="datetime-local" name="ate" required className="col-span-2 rounded-sm border border-outline-variant bg-surface px-2 py-1.5 text-on-surface sm:col-span-1" aria-label="Até" />
            <input type="number" name="manual" min={0} required placeholder="entraram" className="rounded-sm border border-outline-variant bg-surface px-2 py-1.5 text-on-surface" />
            <button className="rounded-sm bg-primary px-3 py-1.5 font-semibold text-on-primary">Comparar</button>
          </form>
          {p.manuais.length > 0 && (
            <>
              <p className="mt-3 text-sm text-on-surface">
                Precisão da contagem: <b>{somaManual ? `${Math.max(0, Math.round((1 - Math.abs(somaAuto - somaManual) / somaManual) * 100))}%` : '—'}</b> ({somaAuto} contadas pelo sistema × {somaManual} reais)
              </p>
              <div className="mt-2">
                <Tabela cabecalho={['Intervalo', 'Real', 'Sistema']} alinharDireita={[1, 2]} linhas={p.manuais.slice(0, 5).map((m) => [`${new Date(m.de).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} → ${hora(m.ate)}`, m.manual, m.automatico])} />
              </div>
            </>
          )}
        </Secao>
      </div>
      <div className="mb-3 mt-6 flex gap-2 text-sm">
        <Link href="/validacao" className={`rounded-sm border px-3 py-1 ${tipo === 'pessoa' ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant text-on-surface'}`}>
          Pessoas
        </Link>
        <Link href="/validacao?tipo=veiculo" className={`rounded-sm border px-3 py-1 ${tipo === 'veiculo' ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant text-on-surface'}`}>
          Veículos
        </Link>
      </div>
      <ul className="grid gap-3 lg:grid-cols-2">
        {amostra.map((item) => {
          const marcados = (item.marcados ?? {}) as Record<string, boolean>;
          const linhas: { k: string; est: string }[] = [];
          if (tipo === 'pessoa') {
            const a = (item as { atributos: Record<string, Atributo> }).atributos;
            for (const k of ['genero', 'cima', 'baixo_tipo', 'baixo_cor', 'bone', 'mochila', 'bolsa']) {
              const x = a[k];
              if (x && !x.motivo && x.valor != null && (x.conf ?? 0) >= cfg.limiar) linhas.push({ k, est: fmt(x.valor) });
            }
          } else {
            const v = item as { classe: string; atributos: { cor?: Atributo } };
            linhas.push({ k: 'veiculo_tipo', est: NOMES_VEICULO[v.classe] ?? v.classe });
            if (v.atributos.cor && v.atributos.cor.valor != null && (v.atributos.cor.conf ?? 0) >= cfg.limiar) linhas.push({ k: 'veiculo_cor', est: fmt(v.atributos.cor.valor) });
          }
          return (
            <li key={item.id} className="flex gap-3 rounded border border-outline-variant bg-surface p-3">
              <a href={`${BASE}/busca/${tipo}/${item.id}`} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- recorte do banco */}
                <img src={`${BASE}/api/recorte/${tipo}/${item.id}`} alt="Recorte" loading="lazy" className={tipo === 'pessoa' ? 'h-44 w-24 rounded-sm bg-black object-contain' : 'h-28 w-40 rounded-sm bg-black object-contain'} />
              </a>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-semibold text-on-surface">
                  {hora(item.inicio)} · {item.camera}
                </p>
                {linhas.length ? (
                  linhas.map((l) => <Marcador key={l.k} tipo={tipo} refId={item.id} atributo={l.k} rotulo={ROTULOS[l.k]} estimado={l.est} marcado={marcados[l.k]} />)
                ) : (
                  <p className="text-xs italic text-on-surface-variant">Nenhuma estimativa acima da confiança mínima.</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {!amostra.length && <p className="text-sm text-on-surface-variant">Tudo marcado por enquanto. Volte mais tarde para validar as próximas.</p>}
    </>
  );
}
