'use client';

import { useState } from 'react';
import { VideoAoVivo } from '@/components/CameraAoVivo';

export default function VideoBotao({ caminho }: { caminho: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button onClick={() => setAberto((a) => !a)} className="rounded-sm border border-outline-variant px-3 py-1 text-xs font-medium text-on-surface">
        {aberto ? 'Fechar vídeo' : 'Ver vídeo ao vivo'}
      </button>
      {aberto && (
        <div className="mt-3 w-full">
          <VideoAoVivo caminho={caminho} />
        </div>
      )}
    </>
  );
}
