import { Secao, TituloPagina } from '@/components/Comum';
import { Atualizar } from '@/components/Atualizar';
import { BASE } from '@/lib/base';
import { alertas } from '@/lib/dados';
import { marcarLido, marcarTodosLidos } from './acoes';

const NIVEL: Record<string, { t: string; c: string }> = {
  urgente: { t: 'Urgente', c: 'bg-error text-on-error' },
  alto: { t: 'Alto', c: 'bg-error-container text-on-error-container' },
  medio: { t: 'Médio', c: 'bg-warning-container text-on-warning-container' },
  info: { t: 'Informação', c: 'bg-surface-container-high text-on-surface-variant' },
};

export default async function Alertas() {
  const lista = await alertas();
  const naoLidos = lista.filter((a) => !a.lido_em && a.nivel !== 'info').length;
  return (
    <>
      <Atualizar segundos={20} />
      <TituloPagina titulo="Alertas" descricao="Regras da loja (últimos 7 dias). As regras ligam e desligam em Configuração. O aviso por WhatsApp fica para depois.">
        {naoLidos > 0 && (
          <form action={marcarTodosLidos}>
            <button className="rounded-sm border border-outline-variant px-3 py-2 text-sm text-on-surface">Marcar todos como vistos</button>
          </form>
        )}
      </TituloPagina>
      {lista.length === 0 ? (
        <Secao titulo="Nenhum alerta">
          <p className="text-sm text-on-surface-variant">Nada aconteceu nos últimos 7 dias que dispare uma regra.</p>
        </Secao>
      ) : (
        <ul className="space-y-3">
          {lista.map((a) => {
            const n = NIVEL[a.nivel] ?? NIVEL.info;
            return (
              <li key={a.id} className={`flex gap-4 rounded border bg-surface p-4 ${a.lido_em || a.nivel === 'info' ? 'border-outline-variant' : 'border-error'}`}>
                {a.tem_imagem && (
                  <a href={`${BASE}/api/alerta/${a.id}`} target="_blank" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element -- imagem do alerta */}
                    <img src={`${BASE}/api/alerta/${a.id}`} alt="Imagem do momento do alerta" loading="lazy" className="h-24 w-36 rounded-sm bg-black object-cover" />
                  </a>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${n.c}`}>{n.t}</span>
                    <span className="text-xs text-on-surface-variant">
                      {new Date(a.quando).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                      {a.camera ? ` · ${a.camera}` : ''}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-on-surface">{a.mensagem}</p>
                </div>
                {!a.lido_em && a.nivel !== 'info' && (
                  <form action={marcarLido.bind(null, a.id)}>
                    <button className="rounded-sm border border-outline-variant px-3 py-1 text-xs text-on-surface">Visto</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
