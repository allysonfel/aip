import Link from 'next/link';
import { Secao, TituloPagina } from '@/components/Comum';
import { ChipAtributo } from '@/components/Atributos';
import { BASE } from '@/lib/base';
import { FiltroPeriodo } from '@/components/Periodo';
import { Paginacao } from '@/components/Paginacao';
import { buscar, cameras, config, CORES_PESSOA, CORES_VEICULO, NOMES_VEICULO, type Filtros } from '@/lib/dados';
import { lerPagina, lerPeriodo, POR_PAGINA } from '@/lib/periodo';

const hora = (d: Date) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Sao_Paulo' });

function Campo({ nome, rotulo, valor, opcoes }: { nome: string; rotulo: string; valor: string; opcoes: [string, string][] }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{rotulo}</span>
      <select name={nome} defaultValue={valor} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-2 py-2 text-sm text-on-surface">
        <option value="">Qualquer</option>
        {opcoes.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

type Params = Partial<Omit<Filtros, 'de' | 'ate'>> & { p?: string; de?: string; ate?: string; hde?: string; hate?: string; pag?: string };

export default async function Busca({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const per = lerPeriodo(sp);
  const pagina = lerPagina(sp.pag);
  const f: Filtros = {
    tipo: sp.tipo === 'veiculos' ? 'veiculos' : 'pessoas', de: sp.hde || '', ate: sp.hate || '', camera: sp.camera || '',
    cima: sp.cima || '', baixo_tipo: sp.baixo_tipo || '', baixo_cor: sp.baixo_cor || '', genero: sp.genero || '', bone: sp.bone || '', mochila: sp.mochila || '', bolsa: sp.bolsa || '',
    classe: sp.classe || '', cor: sp.cor || '',
  };
  const [cfg, cams] = await Promise.all([config(), cameras()]);
  const r = await buscar(f, cfg.limiar, per, pagina);
  const { tipo, camera, cima, baixo_tipo, baixo_cor, genero, bone, mochila, bolsa, classe, cor } = f;
  const manter = { tipo, camera, cima, baixo_tipo, baixo_cor, genero, bone, mochila, bolsa, classe, cor, hde: sp.hde, hate: sp.hate };
  const params = { ...manter, p: per.chave, de: per.chave === 'personalizado' ? per.de : undefined, ate: per.chave === 'personalizado' ? per.ate : undefined };
  const cores = (lista: string[]) => lista.map((c) => [c, c] as [string, string]);
  const simNao: [string, string][] = [['sim', 'sim'], ['nao', 'não']];
  return (
    <>
      <TituloPagina titulo="Busca por características" descricao={`Exemplo: camisa vermelha + bermuda, hoje entre 14h e 16h (escolha o período e o horário). Só entram atributos estimados com pelo menos ${Math.round(cfg.limiar * 100)}% de confiança.`} />
      <FiltroPeriodo caminho="/busca" periodo={per} manter={manter} />
      <Secao titulo="Filtros">
        <form className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <input type="hidden" name="p" value={per.chave} />
          {per.chave === 'personalizado' && (
            <>
              <input type="hidden" name="de" value={per.de} />
              <input type="hidden" name="ate" value={per.ate} />
            </>
          )}
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Procurar</span>
            <select name="tipo" defaultValue={f.tipo} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-2 py-2 text-sm text-on-surface">
              <option value="pessoas">Pessoas</option>
              <option value="veiculos">Veículos</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Horário: das</span>
            <input type="time" name="hde" defaultValue={f.de} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-2 py-2 text-sm text-on-surface" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Até</span>
            <input type="time" name="hate" defaultValue={f.ate} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-2 py-2 text-sm text-on-surface" />
          </label>
          <Campo nome="camera" rotulo="Câmera" valor={f.camera} opcoes={cams.map((c) => [c.canal, c.nome])} />
          <div />
          {f.tipo === 'pessoas' ? (
            <>
              <Campo nome="cima" rotulo="Cor de cima" valor={f.cima} opcoes={cores(CORES_PESSOA)} />
              <Campo nome="baixo_tipo" rotulo="Parte de baixo" valor={f.baixo_tipo} opcoes={[['calça', 'calça'], ['bermuda/short', 'bermuda/short'], ['saia/vestido', 'saia/vestido']]} />
              <Campo nome="baixo_cor" rotulo="Cor de baixo" valor={f.baixo_cor} opcoes={cores(CORES_PESSOA)} />
              <Campo nome="genero" rotulo="Gênero (estimado)" valor={f.genero} opcoes={[['masculino', 'masculino'], ['feminino', 'feminino']]} />
              <Campo nome="bone" rotulo="Boné/chapéu" valor={f.bone} opcoes={simNao} />
              <Campo nome="mochila" rotulo="Mochila" valor={f.mochila} opcoes={simNao} />
              <Campo nome="bolsa" rotulo="Bolsa" valor={f.bolsa} opcoes={simNao} />
            </>
          ) : (
            <>
              <Campo nome="classe" rotulo="Tipo de veículo" valor={f.classe} opcoes={Object.entries(NOMES_VEICULO)} />
              <Campo nome="cor" rotulo="Cor do veículo" valor={f.cor} opcoes={cores(CORES_VEICULO)} />
            </>
          )}
          <div className="flex items-end gap-2">
            <button className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-on-primary">Buscar</button>
            <Link href={`/busca?tipo=${f.tipo}`} className="rounded-sm border border-outline-variant px-3 py-2 text-sm text-on-surface">
              Limpar
            </Link>
          </div>
        </form>
        <p className="mt-2 text-xs text-on-surface-variant">Mudou entre pessoas e veículos? Clique em Buscar para trocar os filtros.</p>
      </Secao>
      <Secao titulo={`${r.total} ${r.tipo === 'pessoas' ? (r.total === 1 ? 'pessoa encontrada' : 'pessoas encontradas') : r.total === 1 ? 'veículo encontrado' : 'veículos encontrados'}`} className="mt-4" descricao="Clique num recorte para ver a sequência de imagens daquele momento.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {r.tipo === 'pessoas'
            ? r.itens.map((p) => (
                <li key={p.id}>
                  <Link href={`/busca/pessoa/${p.id}`} className="cartao-clicavel block rounded border border-outline-variant p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- recorte do banco */}
                    <img src={`${BASE}/api/recorte/pessoa/${p.id}`} alt={`Pessoa às ${hora(p.inicio)}`} loading="lazy" className="mx-auto h-36 w-auto rounded-sm bg-black object-contain" />
                    <p className="mt-1 text-xs font-semibold text-on-surface">{hora(p.inicio)}</p>
                    <p className="text-[11px] text-on-surface-variant">{p.camera}</p>
                    <ChipAtributo rotulo="cima" a={p.atributos.cima} limiar={cfg.limiar} />
                    <ChipAtributo rotulo="baixo" a={p.atributos.baixo_tipo} limiar={cfg.limiar} />
                  </Link>
                </li>
              ))
            : r.itens.map((v) => (
                <li key={v.id}>
                  <Link href={`/busca/veiculo/${v.id}`} className="cartao-clicavel block rounded border border-outline-variant p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- recorte do banco */}
                    <img src={`${BASE}/api/recorte/veiculo/${v.id}`} alt={`Veículo às ${hora(v.inicio)}`} loading="lazy" className="aspect-[4/3] w-full rounded-sm bg-black object-contain" />
                    <p className="mt-1 text-xs font-semibold text-on-surface">
                      {hora(v.inicio)} · {NOMES_VEICULO[v.classe] ?? v.classe}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      {v.cor && (v.cor_conf ?? 0) >= cfg.limiar ? v.cor : 'cor indefinida'}
                      {v.velocidade_kmh != null ? ` · ${v.velocidade_kmh.toFixed(0)} km/h` : ''}
                    </p>
                  </Link>
                </li>
              ))}
        </ul>
        {!r.itens.length && <p className="text-sm text-on-surface-variant">Nada encontrado com esses filtros.</p>}
        <Paginacao caminho="/busca" pagina={pagina} total={r.total} porPagina={POR_PAGINA} params={params} />
      </Secao>
    </>
  );
}
