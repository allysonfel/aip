import { Secao, TituloPagina } from '@/components/Comum';
import { cameras, config } from '@/lib/dados';
import { salvarGeral } from './acoes';
import EditorCamera from './EditorCamera';

export default async function Configuracao() {
  const [cams, cfg] = await Promise.all([cameras(), config()]);
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
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Confiança mínima (%)</span>
            <input name="limiar" type="number" min={50} max={95} defaultValue={Math.round(cfg.limiar * 100)} className="mt-1 w-28 rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
          </label>
          <button className="rounded-sm bg-primary px-4 py-2 font-semibold text-on-primary">Salvar</button>
          <p className="w-full text-xs text-on-surface-variant">Abaixo da confiança mínima, o atributo aparece como &quot;indefinido&quot; em vez de um chute.</p>
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
