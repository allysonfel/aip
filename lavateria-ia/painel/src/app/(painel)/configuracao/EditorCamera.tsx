'use client';

import { useRef, useState } from 'react';
import { BASE } from '@/lib/base';
import type { CameraInfo } from '@/lib/dados';
import { salvarCamera } from './acoes';

type Ponto = [number, number];
const PADRAO: { a: Ponto; b: Ponto } = { a: [0.3, 0.5], b: [0.7, 0.5] };
// Calibração: frente-esquerda, frente-direita, fundo-direita, fundo-esquerda (um trapézio sobre a rua).
const CAL_PADRAO: Ponto[] = [[0.15, 0.85], [0.6, 0.85], [0.62, 0.3], [0.4, 0.3]];
const NOME_PONTO = ['1 frente-esq.', '2 frente-dir.', '3 fundo-dir.', '4 fundo-esq.'];

/** Quadro atual da câmera com a linha de contagem arrastável por cima. */
export default function EditorCamera({ cam }: { cam: CameraInfo }) {
  const [linha, setLinha] = useState(cam.linha ?? PADRAO);
  const [tipo, setTipo] = useState<string>(cam.tipo_linha ?? '');
  const [arrastando, setArrastando] = useState<string | number | null>(null);
  const [cal, setCal] = useState<Ponto[]>(cam.calibracao?.pontos ?? CAL_PADRAO);
  const [calibrar, setCalibrar] = useState(Boolean(cam.calibracao));
  const [zona, setZona] = useState<Ponto[]>(cam.zona_totem ?? [[0.3, 0.3], [0.5, 0.3], [0.5, 0.6], [0.3, 0.6]]);
  const [temZona, setTemZona] = useState(Boolean(cam.zona_totem));
  const [exclusao, setExclusao] = useState<Ponto[][]>(cam.exclusao ?? []);
  const [zonaAttr, setZonaAttr] = useState<Ponto[]>(cam.zona_atributos ?? [[0.5, 0.5], [0.8, 0.5], [0.85, 0.98], [0.45, 0.98]]);
  const [temZonaAttr, setTemZonaAttr] = useState(Boolean(cam.zona_atributos));
  const [area, setArea] = useState<Ponto[]>(cam.area_interna ?? [[0.1, 0.4], [0.9, 0.4], [0.95, 0.98], [0.05, 0.98]]);
  const [temArea, setTemArea] = useState(Boolean(cam.area_interna));
  const [salvo, setSalvo] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const proporcao = cam.largura && cam.altura ? cam.largura / cam.altura : 704 / 480;

  const mover = (e: React.PointerEvent) => {
    if (!arrastando || !caixa.current) return;
    const r = caixa.current.getBoundingClientRect();
    const p: Ponto = [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
    const r3: Ponto = [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000];
    if (typeof arrastando === 'number') setCal((c) => c.map((x, i) => (i === arrastando ? r3 : x)));
    else if (arrastando.startsWith('z')) setZona((z) => z.map((x, i) => (i === Number(arrastando[1]) ? r3 : x)));
    else if (arrastando.startsWith('i')) setArea((z) => z.map((x, i) => (i === Number(arrastando.slice(1)) ? r3 : x)));
    else if (arrastando.startsWith('q')) setZonaAttr((z) => z.map((x, i) => (i === Number(arrastando[1]) ? r3 : x)));
    else if (arrastando.startsWith('x')) {
      const [, zi, pi] = arrastando.split(':').map(Number);
      setExclusao((ex) => ex.map((pol, i) => (i === zi ? pol.map((x, j) => (j === pi ? r3 : x)) : pol)));
    }
    else if (arrastando === 'a' || arrastando === 'b') setLinha((l) => ({ ...l, [arrastando]: r3 }));
    setSalvo(false);
  };

  // Seta para o lado "A" (no motor: fim do lado negativo do produto vetorial).
  const [ax, ay] = linha.a;
  const [bx, by] = linha.b;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const vx = (bx - ax) * proporcao;
  const vy = by - ay;
  const n = Math.hypot(vx, vy) || 1;
  const sx = mx + (-vy / n) * 0.09 / proporcao;
  const sy = my + (vx / n) * 0.09;
  const nomeA = tipo === 'entrada' ? 'entrada' : 'sentido A';

  return (
    <form
      action={async (f) => {
        await salvarCamera(cam.canal, f);
        setSalvo(true);
      }}
      className="grid gap-5 lg:grid-cols-[1.4fr_1fr]"
    >
      <div>
        <div
          ref={caixa}
          className="relative touch-none select-none overflow-hidden rounded-sm bg-black"
          style={{ aspectRatio: String(proporcao) }}
          onPointerMove={mover}
          onPointerUp={() => setArrastando(null)}
          onPointerLeave={() => setArrastando(null)}
        >
          {cam.quadro_cru_em ? (
            // eslint-disable-next-line @next/next/no-img-element -- quadro atual da câmera
            <img src={`${BASE}/api/quadro/${cam.canal}?tipo=cru&t=${new Date(cam.quadro_cru_em).getTime()}`} alt={`Quadro atual da câmera ${cam.nome}`} className="h-full w-full object-contain" draggable={false} />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Esperando o primeiro quadro do motor...</p>
          )}
          {temArea && (
            <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <polygon points={area.map((p) => p.join(',')).join(' ')} fill="rgba(96,165,250,0.16)" stroke="#60a5fa" style={{ strokeWidth: 2 }} vectorEffect="non-scaling-stroke" />
            </svg>
          )}
          {temArea &&
            area.map((p, i) => (
              <button
                key={`i${i}`}
                type="button"
                aria-label={`Ponto ${i + 1} da área interna (arraste)`}
                onPointerDown={(e) => {
                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  setArrastando(`i${i}`);
                }}
                className="absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-sm border-2 border-white bg-[#60a5fa] text-[8px] font-bold text-black shadow"
                style={{ left: `${p[0] * 100}%`, top: `${p[1] * 100}%` }}
              >
                {i + 1}
              </button>
            ))}
          {temZonaAttr && (
            <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <polygon points={zonaAttr.map((p) => p.join(',')).join(' ')} fill="rgba(34,211,238,0.15)" stroke="#22d3ee" strokeDasharray="0.02 0.01" style={{ strokeWidth: 2 }} vectorEffect="non-scaling-stroke" />
            </svg>
          )}
          {temZonaAttr &&
            zonaAttr.map((p, i) => (
              <button
                key={`q${i}`}
                type="button"
                aria-label={`Canto ${i + 1} da zona de atributos (arraste)`}
                onPointerDown={(e) => {
                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  setArrastando(`q${i}`);
                }}
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rotate-45 border-2 border-white bg-[#22d3ee] shadow"
                style={{ left: `${p[0] * 100}%`, top: `${p[1] * 100}%` }}
              />
            ))}
          {exclusao.length > 0 && (
            <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              {exclusao.map((pol, i) => (
                <polygon key={i} points={pol.map((p) => p.join(',')).join(' ')} fill="rgba(239,68,68,0.25)" stroke="#ef4444" style={{ strokeWidth: 2 }} vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
          )}
          {exclusao.map((pol, zi) =>
            pol.map((p, pi) => (
              <button
                key={`x${zi}-${pi}`}
                type="button"
                aria-label={`Canto ${pi + 1} da zona de exclusão ${zi + 1} (arraste)`}
                onPointerDown={(e) => {
                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  setArrastando(`x:${zi}:${pi}`);
                }}
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-[#ef4444] shadow"
                style={{ left: `${p[0] * 100}%`, top: `${p[1] * 100}%` }}
              />
            )),
          )}
          {temZona && (
            <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <polygon points={zona.map((p) => p.join(',')).join(' ')} fill="rgba(245,158,11,0.18)" stroke="#f59e0b" style={{ strokeWidth: 2 }} vectorEffect="non-scaling-stroke" />
            </svg>
          )}
          {temZona &&
            zona.map((p, i) => (
              <button
                key={`z${i}`}
                type="button"
                aria-label={`Canto ${i + 1} da zona do totem (arraste)`}
                onPointerDown={(e) => {
                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  setArrastando(`z${i}` as 'z0');
                }}
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-sm border-2 border-white bg-[#f59e0b] shadow"
                style={{ left: `${p[0] * 100}%`, top: `${p[1] * 100}%` }}
              />
            ))}
          {tipo === 'veiculos' && calibrar && (
            <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <polygon points={cal.map((p) => p.join(',')).join(' ')} fill="rgba(168,85,247,0.15)" stroke="#a855f7" style={{ strokeWidth: 2 }} vectorEffect="non-scaling-stroke" />
            </svg>
          )}
          {tipo === 'veiculos' &&
            calibrar &&
            cal.map((p, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ponto de calibração ${NOME_PONTO[i]} (arraste)`}
                onPointerDown={(e) => {
                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  setArrastando(i as 0 | 1 | 2 | 3);
                }}
                className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-[#a855f7] text-[10px] font-bold text-white shadow"
                style={{ left: `${p[0] * 100}%`, top: `${p[1] * 100}%` }}
              >
                {i + 1}
              </button>
            ))}
          {tipo && (
            <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#4ade80" strokeWidth={0.006} vectorEffect="non-scaling-stroke" style={{ strokeWidth: 3 }} />
              <line x1={mx} y1={my} x2={sx} y2={sy} stroke="#4ade80" style={{ strokeWidth: 2 }} vectorEffect="non-scaling-stroke" strokeDasharray="4 3" />
            </svg>
          )}
          {tipo && (
            <>
              <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded bg-[#4ade80] px-1.5 py-0.5 text-[11px] font-semibold text-black" style={{ left: `${sx * 100}%`, top: `${sy * 100}%` }}>
                {nomeA}
              </span>
              {(['a', 'b'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-label={`Ponta ${k.toUpperCase()} da linha (arraste)`}
                  onPointerDown={(e) => {
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    setArrastando(k);
                  }}
                  className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-[#16a34a] shadow active:cursor-grabbing"
                  style={{ left: `${linha[k][0] * 100}%`, top: `${linha[k][1] * 100}%` }}
                />
              ))}
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          {cam.quadro_cru_em ? `Quadro de ${new Date(cam.quadro_cru_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}. ` : ''}
          {tipo ? 'Arraste as pontas verdes para posicionar a linha. A seta mostra o lado contado como "' + nomeA + '".' : 'Sem linha de contagem nesta câmera.'}
        </p>
      </div>

      <div className="space-y-4 text-sm">
        <input type="hidden" name="linha" value={JSON.stringify(linha)} />
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Nome</span>
          <input name="nome" defaultValue={cam.nome} maxLength={40} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Função</span>
          <input name="funcao" defaultValue={cam.funcao} maxLength={120} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Quadros por segundo</span>
            <input name="fps" type="number" min={0.5} max={15} step={0.5} defaultValue={cam.fps} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Linha</span>
            <select name="tipo_linha" value={tipo} onChange={(e) => { setTipo(e.target.value); setSalvo(false); }} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface">
              <option value="">Nenhuma</option>
              <option value="entrada">Entradas da loja</option>
              <option value="veiculos">Veículos</option>
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="ativa" defaultChecked={cam.ativa} />
          Analisar esta câmera
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Confiança mínima para detectar (%)</span>
          <input name="conf_min" type="number" min={20} max={90} defaultValue={Math.round((cam.conf_min ?? 0.4) * 100)} className="mt-1 w-28 rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
          <span className="mt-1 block text-xs text-on-surface-variant">Mais alta nas câmeras da rua evita lixo e sombra virando pessoa.</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={temZonaAttr} onChange={(e) => { setTemZonaAttr(e.target.checked); setSalvo(false); }} className="mt-0.5" />
          <span>
            Zona de atributos (polígono ciano)
            <span className="block text-xs text-on-surface-variant">Só quem passa dentro dela recebe gênero, roupa, cor e acessórios. Fora dela a pessoa é contada, sem atributos. Sem zona: a imagem toda.</span>
          </span>
        </label>
        {temZonaAttr && <input type="hidden" name="zona_atributos" value={JSON.stringify(zonaAttr)} />}
        <div className="rounded-sm border border-outline-variant p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Zonas de exclusão</p>
          <p className="mt-1 text-xs text-on-surface-variant">Áreas vermelhas onde nada é detectado (ex.: o ponto do lixo). Arraste os cantos sobre a imagem.</p>
          <input type="hidden" name="exclusao" value={JSON.stringify(exclusao)} />
          <div className="mt-2 flex flex-wrap gap-2">
            {exclusao.length < 4 && (
              <button type="button" onClick={() => { setExclusao((ex) => [...ex, [[0.4, 0.4], [0.6, 0.4], [0.6, 0.6], [0.4, 0.6]]]); setSalvo(false); }} className="rounded-sm border border-outline-variant px-3 py-1 text-xs text-on-surface">
                + Adicionar zona
              </button>
            )}
            {exclusao.map((_, i) => (
              <button key={i} type="button" onClick={() => { setExclusao((ex) => ex.filter((__, j) => j !== i)); setSalvo(false); }} className="rounded-sm border border-error px-3 py-1 text-xs text-error">
                Remover zona {i + 1}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="fachada" defaultChecked={cam.fachada} />
          Esta câmera vê a calçada (conversão da fachada)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="interna" defaultChecked={cam.interna} />
          Câmera interna (regras de loja fechada e pet)
        </label>
        <div className="rounded-sm border border-outline-variant p-3">
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={temArea} onChange={(e) => { setTemArea(e.target.checked); setSalvo(false); }} className="mt-0.5" />
            <span>
              Área interna (polígono azul)
              <span className="block text-xs text-on-surface-variant">Só o chão de dentro da loja: deixe de fora a porta de vidro, a vitrine e tudo o que aparece lá fora. As regras da loja (loja fechada, pet, pessoa parada) e a linha de entrada só valem para quem tem o pé dentro dela.</span>
            </span>
          </label>
          {temArea && (
            <div className="mt-2 flex flex-wrap gap-2">
              <input type="hidden" name="area_interna" value={JSON.stringify(area)} />
              {area.length < 16 && (
                <button type="button" onClick={() => { setArea((a) => [...a, [(a[a.length - 1][0] + a[0][0]) / 2, (a[a.length - 1][1] + a[0][1]) / 2]]); setSalvo(false); }} className="rounded-sm border border-outline-variant px-3 py-1 text-xs text-on-surface">
                  + Ponto (entre o último e o 1)
                </button>
              )}
              {area.length > 3 && (
                <button type="button" onClick={() => { setArea((a) => a.slice(0, -1)); setSalvo(false); }} className="rounded-sm border border-outline-variant px-3 py-1 text-xs text-on-surface">
                  − Último ponto
                </button>
              )}
            </div>
          )}
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={temZona} onChange={(e) => { setTemZona(e.target.checked); setSalvo(false); }} />
          Zona do totem (quadrado laranja: arraste os cantos)
        </label>
        {temZona && <input type="hidden" name="zona_totem" value={JSON.stringify(zona)} />}
        {tipo === 'veiculos' && (
          <fieldset className="space-y-3 rounded-sm border border-outline-variant p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Velocidade</legend>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={calibrar} onChange={(e) => { setCalibrar(e.target.checked); setSalvo(false); }} />
              Calibrar (4 pontos roxos sobre a rua + medidas reais)
            </label>
            {calibrar && (
              <>
                <input type="hidden" name="calibracao" value={JSON.stringify(cal)} />
                <p className="text-xs text-on-surface-variant">Arraste os pontos 1 a 4 para os cantos de um trecho da rua que você consiga medir (por exemplo, entre duas faixas ou dois postes). 1-2 é o lado mais perto da câmera.</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-on-surface-variant">Largura do trecho (m, entre 1 e 2)</span>
                    <input name="largura_m" type="number" step="0.1" min="0.5" defaultValue={cam.calibracao?.largura_m ?? ''} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-on-surface-variant">Comprimento (m, entre 1-2 e 3-4)</span>
                    <input name="comprimento_m" type="number" step="0.1" min="0.5" defaultValue={cam.calibracao?.comprimento_m ?? ''} className="mt-1 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface" />
                  </label>
                </div>
              </>
            )}
            {!calibrar && <p className="text-xs text-on-surface-variant">Sem calibração, a velocidade aparece como &quot;não calibrada&quot;.</p>}
          </fieldset>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-sm bg-primary px-4 py-2 font-semibold text-on-primary">Salvar</button>
          {tipo && (
            <button type="button" onClick={() => { setLinha({ a: linha.b, b: linha.a }); setSalvo(false); }} className="rounded-sm border border-outline-variant px-3 py-2 text-on-surface">
              Inverter sentido
            </button>
          )}
          {salvo && <span className="text-xs text-[var(--color-success)]">Salvo. O motor aplica em até 10 segundos.</span>}
        </div>
        <p className="text-xs text-on-surface-variant">Canal no servidor de vídeo: lavateria/{cam.caminho}</p>
      </div>
    </form>
  );
}
