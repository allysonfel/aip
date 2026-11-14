import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Secao, TituloPagina } from '@/components/Comum';
import { ChipAtributo, simNao } from '@/components/Atributos';
import { BASE } from '@/lib/base';
import { config, momento, NOMES_VEICULO } from '@/lib/dados';
import Sequencia from './Sequencia';

const hora = (d: Date) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Sao_Paulo' });

export default async function Momento({ params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await params;
  if (tipo !== 'pessoa' && tipo !== 'veiculo') notFound();
  const [m, cfg] = await Promise.all([momento(tipo, Number(id)), config()]);
  if (!m) notFound();
  const quadros = m.quadros.map((q) => ({ id: q.id, ts: new Date(q.ts).toISOString() }));
  return (
    <>
      <TituloPagina titulo={tipo === 'pessoa' ? 'Pessoa' : NOMES_VEICULO[(m as { classe: string }).classe] ?? 'Veículo'} descricao={`${m.camera}, das ${hora(m.inicio)} às ${hora(m.fim)}.`}>
        <Link href="/busca" className="rounded-sm border border-outline-variant px-3 py-2 text-sm text-on-surface">
          Voltar para a busca
        </Link>
      </TituloPagina>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Secao titulo="Sequência de imagens do momento">
          <Sequencia quadros={quadros} />
        </Secao>
        <Secao titulo="Recorte e características estimadas">
          {/* eslint-disable-next-line @next/next/no-img-element -- recorte do banco */}
          <img src={`${BASE}/api/recorte/${tipo}/${m.id}`} alt="Recorte" className="mx-auto mb-4 max-h-72 rounded-sm bg-black object-contain" />
          {tipo === 'pessoa' ? (
            <div className="space-y-1">
              {(() => {
                const a = (m as { atributos: import('@/lib/dados').AtributosPessoa }).atributos;
                return (
                  <>
                    <ChipAtributo rotulo="Gênero (estimado)" a={a.genero} limiar={cfg.limiar} />
                    <ChipAtributo rotulo="Parte de cima" a={a.cima} limiar={cfg.limiar} />
                    <ChipAtributo rotulo="Parte de baixo" a={a.baixo_tipo} limiar={cfg.limiar} />
                    <ChipAtributo rotulo="Cor de baixo" a={a.baixo_cor} limiar={cfg.limiar} />
                    <ChipAtributo rotulo="Boné/chapéu" a={a.bone} limiar={cfg.limiar} formatar={simNao} />
                    <ChipAtributo rotulo="Mochila" a={a.mochila} limiar={cfg.limiar} formatar={simNao} />
                    <ChipAtributo rotulo="Bolsa" a={a.bolsa} limiar={cfg.limiar} formatar={simNao} />
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-1">
              <ChipAtributo rotulo="Cor (estimada)" a={(m as { atributos: { cor?: import('@/lib/dados').Atributo } }).atributos.cor} limiar={cfg.limiar} />
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Velocidade</span>
                <span className="font-medium text-on-surface">{(m as { velocidade_kmh: number | null }).velocidade_kmh != null ? `${(m as { velocidade_kmh: number }).velocidade_kmh.toFixed(0)} km/h` : 'não medida'}</span>
              </div>
            </div>
          )}
        </Secao>
      </div>
    </>
  );
}
