"use client";

import { useEffect, useRef } from "react";

// Assinatura visual da AIP: caixas de detecção com ID, trajetos e linha de
// contagem desenhados sobre a imagem. Dados simulados aqui mesmo, não vêm de
// nenhuma câmera nem do motor de visão.

type Pessoa = { id: number; x: number; y: number; vx: number; vy: number; fase: number; rastro: [number, number][] };

function sorteador(semente: number) {
  return () => {
    semente = (semente + 0x6d2b79f5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function VisaoIA({ semente = 7, quantidade = 11 }: { semente?: number; quantidade?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const tela = canvas;
    const g = ctx;
    const acaso = sorteador(semente);
    const acento = getComputedStyle(document.documentElement).getPropertyValue("--aip-visao").trim() || "#5ce1e6";
    const fonte = getComputedStyle(document.body).fontFamily;
    let proximoId = 142;
    let contagem = 0;
    let largura = 0;
    let altura = 0;
    let retrato = false;

    // Região onde as pessoas aparecem: livre do texto do hero.
    const regiao = () => (retrato ? { x0: 0.05, x1: 0.95, y0: 0.12, y1: 0.46, linha: 0.3 } : { x0: 0.46, x1: 0.97, y0: 0.14, y1: 0.92, linha: 0.56 });

    function nova(meio = false): Pessoa {
      const r = regiao();
      const desce = acaso() > 0.5;
      const pessoa: Pessoa = {
        id: proximoId++,
        x: r.x0 + acaso() * (r.x1 - r.x0),
        y: meio ? r.y0 + acaso() * (r.y1 - r.y0) : desce ? r.y0 : r.y1,
        vx: (acaso() - 0.5) * 0.012,
        vy: (desce ? 1 : -1) * (0.016 + acaso() * 0.016),
        fase: acaso() * 6.28,
        rastro: [],
      };
      return pessoa;
    }

    function ajustar() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      largura = tela.clientWidth;
      altura = tela.clientHeight;
      retrato = altura > largura;
      tela.width = largura * dpr;
      tela.height = altura * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ajustar();

    let pessoas = Array.from({ length: retrato ? Math.ceil(quantidade * 0.6) : quantidade }, () => nova(true));

    function passo(dt: number) {
      const r = regiao();
      pessoas = pessoas.map((p) => {
        const yAntes = p.y;
        p.x += (p.vx + Math.sin(p.fase + p.y * 14) * 0.004) * dt;
        p.y += p.vy * dt;
        p.rastro.push([p.x, p.y]);
        if (p.rastro.length > 90) p.rastro.shift();
        if ((yAntes - r.linha) * (p.y - r.linha) < 0) contagem++;
        return p.y < r.y0 - 0.02 || p.y > r.y1 + 0.02 || p.x < r.x0 - 0.03 || p.x > r.x1 + 0.03 ? nova() : p;
      });
    }

    function desenhar() {
      const r = regiao();
      g.clearRect(0, 0, largura, altura);
      const xa = r.x0 * largura;
      const xb = r.x1 * largura;
      const yl = r.linha * altura;

      // Linha de contagem e contador
      g.strokeStyle = acento;
      g.lineWidth = 1.5;
      g.setLineDash([]);
      g.beginPath();
      g.moveTo(xa, yl);
      g.lineTo(xb, yl);
      g.stroke();
      g.fillStyle = acento;
      g.font = `600 ${retrato ? 11 : 12}px ${fonte}`;
      g.fillText(`LINHA DE CONTAGEM  ${String(contagem).padStart(4, "0")}`, xa, yl - 8);

      for (const p of pessoas) {
        const px = p.x * largura;
        const py = p.y * altura;
        const esc = Math.min(largura, altura * 1.6) / 1000;
        const h = (26 + p.y * 20) * esc + 10;
        const w = h * 0.46;

        if (p.rastro.length > 1) {
          g.beginPath();
          p.rastro.forEach(([x, y], i) => (i ? g.lineTo(x * largura, y * altura) : g.moveTo(x * largura, y * altura)));
          g.globalAlpha = 0.55;
          g.lineWidth = 1.25;
          g.strokeStyle = acento;
          g.stroke();
          g.globalAlpha = 1;
        }

        g.lineWidth = 1.25;
        g.strokeStyle = acento;
        g.strokeRect(px - w / 2, py - h, w, h);
        const rotulo = `ID ${p.id}`;
        g.font = `600 10px ${fonte}`;
        const lt = g.measureText(rotulo).width + 8;
        g.fillStyle = acento;
        g.fillRect(px - w / 2, py - h - 14, lt, 14);
        g.fillStyle = "#000";
        g.fillText(rotulo, px - w / 2 + 4, py - h - 3.5);
      }
    }

    // Movimento reduzido: um quadro parado, já com rastros e contagem.
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (let i = 0; i < 70; i++) passo(0.16);
    desenhar();

    const redimensionar = () => {
      ajustar();
      desenhar();
    };
    window.addEventListener("resize", redimensionar);
    if (reduzido) return () => window.removeEventListener("resize", redimensionar);

    let quadro = 0;
    let anterior = 0;
    let visivel = true;
    function laco(t: number) {
      if (visivel) {
        const dt = Math.min((t - anterior) / 1000, 0.05);
        anterior = t;
        passo(dt * 1.5);
        desenhar();
      }
      quadro = requestAnimationFrame(laco);
    }
    const obs = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
    });
    obs.observe(tela);
    quadro = requestAnimationFrame((t) => {
      anterior = t;
      laco(t);
    });
    return () => {
      cancelAnimationFrame(quadro);
      obs.disconnect();
      window.removeEventListener("resize", redimensionar);
    };
  }, [semente, quantidade]);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 -z-10 h-full w-full" />;
}
