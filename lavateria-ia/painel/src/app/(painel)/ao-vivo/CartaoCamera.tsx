'use client';

import { useState } from 'react';
import { Secao } from '@/components/Comum';
import { VideoComCaixas } from '@/components/VideoComCaixas';

/** Cartão de uma câmera ao vivo. "Sem imagem" só se o motor ficar 15 s sem analisar a câmera. */
export default function CartaoCamera({ canal, caminho, nome, funcao, videoLiberado, rodape }: { canal: string; caminho: string; nome: string; funcao: string; videoLiberado: boolean; rodape: string }) {
  const [noAr, setNoAr] = useState(true);
  return (
    <Secao
      titulo={nome}
      descricao={funcao}
      acao={
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${noAr ? 'bg-success-container text-on-success-container' : 'bg-error-container text-on-error-container'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${noAr ? 'bg-[var(--color-success)]' : 'bg-error'}`} />
          {noAr ? 'ao vivo' : 'sem imagem'}
        </span>
      }
    >
      <VideoComCaixas canal={canal} caminho={caminho} nome={nome} videoLiberado={videoLiberado} aoEstado={setNoAr} />
      <p className="mt-3 text-sm text-on-surface-variant">{rodape}</p>
    </Secao>
  );
}
