import { TituloPagina } from '@/components/Comum';
import { cameras, config } from '@/lib/dados';
import CartaoCamera from './CartaoCamera';

// Ordem da tela ao vivo: Salão primeiro, Frente1 por último.
const ORDEM = ['cam5', 'cam2', 'cam3', 'cam4', 'cam1'];

export default async function AoVivo() {
  const [cams, cfg] = await Promise.all([cameras(), config()]);
  const pos = (c: string) => (ORDEM.indexOf(c) === -1 ? 99 : ORDEM.indexOf(c));
  const ativas = cams.filter((c) => c.ativa).sort((a, b) => pos(a.canal) - pos(b.canal));
  const inativas = cams.filter((c) => !c.ativa);
  return (
    <>
      <TituloPagina
        titulo="Câmeras ao vivo"
        descricao={
          cfg.borrarRostos
            ? 'Privacidade ligada: em vez do vídeo, uma foto a cada 5 segundos com as cabeças borradas, e as caixas da análise por cima.'
            : 'Vídeo na velocidade da câmera, com as caixas da análise por cima. Caixas, contadores e a linha piscando seguem o vídeo (que chega alguns segundos atrasado).'
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {ativas.map((c) => (
          <CartaoCamera key={c.canal} canal={c.canal} caminho={c.caminho} nome={c.nome} funcao={c.funcao} videoLiberado={!cfg.borrarRostos} rodape={`IA a ${String(c.fps).replace('.', ',')} quadros por segundo`} />
        ))}
      </div>
      {inativas.length > 0 && <p className="mt-6 text-sm text-on-surface-variant">Ainda não analisadas (dá para ligar em Configuração): {inativas.map((c) => c.nome).join(', ')}.</p>}
    </>
  );
}
