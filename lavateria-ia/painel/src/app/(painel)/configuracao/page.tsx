import { Secao, TituloPagina } from '@/components/Comum';
import { cameras, config, loja, REGRAS } from '@/lib/dados';
import { salvarGeral, salvarLoja } from './acoes';
import EditorCamera from './EditorCamera';

export default async function Configuracao() {
  const [cams, cfg, lj] = await Promise.all([cameras(), config(), loja()]);
  const hm = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  return (
    <>
      <TituloPagina titulo="Configuração" descricao="Câmeras, linhas de contagem e privacidade. Os quadros abaixo são atuais: confira o nome e a função de cada câmera." />
      <Secao titulo="Privacidade, retenção e confiança" className="mb-4">
        <form action={salvarGeral} className="flex flex-wrap items-end gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="borrar" defaultChecked={cfg.borrarRostos} />
            Borrar as cabeças nas imagens e nos recortes (desligado: o sistema é interno). Se ligar, o vídeo ao vivo vira uma foto a cada 5 segundos.
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Guardar eventos por (dias)</span>
            <input name="retencao" type="number" min={1} max={90} defaultValue={cfg.retencaoDias} className="mt-1 w-28 rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Veículo parado após (min)</span>
            <input name="parado_min" type="number" min={1} max={120} defaultValue={cfg.paradoMin} className="mt-1 w-28 rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Confiança mínima (%)</span>
            <input name="limiar" type="number" min={50} max={95} defaultValue={Math.round(cfg.limiar * 100)} className="mt-1 w-28 rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
          </label>
          <button className="rounded-sm bg-primary px-4 py-2 font-semibold text-on-primary">Salvar</button>
          <p className="w-full text-xs text-on-surface-variant">Abaixo da confiança mínima, o atributo aparece como &quot;indefinido&quot; em vez de um chute.</p>
        </form>
      </Secao>
      <Secao titulo="Loja e regras" className="mb-4" descricao="Horários em Brasília. Fora do horário de funcionamento a loja é considerada fechada e vigiada. Os alertas vão para o sino do painel (WhatsApp fica para depois).">
        <form action={salvarLoja} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([['abre', 'Abre', lj.abre], ['fecha', 'Fecha', lj.fecha], ['limpeza_de', 'Limpeza das', lj.limpeza_de], ['limpeza_ate', 'Limpeza até', lj.limpeza_ate]] as const).map(([n, t, v]) => (
              <label key={n} className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t}</span>
                <input type="time" name={n} defaultValue={hm(v)} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
              </label>
            ))}
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {REGRAS.map((r) => (
              <li key={r.k} className="rounded-sm border border-outline-variant p-3">
                <label className="flex items-start gap-2">
                  <input type="checkbox" name={`regra_${r.k}`} defaultChecked={lj.regras[r.k] !== false} className="mt-0.5" />
                  <span>
                    <span className="font-medium text-on-surface">{r.t}</span>
                    <span className="mt-0.5 block text-xs text-on-surface-variant">{r.d}</span>
                  </span>
                </label>
                {r.k === 'fachada_fechada' && (
                  <label className="mt-2 flex items-center gap-2 pl-6 text-xs text-on-surface-variant">
                    parado por mais de <input type="number" name="fachada_s" min={15} max={900} defaultValue={lj.fachada_s} className="w-20 rounded-sm border border-outline-variant bg-surface px-2 py-1 text-on-surface" /> segundos
                  </label>
                )}
                {r.k === 'totem' && (
                  <label className="mt-2 flex items-center gap-2 pl-6 text-xs text-on-surface-variant">
                    no totem por mais de <input type="number" name="totem_min" min={1} max={30} defaultValue={Math.round(lj.totem_s / 60)} className="w-20 rounded-sm border border-outline-variant bg-surface px-2 py-1 text-on-surface" /> minutos
                  </label>
                )}
              </li>
            ))}
          </ul>
          <button className="rounded-sm bg-primary px-4 py-2 font-semibold text-on-primary">Salvar</button>
        </form>
      </Secao>
      <div className="space-y-4">
        {cams.map((c) => (
          <Secao key={c.canal} titulo={`${c.nome} (${c.canal})`} descricao={c.ativa ? `Analisada a ${c.fps} quadros por segundo` : 'Não analisada (o quadro é atualizado a cada 10 minutos)'}>
            <EditorCamera cam={c} />
          </Secao>
        ))}
      </div>
    </>
  );
}
