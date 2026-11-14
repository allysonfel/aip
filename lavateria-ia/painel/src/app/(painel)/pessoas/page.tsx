import Link from 'next/link';
import { Secao, TituloPagina } from '@/components/Comum';
import { ChipAtributo, simNao } from '@/components/Atributos';
import { BASE } from '@/lib/base';
import { cameras, config, pessoasDoDia } from '@/lib/dados';

const hora = (d: Date) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Sao_Paulo' });
const duracao = (a: Date, b: Date) => {
  const s = Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`;
};

export default async function Pessoas({ searchParams }: { searchParams: Promise<{ camera?: string }> }) {
  const { camera } = await searchParams;
  const [lista, cams, cfg] = await Promise.all([pessoasDoDia(undefined, camera), cameras(), config()]);
  return (
    <>
      <TituloPagina
        titulo="Pessoas"
        descricao={`Cada pessoa rastreada hoje, com o melhor recorte e as características ESTIMADAS pela IA (com a confiança). Abaixo de ${Math.round(cfg.limiar * 100)}% de confiança aparece "indefinido". Sem reconhecimento facial: o sistema não sabe quem é a pessoa.`}
      />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href="/pessoas" className={`rounded-sm border px-3 py-1 ${!camera ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant text-on-surface'}`}>
          Todas as câmeras
        </Link>
        {cams.map((c) => (
          <Link key={c.canal} href={`/pessoas?camera=${c.canal}`} className={`rounded-sm border px-3 py-1 ${camera === c.canal ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant text-on-surface'}`}>
            {c.nome}
          </Link>
        ))}
      </div>
      {lista.length === 0 ? (
        <Secao titulo="Nenhuma pessoa ainda">
          <p className="text-sm text-on-surface-variant">As pessoas aparecem aqui alguns segundos depois de surgirem na câmera (a análise é feita uma vez por pessoa, com o melhor recorte).</p>
        </Secao>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lista.map((p) => {
            const a = p.atributos;
            return (
              <li key={p.id} className="flex gap-3 rounded border border-outline-variant bg-surface p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- recorte do banco */}
                <img src={`${BASE}/api/recorte/pessoa/${p.id}`} alt={`Pessoa ${p.track_id} na câmera ${p.camera}`} loading="lazy" className="h-40 w-20 shrink-0 rounded-sm bg-black object-contain" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-semibold text-on-surface">
                    {hora(p.inicio)} · {p.camera}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">na imagem por {duracao(p.inicio, p.fim)}</p>
                  {a.pequeno ? (
                    <p className="pt-2 text-xs italic text-on-surface-variant">Recorte pequeno demais para estimar.</p>
                  ) : (
                    <div className="space-y-0.5 pt-1">
                      <ChipAtributo rotulo="Gênero (estimado)" a={a.genero} limiar={cfg.limiar} />
                      <ChipAtributo rotulo="Parte de cima" a={a.cima} limiar={cfg.limiar} />
                      <ChipAtributo rotulo="Parte de baixo" a={a.baixo_tipo} limiar={cfg.limiar} />
                      <ChipAtributo rotulo="Cor de baixo" a={a.baixo_cor} limiar={cfg.limiar} />
                      <ChipAtributo rotulo="Boné/chapéu" a={a.bone} limiar={cfg.limiar} formatar={simNao} />
                      <ChipAtributo rotulo="Mochila" a={a.mochila} limiar={cfg.limiar} formatar={simNao} />
                      <ChipAtributo rotulo="Bolsa" a={a.bolsa} limiar={cfg.limiar} formatar={simNao} />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
