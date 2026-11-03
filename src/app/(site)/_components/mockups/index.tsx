import Image from "next/image";
import MapaCalor from "../MapaCalor";
import Janela from "./Janela";

function Quadro({ foto, nome, caixas = [] }: { foto: string; nome: string; caixas?: [number, number, number, number][] }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
      <Image src={`/site/media/${foto}`} alt="" fill sizes="240px" className="object-cover brightness-75" />
      {caixas.map(([x, y, w, h]) => (
        <span key={`${x}${y}`} className="absolute border border-visao" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }} />
      ))}
      <span className="absolute bottom-1 left-1.5 text-[10px] text-white/85">{nome}</span>
    </div>
  );
}

export function MockMosaico() {
  return (
    <Janela titulo="Câmeras ao vivo">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Quadro foto="praca-hero.jpg" nome="Câmera 01" caixas={[[30, 30, 6, 18], [58, 42, 6, 18], [46, 62, 7, 20]]} />
        <Quadro foto="shopping.jpg" nome="Câmera 02" caixas={[[48, 30, 8, 22]]} />
        <Quadro foto="estacionamento.jpg" nome="Câmera 03" />
        <Quadro foto="armazem.jpg" nome="Câmera 04" caixas={[[36, 52, 8, 26]]} />
        <Quadro foto="via-noite.jpg" nome="Câmera 05" />
        <Quadro foto="praca-aerea-2.jpg" nome="Câmera 06" caixas={[[52, 44, 5, 12]]} />
      </div>
    </Janela>
  );
}

const BARRAS = [18, 26, 34, 52, 68, 74, 61, 48, 57, 72, 83, 66, 44, 30];

export function MockVisaoGeral() {
  return (
    <Janela titulo="Visão geral">
      <div className="grid grid-cols-3 gap-2">
        {[["Entradas hoje", "3.482"], ["Ocupação agora", "412"], ["Horário de pico", "18h"]].map(([r, v]) => (
          <div key={r} className="rounded-lg border border-linha p-3">
            <p className="text-[11px] leading-tight text-cinza">{r}</p>
            <p className="mt-1 font-titulo text-3xl font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-linha p-3">
        <p className="text-[11px] text-cinza">Fluxo por hora</p>
        <div className="mt-3 flex h-28 items-end gap-1">
          {BARRAS.map((b, i) => (
            <span key={i} className="flex-1 rounded-t-sm bg-white/70" style={{ height: `${b}%` }} />
          ))}
        </div>
      </div>
    </Janela>
  );
}

export function MockPlanta() {
  return (
    <Janela titulo="Mapa de calor e rotas">
      <div className="mb-2 flex gap-1.5 text-[11px]">
        {["Planta", "Mapa", "Híbrido"].map((v, i) => (
          <span key={v} className={`rounded-md border border-linha px-2.5 py-1 ${i === 0 ? "bg-white text-black" : "text-cinza"}`}>{v}</span>
        ))}
      </div>
      <MapaCalor className="w-full" />
    </Janela>
  );
}

export function MockBusca() {
  return (
    <Janela titulo="Busca visual">
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {["Blusa azul", "Calça escura", "Mochila", "Hoje, 14h às 16h"].map((f) => (
          <span key={f} className="rounded-full border border-linha px-2.5 py-1 text-white/85">{f}</span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[["Câmera 02", "14h12"], ["Câmera 05", "14h37"], ["Câmera 01", "15h03"]].map(([c, h]) => (
          <div key={c} className="rounded-lg border border-linha p-2">
            <svg viewBox="0 0 60 90" className="mx-auto h-24 text-white/25">
              <circle cx="30" cy="16" r="10" fill="currentColor" />
              <path d="M12 86 V44 Q12 30 30 30 Q48 30 48 44 V86 Z" fill="currentColor" />
              <rect x="6" y="3" width="48" height="84" fill="none" stroke="var(--aip-visao)" strokeWidth="1" />
            </svg>
            <p className="mt-2 text-[11px]">{c}</p>
            <p className="text-[11px] text-cinza">{h}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-lg border border-linha px-3 py-2 text-xs text-cinza">Resultados sujeitos à confirmação de um operador.</p>
    </Janela>
  );
}

const SAUDE: [string, string, boolean][] = [
  ["Câmera 01", "Online", true],
  ["Câmera 02", "Online", true],
  ["Câmera 03", "Sem conexão", false],
  ["Câmera 04", "Desfocada", false],
  ["Câmera 05", "Online", true],
  ["Câmera 06", "Fora de posição", false],
];

export function MockSaude() {
  return (
    <Janela titulo="Saúde das câmeras">
      <ul className="divide-y divide-linha">
        {SAUDE.map(([c, e, ok]) => (
          <li key={c} className="flex items-center justify-between py-2.5">
            <span>{c}</span>
            <span className={`flex items-center gap-2 text-xs ${ok ? "text-cinza" : "text-white"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-white/35" : "bg-white"}`} />
              {e}
            </span>
          </li>
        ))}
      </ul>
    </Janela>
  );
}

export function MockChat() {
  return (
    <Janela titulo="Pergunte à AIP">
      <div className="flex flex-col gap-3">
        <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-white px-3.5 py-2.5 text-black">Qual foi o horário de maior movimento hoje?</p>
        <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-linha px-3.5 py-3">
          <p>O maior movimento foi às 18h, com 512 entradas.</p>
          <div className="mt-3 flex h-14 items-end gap-1">
            {[30, 42, 55, 48, 62, 100, 74, 40].map((b, i) => (
              <span key={i} className={`flex-1 rounded-t-sm ${b === 100 ? "bg-white" : "bg-white/30"}`} style={{ height: `${b}%` }} />
            ))}
          </div>
        </div>
        <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-white px-3.5 py-2.5 text-black">E as áreas menos utilizadas?</p>
        <div className="flex w-fit items-center gap-1 rounded-2xl border border-linha px-3.5 py-3">
          {[0, 0.4, 0.8].map((d) => (
            <span key={d} className="pulso h-1.5 w-1.5 rounded-full bg-white" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      </div>
    </Janela>
  );
}
