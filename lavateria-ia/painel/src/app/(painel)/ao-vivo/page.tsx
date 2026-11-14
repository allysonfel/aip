import { Secao, TituloPagina } from '@/components/Comum';
import { Atualizar } from '@/components/Atualizar';
import { VideoComCaixas } from '@/components/VideoComCaixas';
import { cameras, config } from '@/lib/dados';

export default async function AoVivo() {
  const [cams, cfg] = await Promise.all([cameras(), config()]);
  const ativas = cams.filter((c) => c.ativa);
  const inativas = cams.filter((c) => !c.ativa);
  return (
    <>
      <Atualizar segundos={10} />
      <TituloPagina
        titulo="Câmeras ao vivo"
        descricao={
          cfg.borrarRostos
            ? 'Privacidade ligada: em vez do vídeo, uma foto a cada 5 segundos com as cabeças borradas, e as caixas da análise por cima.'
            : 'Vídeo na velocidade da câmera, com as caixas da análise por cima. A IA analisa menos quadros por segundo; entre uma análise e outra, as caixas são interpoladas. O vídeo tem alguns segundos de atraso.'
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {ativas.map((c) => {
          const noAr = c.online;
          return (
            <Secao
              key={c.canal}
              titulo={c.nome}
              descricao={c.funcao}
              acao={
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${noAr ? 'bg-success-container text-on-success-container' : 'bg-error-container text-on-error-container'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${noAr ? 'bg-[var(--color-success)]' : 'bg-error'}`} />
                  {noAr ? 'ao vivo' : 'sem imagem'}
                </span>
              }
            >
              <VideoComCaixas canal={c.canal} caminho={c.caminho} nome={c.nome} videoLiberado={!cfg.borrarRostos} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-on-surface-variant">
                <span>
                  {c.pessoas_agora} {c.pessoas_agora === 1 ? 'pessoa' : 'pessoas'} e {c.veiculos_agora} {c.veiculos_agora === 1 ? 'veículo' : 'veículos'} na imagem · IA a {String(c.fps).replace('.', ',')} quadros/s
                </span>
              </div>
              {!noAr && c.erro && <p className="mt-2 text-xs text-error">{c.erro}</p>}
            </Secao>
          );
        })}
      </div>
      {inativas.length > 0 && (
        <p className="mt-6 text-sm text-on-surface-variant">
          Ainda não analisadas (dá para ligar em Configuração): {inativas.map((c) => c.nome).join(', ')}.
        </p>
      )}
    </>
  );
}
