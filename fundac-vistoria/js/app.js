import * as D from './dados.js';
import * as G from './geo.js';
import { kv, pontos as dbPontos, fotos as dbFotos, trajeto as dbTrajeto, pedirArmazenamentoPersistente } from './db.js';
import { exportarCSV, exportarJSON, exportarPNG, importarArquivo, compartilharOuBaixar } from './exportar.js';
import { baixarMapaOffline, contarTiles, urlTile, ATRIB_ESRI, ATRIB_MAPBOX } from './offline.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const agoraISO = () => new Date().toISOString();
const horaBR = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

// ------------------------------------------------------------------ estado
const E = {
  encaixe: D.ENCAIXE_INICIAL.map((c) => [...c]),
  conf: { pares: [] }, // conferência: [{ portao, gps: [lat, lng], acc, em }]
  T: { a: 1, b: 0, tx: 0, ty: 0 },
  erroMedio: null,
  vistoria: { iniciada: false, portao: '02', inicio: null },
  pontos: new Map(),
  camadas: { cameras: true, cones: true, outros: true, trajeto: true, planta: true, digital: true },
  opacidade: 0.8,
  ajustes: { provedor: 'esri', mapboxToken: '' },
  gps: { ultima: null, estado: 'aguardando', watch: null },
  heading: null,
  bussolaAtiva: false,
  seguir: false,
  selecionado: null,
  modo: null, // 'marcar-camera' | 'marcar-outro' | 'ajuste'
  trajeto: [],
  plantaUrl: D.PLANTA.arquivo,
};
const ouvintesGps = new Set();

// ------------------------------------------------------------------ planta <-> mapa
let Hplano = null, HplanoInv = null;
function recalcularPlano() {
  Hplano = G.homografia([[0, 0], [1, 0], [1, 1], [0, 1]], E.encaixe.map(G.projetar));
  HplanoInv = G.inversa(Hplano);
}
const planoParaLL = (uv) => G.desprojetar(G.aplicar(Hplano, uv));
const llParaPlano = (ll) => G.aplicar(HplanoInv, G.projetar(ll));
const posPortao = (n) => planoParaLL(D.PORTOES.find((g) => g.n === n).pos);

// ------------------------------------------------------------------ conferência (GPS -> planta)
function recalcularConferencia() {
  const src = E.conf.pares.map((p) => G.projetar(p.gps));
  const dst = E.conf.pares.map((p) => G.projetar(posPortao(p.portao)));
  E.T = G.semelhanca(src, dst);
  if (E.conf.pares.length >= 2) {
    const k = G.escalaMercator(D.CENTRO_FEIRA[0]);
    const erros = src.map((s, i) => Math.hypot(...G.aplicarSem(E.T, s).map((v, j) => v - dst[i][j])) / k);
    E.erroMedio = erros.reduce((a, b) => a + b, 0) / erros.length;
    E.conf.pares.forEach((p, i) => { p.erro = erros[i]; });
  } else {
    E.erroMedio = null;
    E.conf.pares.forEach((p) => { delete p.erro; });
  }
}
const corrigir = (ll) => G.desprojetar(G.aplicarSem(E.T, G.projetar(ll)));

/** Posição oficial do ponto: à mão / no mapa segue a planta; pelo GPS segue a conferência. */
function posPonto(p) {
  if (p.manual || p.origem === 'mapa') return planoParaLL(p.plano);
  return corrigir([p.gps.lat, p.gps.lng]);
}
const planoDoPonto = (p) => (p.manual || p.origem === 'mapa' ? p.plano : llParaPlano(posPonto(p)));

// ------------------------------------------------------------------ mapa
const map = L.map('mapa', { zoomControl: false, maxZoom: 22, minZoom: 14, zoomSnap: 0.5, wheelPxPerZoomLevel: 90, tap: false }).setView(D.CENTRO_FEIRA, 17);
map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
map.createPane('planta').style.zIndex = 350;
map.createPane('cones').style.zIndex = 420;
let camadaSat = null;
function montarSatelite() {
  if (camadaSat) map.removeLayer(camadaSat);
  const mb = E.ajustes.provedor === 'mapbox' && E.ajustes.mapboxToken;
  camadaSat = mb
    ? L.tileLayer(urlTile('mapbox', E.ajustes.mapboxToken), { tileSize: 512, zoomOffset: -1, maxNativeZoom: 20, maxZoom: 22, crossOrigin: 'anonymous', attribution: ATRIB_MAPBOX })
    : L.tileLayer(urlTile('esri'), { maxNativeZoom: 18, maxZoom: 22, crossOrigin: 'anonymous', attribution: ATRIB_ESRI });
  camadaSat.addTo(map);
}

const CamadaPlanta = L.Layer.extend({
  onAdd(m) {
    this._img = L.DomUtil.create('img', 'planta-img leaflet-zoom-hide');
    this._img.alt = '';
    this._img.width = D.PLANTA.largura;
    this._img.height = D.PLANTA.altura;
    this._img.onerror = () => avisoPlantaFaltando();
    this._img.src = E.plantaUrl;
    m.getPane('planta').appendChild(this._img);
    m.on('zoomend viewreset', this.atualizar, this);
    this.atualizar();
  },
  onRemove(m) {
    this._img.remove();
    m.off('zoomend viewreset', this.atualizar, this);
  },
  atualizar() {
    if (!this._img) return;
    const pts = E.encaixe.map((c) => { const p = map.latLngToLayerPoint(c); return [p.x, p.y]; });
    const W = D.PLANTA.largura, H = D.PLANTA.altura;
    this._img.style.transform = G.matrix3d(G.homografia([[0, 0], [W, 0], [W, H], [0, H]], pts));
    this._img.style.opacity = E.opacidade;
  },
  trocarImagem(url) { if (this._img) this._img.src = url; },
});
const camadaPlanta = new CamadaPlanta();
const grupoDigital = L.layerGroup();
const grupoPontos = L.layerGroup();
const grupoOutros = L.layerGroup();
const grupoCones = L.layerGroup();
const linhaTrajeto = L.polyline([], { color: '#5fd3ff', weight: 4, opacity: 0.85, dashArray: '2 8', lineCap: 'round', interactive: false });
const circuloPrecisao = L.circle(D.CENTRO_FEIRA, { radius: 1, color: '#3b9bff', weight: 1, fillColor: '#3b9bff', fillOpacity: 0.12, interactive: false });
const marcadorEu = L.marker(D.CENTRO_FEIRA, { interactive: false, keyboard: false, zIndexOffset: 2000, icon: L.divIcon({ className: '', iconSize: null, html: '<div class="eu"><div class="seta" hidden><svg width="44" height="50" viewBox="0 0 44 50"><path d="M22 4 L36 40 Q22 30 8 40 Z" fill="#3b9bff" fill-opacity="0.45" stroke="#fff" stroke-width="1.5"/></svg></div><div class="ponto"></div></div>' }) });

function aplicarZoomClasse() {
  const z = map.getZoom();
  const c = map.getContainer();
  c.classList.toggle('zoom-medio', z >= 17);
  c.classList.toggle('zoom-perto', z >= 18);
  c.classList.toggle('zoom-muito-perto', z >= 19);
}
map.on('zoomend', aplicarZoomClasse);
const estilo = document.createElement('style');
estilo.textContent = `
  #mapa:not(.zoom-perto) .rotulo.rua, #mapa:not(.zoom-perto) .rotulo.vmarco, #mapa:not(.zoom-perto) .pino .cod { display: none; }
  #mapa:not(.zoom-medio) .rotulo.area, #mapa:not(.zoom-medio) .portao:not(.inicio) b { display: none; }
  #mapa:not(.zoom-muito-perto) .portao:not(.inicio) b { font-size: 12px; }
`;
document.head.appendChild(estilo);

function montarDigital() {
  grupoDigital.clearLayers();
  const div = (html, ll, z = 0) => L.marker(ll, { icon: L.divIcon({ className: '', iconSize: null, html }), interactive: false, keyboard: false, zIndexOffset: z }).addTo(grupoDigital);
  for (const r of [...D.ROTULOS, ...D.RUAS]) div(`<div class="rotulo ${r.c}">${esc(r.t)}</div>`, planoParaLL(r.pos));
  for (const g of D.PORTOES) {
    const nome = g.inicio ? `Portão ${g.n} · Entrada / Início` : `Portão ${g.n}`;
    const m = L.marker(planoParaLL(g.pos), { icon: L.divIcon({ className: '', iconSize: null, html: `<div class="portao ${g.inicio ? 'inicio' : ''} ${g.aprox ? 'aprox' : ''}"><i></i><b>${nome}</b></div>` }), zIndexOffset: 500, keyboard: false });
    m.on('click', () => { if (!E.modo) telaPortao(g.n); });
    m.addTo(grupoDigital);
  }
}

// ------------------------------------------------------------------ pontos no mapa
const marcadores = new Map(); // id -> { m, cone }
function corPino(p) {
  if (p.grupo === 'Nova sugerida') return D.COR_NOVA;
  return (D.SITUACOES.find((s) => s.id === p.situacao) || D.SITUACOES[3]).cor;
}
const bordaGrupo = (g) => (D.GRUPOS.find((x) => x.id === g) || D.GRUPOS[0]).borda;

function iconePonto(p) {
  if (p.tipo === 'camera') {
    return L.divIcon({ className: '', iconSize: null, html: `<div class="pino ${E.selecionado === p.id ? 'selecionado' : ''}" style="background:${corPino(p)};border-color:${bordaGrupo(p.grupo)}"><span class="cod">${esc(p.codigo)}</span></div>` });
  }
  const o = D.OUTROS.find((x) => x.id === p.categoria) || D.OUTROS[0];
  return L.divIcon({ className: '', iconSize: null, html: `<div class="marco" style="background:${o.cor};${E.selecionado === p.id ? 'box-shadow:0 0 0 3px #5fd3ff,0 0 16px #5fd3ff' : ''}">${o.icone}</div>` });
}

function conePontos(p, pos) {
  const ab = (D.ABERTURAS.find((a) => a.id === p.abertura) || D.ABERTURAS[1]).graus;
  const r = Math.max(2, Number(p.alcance) || 25);
  const pts = [pos];
  for (let a = p.direcao - ab / 2; a <= p.direcao + ab / 2 + 0.01; a += Math.max(2, ab / 16)) pts.push(G.destino(pos, a, r));
  return pts;
}

function desenharPonto(p) {
  const antigo = marcadores.get(p.id);
  if (antigo) { antigo.m.remove(); antigo.cone?.remove(); }
  const pos = posPonto(p);
  const grupo = p.tipo === 'camera' ? grupoPontos : grupoOutros;
  const m = L.marker(pos, { icon: iconePonto(p), draggable: E.selecionado === p.id, zIndexOffset: E.selecionado === p.id ? 1500 : 1000, autoPan: true });
  m.on('click', () => { if (!E.modo) abrirFicha(p.id); });
  m.on('dragend', () => {
    const ll = m.getLatLng();
    p.manual = true;
    p.plano = llParaPlano([ll.lat, ll.lng]);
    p.ajustadoEm = agoraISO();
    salvarPonto(p);
    toast('Posição ajustada à mão. Ela não muda mais com a conferência.');
  });
  m.addTo(grupo);
  let cone = null;
  if (p.tipo === 'camera' && p.direcao != null) {
    cone = L.polygon(conePontos(p, pos), { pane: 'cones', color: corPino(p), weight: 1.5, fillColor: corPino(p), fillOpacity: 0.22, interactive: false });
    cone.addTo(grupoCones);
  }
  marcadores.set(p.id, { m, cone });
}
function redesenharTudo() {
  for (const p of E.pontos.values()) desenharPonto(p);
  desenharTrajeto();
}
function removerMarcador(id) {
  const x = marcadores.get(id);
  if (x) { x.m.remove(); x.cone?.remove(); marcadores.delete(id); }
}

async function salvarPonto(p) {
  p.atualizadoEm = agoraISO();
  E._naoExportado = true;
  E.pontos.set(p.id, p);
  desenharPonto(p);
  await dbPontos.salvar(p);
}

function aplicarCamadas() {
  const c = E.camadas;
  const tog = (layer, on) => (on ? layer.addTo(map) : map.removeLayer(layer));
  tog(camadaPlanta, c.planta);
  tog(grupoDigital, c.digital);
  tog(grupoPontos, c.cameras);
  tog(grupoCones, c.cones && c.cameras);
  tog(grupoOutros, c.outros);
  tog(linhaTrajeto, c.trajeto);
}

// ------------------------------------------------------------------ GPS
function iniciarGps() {
  if (!('geolocation' in navigator)) { E.gps.estado = 'indisponivel'; atualizarChipGps(); return; }
  if (E.gps.watch != null) return;
  E.gps.watch = navigator.geolocation.watchPosition(aoPosicionar, aoErroGps, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
  setTimeout(() => { if (!E.gps.ultima && E.gps.estado === 'aguardando') { E.gps.estado = 'sem-sinal'; atualizarChipGps(); } }, 20000);
}
function aoErroGps(e) {
  if (e.code === 1) E.gps.estado = 'negado';
  else if (e.code === 2) E.gps.estado = 'indisponivel';
  else if (!E.gps.ultima) E.gps.estado = 'sem-sinal';
  if (e.code === 1 && E.gps.watch != null) { navigator.geolocation.clearWatch(E.gps.watch); E.gps.watch = null; }
  atualizarChipGps();
}
let ultimoTrajeto = null;
function aoPosicionar(pos) {
  const c = pos.coords;
  const s = { lat: c.latitude, lng: c.longitude, acc: c.accuracy, t: pos.timestamp || Date.now(), heading: c.heading, speed: c.speed };
  E.gps.ultima = s;
  E.gps.estado = 'ok';
  ouvintesGps.forEach((f) => f(s));
  const ll = corrigir([s.lat, s.lng]);
  marcadorEu.setLatLng(ll);
  circuloPrecisao.setLatLng(ll).setRadius(s.acc);
  if (!map.hasLayer(marcadorEu)) { circuloPrecisao.addTo(map); marcadorEu.addTo(map); }
  if (E.seguir) map.panTo(ll, { animate: true });
  if (E.bussolaAtiva === false && s.heading != null && !Number.isNaN(s.heading) && s.speed > 0.8) girarSeta(s.heading);
  atualizarChipGps();
  if (E.vistoria.iniciada && s.acc <= 30) {
    const ult = ultimoTrajeto;
    if (!ult || G.distancia([ult.lat, ult.lng], [s.lat, s.lng]) >= 3 || s.t - ult.t > 20000) {
      const pt = { lat: s.lat, lng: s.lng, acc: s.acc, t: s.t };
      ultimoTrajeto = pt;
      E.trajeto.push(pt);
      dbTrajeto.add(pt);
      linhaTrajeto.addLatLng(corrigir([pt.lat, pt.lng]));
    }
  }
}
function desenharTrajeto() {
  linhaTrajeto.setLatLngs(E.trajeto.map((p) => corrigir([p.lat, p.lng])));
}
function atualizarChipGps() {
  const chip = $('#chipGps');
  const av = $('#aviso');
  chip.className = 'chip-gps';
  av.hidden = true;
  av.className = 'aviso';
  const s = E.gps.ultima;
  if (E.gps.estado === 'negado') {
    chip.textContent = 'GPS bloqueado'; chip.classList.add('ruim');
    av.innerHTML = 'Localização bloqueada. Libere o acesso à localização para este site nas configurações do navegador. <button type="button" data-a="gps-de-novo">Tentar de novo</button>';
    av.hidden = false;
  } else if (E.gps.estado === 'indisponivel') {
    chip.textContent = 'GPS desligado'; chip.classList.add('ruim');
    av.innerHTML = 'GPS desligado ou indisponível. Ligue a localização do celular. <button type="button" data-a="gps-de-novo">Tentar de novo</button>';
    av.hidden = false;
  } else if (E.gps.estado === 'sem-sinal' && !s) {
    chip.textContent = 'Sem sinal'; chip.classList.add('ruim');
    av.classList.add('amarelo'); av.innerHTML = 'Ainda sem sinal de GPS. Vá para um lugar mais aberto ou marque as câmeras no mapa.'; av.hidden = false;
  } else if (!s) {
    chip.textContent = E.gps.watch == null ? 'Ligar GPS' : 'GPS…';
  } else {
    const acc = Math.round(s.acc);
    chip.textContent = `GPS ±${acc} m`;
    chip.classList.add(acc <= 10 ? 'bom' : acc <= 25 ? 'medio' : 'ruim');
    if (acc > 25) { av.classList.add('amarelo'); av.innerHTML = `GPS fraco (±${acc} m). Prefira "Marcar no mapa" até o sinal melhorar.`; av.hidden = false; }
  }
}
$('#aviso').addEventListener('click', (e) => {
  const b = e.target.closest('[data-a]');
  if (!b) return;
  if (b.dataset.a === 'gps-de-novo') { E.gps.estado = 'aguardando'; E.gps.watch = null; iniciarGps(); atualizarChipGps(); }
  if (b.dataset.a === 'carregar-planta') $('#inputPlanta').click();
});

/** Mede a posição por `segundos`, com média ponderada pela precisão. */
function medirGps(segundos, aoProgresso) {
  return new Promise((ok) => {
    const amostras = [];
    if (E.gps.ultima && Date.now() - E.gps.ultima.t < 3000) amostras.push(E.gps.ultima);
    const f = (s) => amostras.push(s);
    ouvintesGps.add(f);
    const t0 = Date.now();
    const id = setInterval(() => {
      const passou = (Date.now() - t0) / 1000;
      aoProgresso?.(Math.min(1, passou / segundos), amostras.length ? G.mediaGps(amostras) : null);
      if (passou >= segundos) {
        clearInterval(id);
        ouvintesGps.delete(f);
        if (!amostras.length && E.gps.ultima && Date.now() - E.gps.ultima.t < 15000) amostras.push(E.gps.ultima);
        ok(amostras.length ? G.mediaGps(amostras) : null);
      }
    }, 250);
  });
}

// ------------------------------------------------------------------ bússola
function girarSeta(graus) {
  E.heading = graus;
  const el = marcadorEu.getElement()?.querySelector('.seta');
  if (el) { el.hidden = false; el.style.transform = `rotate(${graus}deg)`; }
  const g = document.querySelector('[data-heading]');
  if (g) g.textContent = `${Math.round(graus)}°`;
}
let suave = null;
function aoOrientar(e) {
  let h = null;
  if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
  else if (e.absolute && e.alpha != null) h = 360 - e.alpha;
  if (h == null || Number.isNaN(h)) return;
  const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
  h = (h + ang + 360) % 360;
  if (suave == null) suave = h;
  else { let d = h - suave; if (d > 180) d -= 360; if (d < -180) d += 360; suave = (suave + d * 0.3 + 360) % 360; }
  girarSeta(suave);
}
async function ativarBussola() {
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const r = await DeviceOrientationEvent.requestPermission();
      if (r !== 'granted') { toast('Sem permissão para a bússola. Use a seta na ficha para indicar a direção.'); return false; }
    }
    if ('ondeviceorientationabsolute' in window) window.addEventListener('deviceorientationabsolute', aoOrientar);
    else window.addEventListener('deviceorientation', aoOrientar);
    E.bussolaAtiva = true;
    $('#btnBussola').setAttribute('aria-pressed', 'true');
    setTimeout(() => { if (E.heading == null) toast('A bússola não respondeu. Neste aparelho, indique a direção girando a seta na ficha.'); }, 2500);
    return true;
  } catch {
    toast('Bússola indisponível neste aparelho.');
    return false;
  }
}

// ------------------------------------------------------------------ tela ligada
let travaTela = null;
async function manterTelaLigada() {
  try { if ('wakeLock' in navigator && !travaTela) { travaTela = await navigator.wakeLock.request('screen'); travaTela.addEventListener('release', () => { travaTela = null; }); } } catch { /* sem suporte */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && E.vistoria.iniciada) manterTelaLigada(); });

// ------------------------------------------------------------------ folha (telas)
const folha = $('#folha'), conteudo = $('#folhaConteudo');
let aoFecharFolha = null;
function abrirFolha(html, { cheia = false, aoFechar = null } = {}) {
  conteudo.innerHTML = html;
  folha.classList.toggle('cheia', cheia);
  folha.hidden = false;
  aoFecharFolha = aoFechar;
}
function fecharFolha() {
  folha.hidden = true;
  conteudo.innerHTML = '';
  const f = aoFecharFolha; aoFecharFolha = null;
  f?.();
}
const cabeca = (titulo, sub = '') => `<div class="cabeca"><div><h2>${titulo}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}</div><button class="fechar" type="button" data-acao="fechar" aria-label="Fechar"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button></div>`;
const acoesFolha = {};
conteudo.addEventListener('click', (e) => {
  const b = e.target.closest('[data-acao]');
  if (!b || b.disabled) return;
  const f = acoesFolha[b.dataset.acao];
  if (f) f(b, e);
});
acoesFolha.fechar = () => fecharFolha();

let toastId = null;
function toast(msg, ms = 3200) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastId);
  toastId = setTimeout(() => { t.hidden = true; }, ms);
}

// ------------------------------------------------------------------ início da vistoria
function telaInicio() {
  const v = E.vistoria;
  const opc = D.PORTOES.map((g) => `<button class="opc" type="button" data-acao="escolher-portao-inicio" data-n="${g.n}" aria-pressed="${v.portao === g.n}">${g.n}</button>`).join('');
  abrirFolha(`${cabeca(v.iniciada ? 'Vistoria em andamento' : 'Vistoria das câmeras', v.iniciada ? `Iniciada em ${horaBR(v.inicio)} no Portão ${v.portao}` : 'Feira da Sulanca · Setor Fundac')}
    <p>Entre pela Rua Rui Limeira Rosal, no Portão 02. Parado no portão, aperte o botão abaixo: o app mede o GPS por 10 segundos e confere sua posição com a planta.</p>
    <div class="campo"><span class="rot">Ponto de partida</span><div class="opcs grade6">${opc}</div></div>
    <div class="btns">
      <button class="btn principal" type="button" data-acao="iniciar">Iniciar vistoria no Portão ${v.portao}</button>
      <button class="btn" type="button" data-acao="ajustar-planta">Ajustar planta no satélite</button>
      <button class="btn" type="button" data-acao="tela-offline">Baixar mapa para usar sem internet</button>
      ${v.iniciada ? '<button class="btn" type="button" data-acao="fechar">Continuar a vistoria</button>' : ''}
    </div>
    <p class="nota">Tudo fica guardado só neste celular, salvo a cada alteração. No fim, exporte o arquivo pelo menu.</p>`);
}
acoesFolha['escolher-portao-inicio'] = (b) => { E.vistoria.portao = b.dataset.n; kv.set('vistoria', E.vistoria); telaInicio(); };
acoesFolha.iniciar = async () => {
  if (!(await garantirGps())) return;
  const n = E.vistoria.portao;
  const res = await telaMedicao(`Medindo no Portão ${n}`, 'Fique parado no portão, com o celular na mão.', 10);
  if (!res) { abrirFolha(`${cabeca('Sem sinal de GPS')}<p>Não foi possível medir a posição. Você pode começar mesmo assim e marcar as câmeras tocando no mapa.</p><div class="btns"><button class="btn principal" type="button" data-acao="comecar-sem">Começar sem conferir</button><button class="btn" type="button" data-acao="iniciar">Tentar de novo</button></div>`); return; }
  mostrarResultadoInicio(n, res);
};
function mostrarResultadoInicio(n, res) {
  const alvo = posPortao(n);
  const dist = G.distancia([res.lat, res.lng], alvo);
  const longe = dist > Math.max(8, res.acc);
  E._medidaInicio = { n, res };
  abrirFolha(`${cabeca(`Portão ${n}`, 'Resultado da medição')}
    <div class="res">
      <div class="num"><b>±${Math.round(res.acc)} m</b><span>precisão do GPS</span></div>
      <div class="num"><b>${dist < 1000 ? Math.round(dist) : '>999'} m</b><span>entre você e o Portão ${n} no mapa</span></div>
    </div>
    <p>${longe ? 'A diferença é grande. Se você está mesmo no portão, toque em "Corrigir aqui": o app desloca o GPS para bater com a planta a partir deste portão.' : 'A posição bate com a planta. Pode seguir sem corrigir, ou corrigir mesmo assim para afinar.'}</p>
    <div class="btns">
      <button class="btn principal" type="button" data-acao="corrigir-inicio">Corrigir aqui</button>
      <button class="btn" type="button" data-acao="comecar-sem">Seguir sem corrigir</button>
    </div>`);
  map.setView(alvo, 19);
}
acoesFolha['corrigir-inicio'] = async () => {
  const { n, res } = E._medidaInicio;
  E.conf.pares = [{ portao: n, gps: [res.lat, res.lng], acc: res.acc, em: agoraISO() }];
  await salvarConferencia();
  await comecarVistoria();
  toast(`Conferido no Portão ${n}. Posição corrigida.`);
};
acoesFolha['comecar-sem'] = () => comecarVistoria();
async function comecarVistoria() {
  if (!E.vistoria.iniciada) { E.vistoria.iniciada = true; E.vistoria.inicio = agoraISO(); }
  await kv.set('vistoria', E.vistoria);
  manterTelaLigada();
  ligarSeguir(true);
  fecharFolha();
}

function telaMedicao(titulo, texto, segundos) {
  return new Promise((ok) => {
    let cancelado = false;
    abrirFolha(`${cabeca(titulo)}<p>${texto}</p><div class="medidor"><div class="grande" data-m="prec">…</div><span class="sub">precisão</span><div class="barra"><i data-m="barra"></i></div><span class="sub" data-m="resto">${segundos} s</span></div><div class="btns"><button class="btn" type="button" data-acao="cancelar-medicao">Cancelar</button></div>`);
    acoesFolha['cancelar-medicao'] = () => { cancelado = true; fecharFolha(); ok(null); };
    medirGps(segundos, (f, m) => {
      const b = conteudo.querySelector('[data-m="barra"]');
      if (!b) return;
      b.style.width = `${Math.round(f * 100)}%`;
      conteudo.querySelector('[data-m="resto"]').textContent = `${Math.max(0, Math.ceil(segundos * (1 - f)))} s · ${m ? m.n : 0} leituras`;
      if (m) conteudo.querySelector('[data-m="prec"]').textContent = `±${Math.round(m.acc)} m`;
    }).then((m) => { if (!cancelado) ok(m); });
  });
}

async function garantirGps() {
  if (E.gps.estado === 'ok' && E.gps.ultima) return true;
  if (E.gps.estado === 'negado') { toast('Localização bloqueada. Libere nas configurações do navegador.'); return false; }
  return new Promise((ok) => {
    abrirFolha(`${cabeca('Usar sua localização')}<p>O app usa o GPS do celular para mostrar onde você está na feira e marcar cada câmera no lugar certo. A localização fica só neste aparelho.</p><div class="btns"><button class="btn principal" type="button" data-acao="permitir-gps">Permitir localização</button><button class="btn" type="button" data-acao="fechar">Agora não</button></div>`, { aoFechar: () => ok(false) });
    acoesFolha['permitir-gps'] = () => {
      iniciarGps();
      conteudo.innerHTML = `${cabeca('Procurando o sinal')}<div class="medidor"><div class="grande">GPS</div><p class="sub">Se o navegador perguntar, toque em "Permitir".</p></div>`;
      const t0 = Date.now();
      const id = setInterval(() => {
        if (E.gps.ultima) { clearInterval(id); aoFecharFolha = null; ok(true); }
        else if (E.gps.estado === 'negado' || E.gps.estado === 'indisponivel' || Date.now() - t0 > 25000) { clearInterval(id); aoFecharFolha = null; fecharFolha(); toast('Sem sinal de GPS. Marque as câmeras no mapa.'); ok(false); }
      }, 300);
    };
  });
}

// ------------------------------------------------------------------ conferência nos portões
function telaPortao(nSel) {
  const pares = new Map(E.conf.pares.map((p) => [p.portao, p]));
  const n = nSel || E._portaoSel || '02';
  E._portaoSel = n;
  const opc = D.PORTOES.map((g) => `<button class="opc ${pares.has(g.n) ? 'conferido' : ''}" type="button" data-acao="sel-portao" data-n="${g.n}" aria-pressed="${g.n === n}">${g.n}</button>`).join('');
  const lista = E.conf.pares.map((p) => `<tr><td>Portão ${p.portao}</td><td>±${Math.round(p.acc)} m</td><td>${p.erro != null ? `${p.erro.toFixed(1).replace('.', ',')} m` : '—'}</td></tr>`).join('');
  const d = G.descreverSem(E.T);
  const g = D.PORTOES.find((x) => x.n === n);
  abrirFolha(`${cabeca('Conferência nos portões', 'Ao passar por um portão, pare nele e confira.')}
    <div class="campo"><span class="rot">Em qual portão você está?</span><div class="opcs grade6">${opc}</div>${g.aprox ? '<p class="dica">O Portão 03 não tem rótulo legível na planta: a posição dele é aproximada. Prefira conferir nos outros.</p>' : ''}</div>
    <div class="btns"><button class="btn principal" type="button" data-acao="medir-portao">Estou no Portão ${n}</button></div>
    <h3>Portões conferidos (${E.conf.pares.length})</h3>
    ${E.conf.pares.length ? `<table class="tabela"><tr><th>Portão</th><th>Precisão</th><th>Erro</th></tr>${lista}</table>
      <p class="sub">${E.conf.pares.length >= 2 ? `Ajuste calculado: erro médio de ${E.erroMedio.toFixed(1).replace('.', ',')} m · giro ${d.giro.toFixed(1).replace('.', ',')}° · escala ${(d.escala * 100).toFixed(1).replace('.', ',')}%${E.conf.pares.length === 2 ? '. Com 2 portões o ajuste é exato (erro 0); a partir do 3º o erro médio mostra a qualidade.' : ''}` : 'Com 1 portão, o ajuste é só de deslocamento. Confira mais um para calcular escala e giro.'}</p>
      ${E.conf.pares.length >= 2 && (Math.abs(d.escala - 1) > 0.05 || Math.abs(d.giro) > 4) ? '<p style="color:var(--alerta);font-weight:600">A escala ou o giro saíram fora do normal: provavelmente uma das leituras foi feita longe do portão ou com GPS ruim. Refaça a última.</p>' : ''}` : '<p class="vazio">Nenhum portão conferido ainda.</p>'}
    <div class="btns dois">
      <button class="btn" type="button" data-acao="desfazer-conf" ${E.conf.pares.length ? '' : 'disabled'}>Refazer o último</button>
      <button class="btn perigo" type="button" data-acao="zerar-conf" ${E.conf.pares.length ? '' : 'disabled'}>Zerar conferência</button>
    </div>`);
}
acoesFolha['sel-portao'] = (b) => telaPortao(b.dataset.n);
acoesFolha['medir-portao'] = async () => {
  if (!(await garantirGps())) return;
  const n = E._portaoSel;
  const res = await telaMedicao(`Portão ${n}`, 'Fique parado no portão por alguns segundos.', 8);
  if (!res) { telaPortao(n); toast('Sem leitura de GPS.'); return; }
  E.conf.pares = E.conf.pares.filter((p) => p.portao !== n);
  E.conf.pares.push({ portao: n, gps: [res.lat, res.lng], acc: res.acc, em: agoraISO() });
  await salvarConferencia();
  telaPortao(n);
  toast(E.conf.pares.length >= 2 ? `Portão ${n} conferido. Erro médio: ${E.erroMedio.toFixed(1).replace('.', ',')} m.` : `Portão ${n} conferido.`);
};
acoesFolha['desfazer-conf'] = async () => { E.conf.pares.pop(); await salvarConferencia(); telaPortao(); };
acoesFolha['zerar-conf'] = async () => {
  if (!confirm('Zerar a conferência? O GPS volta a ser usado sem ajuste.')) return;
  E.conf.pares = []; await salvarConferencia(); telaPortao();
};
async function salvarConferencia() {
  recalcularConferencia();
  await kv.set('conferencia', E.conf);
  redesenharTudo();
  if (E.gps.ultima) aoPosicionar({ coords: { latitude: E.gps.ultima.lat, longitude: E.gps.ultima.lng, accuracy: E.gps.ultima.acc, heading: null, speed: null }, timestamp: E.gps.ultima.t });
}

// ------------------------------------------------------------------ marcar
function sugerirLocal(pos) {
  let melhor = null, dm = 1e9;
  for (const g of D.PORTOES) { const d = G.distancia(pos, posPortao(g.n)); if (d < dm) { dm = d; melhor = g; } }
  if (dm <= 30) return { local: `Portão ${melhor.n}` };
  const [u, v] = llParaPlano(pos);
  if (u > 0.1 && u < 0.86 && v > 0.08 && v < 0.86) return { local: `Quadra ${D.quadraPorU(u)}`, rua: D.ruaPorU(u) };
  return { local: 'Outro' };
}
function prefixo(p) {
  if (p.grupo === 'Feirante') return 'FEI';
  if (p.grupo === 'Nova sugerida') return 'NOVA';
  if (p.grupo === 'Escritório') return 'ESC';
  const l = p.local || '';
  if (l.startsWith('Portão ')) return `P${l.slice(7)}`;
  return ({ Paraguai: 'PAR', 'Praça de alimentação 1': 'PRA1', 'Praça de alimentação 2': 'PRA2', Camelódromo: 'CAM', ADM: 'ADM', 'Comando Presente': 'CPR', Escritório: 'ESC' })[l]
    || (l.startsWith('Quadra ') ? `Q${l.slice(7)}${p.rua ? String(p.rua).padStart(2, '0') : ''}` : 'OUT');
}
function sugerirCodigo(p) {
  const pre = prefixo(p);
  const usados = new Set([...E.pontos.values()].filter((x) => x.id !== p.id && x.tipo === 'camera').map((x) => x.codigo));
  if (/^P\d\d$/.test(pre)) {
    for (const l of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') if (!usados.has(`${pre}-${l}`)) return `${pre}-${l}`;
  }
  for (let i = 1; i < 999; i++) { const c = `${pre}-${String(i).padStart(2, '0')}`; if (!usados.has(c)) return c; }
  return `${pre}-${Date.now() % 1000}`;
}

async function criarCamera(origem, ll, gps) {
  const sug = sugerirLocal(ll);
  const p = {
    id: novoId(), tipo: 'camera', origem, criadoEm: agoraISO(), atualizadoEm: agoraISO(),
    gps: gps || null, plano: origem === 'mapa' ? llParaPlano(ll) : null, manual: false,
    grupo: 'PV', local: sug.local, rua: sug.rua || null, situacao: 'não sei', tipoCam: 'não sei',
    direcao: null, abertura: 'media', alcance: 25, altura: null, rosto: 'não sei', cobre: [], prioridadeIA: null,
    fotos: [], obs: '', codigo: '', codigoManual: false,
  };
  p.codigo = sugerirCodigo(p);
  await salvarPonto(p);
  abrirFicha(p.id);
}
async function criarOutro(origem, ll, gps) {
  const p = { id: novoId(), tipo: 'ponto', origem, criadoEm: agoraISO(), atualizadoEm: agoraISO(), gps: gps || null, plano: origem === 'mapa' ? llParaPlano(ll) : null, manual: false, categoria: null, fotos: [], obs: '' };
  await salvarPonto(p);
  abrirFicha(p.id);
}

async function marcarPeloGps(tipo) {
  if (!(await garantirGps())) return;
  const res = await telaMedicao('Marcando pela sua posição', 'Fique parado embaixo da câmera por 5 segundos.', 5);
  if (!res) { toast('Sem leitura de GPS. Marque no mapa.'); return; }
  const gps = { lat: res.lat, lng: res.lng, acc: res.acc, n: res.n };
  const criar = () => (tipo === 'camera' ? criarCamera('gps', corrigir([res.lat, res.lng]), gps) : criarOutro('gps', corrigir([res.lat, res.lng]), gps));
  if (res.acc > 15) {
    abrirFolha(`${cabeca('GPS impreciso')}<p>A precisão agora é de ±${Math.round(res.acc)} m (pior que 15 m). Para ficar no lugar certo, marque tocando no mapa.</p><div class="btns"><button class="btn principal" type="button" data-acao="ir-marcar-mapa">Marcar no mapa</button><button class="btn" type="button" data-acao="usar-assim">Usar assim mesmo</button></div>`);
    acoesFolha['ir-marcar-mapa'] = () => { fecharFolha(); entrarModoMarcar(tipo); };
    acoesFolha['usar-assim'] = () => { fecharFolha(); criar(); };
    return;
  }
  fecharFolha();
  criar();
}

function entrarModoMarcar(tipo) {
  E.modo = tipo === 'camera' ? 'marcar-camera' : 'marcar-outro';
  const b = $('#modoMapa');
  b.innerHTML = `<span>Toque no lugar exato ${tipo === 'camera' ? 'da câmera' : 'do ponto'}</span><button type="button" id="cancelarModo">Cancelar</button>`;
  b.hidden = false;
  $('#cancelarModo').onclick = sairModo;
  map.getContainer().style.cursor = 'crosshair';
  map.getContainer().classList.add('marcando');
}
function sairModo() {
  E.modo = null;
  $('#modoMapa').hidden = true;
  map.getContainer().style.cursor = '';
  map.getContainer().classList.remove('marcando');
}
map.on('click', (e) => {
  if (E.modo === 'marcar-camera' || E.modo === 'marcar-outro') {
    const ll = [e.latlng.lat, e.latlng.lng];
    const t = E.modo;
    sairModo();
    if (t === 'marcar-camera') criarCamera('mapa', ll); else criarOutro('mapa', ll);
  }
});

// ------------------------------------------------------------------ fichas
function selecionar(id) {
  const ant = E.selecionado;
  E.selecionado = id;
  if (ant && E.pontos.has(ant)) desenharPonto(E.pontos.get(ant));
  if (id && E.pontos.has(id)) desenharPonto(E.pontos.get(id));
}
function abrirFicha(id) {
  const p = E.pontos.get(id);
  if (!p) return;
  selecionar(id);
  if (p.tipo === 'camera') renderFichaCamera(p); else renderFichaOutro(p);
}
const opcs = (campo, lista, valor, extra = (x) => '') => `<div class="opcs">${lista.map((x) => {
  const id = typeof x === 'string' ? x : x.id, nome = typeof x === 'string' ? x : x.nome;
  const sel = Array.isArray(valor) ? valor.includes(id) : valor === id;
  return `<button class="opc ${extra(x)}" type="button" data-acao="campo" data-campo="${campo}" data-valor="${esc(id)}" aria-pressed="${sel}">${esc(nome[0].toUpperCase() + nome.slice(1))}</button>`;
}).join('')}</div>`;

function blocoFotos(p) {
  const slots = [0, 1, 2].map((i) => {
    const fid = p.fotos[i];
    if (fid) return `<div class="foto" data-foto="${fid}"><img alt="Foto ${i + 1}"><button class="tirar" type="button" data-acao="apagar-foto" data-foto="${fid}" aria-label="Apagar foto">×</button></div>`;
    return `<button class="foto" type="button" data-acao="tirar-foto">${i === p.fotos.length ? 'Tirar foto' : ''}</button>`;
  }).join('');
  return `<div class="campo"><span class="rot">Fotos (até 3)</span><div class="fotos">${slots}</div><p class="dica">Da câmera e do que ela vê. A foto é reduzida antes de guardar.</p></div>`;
}
async function preencherFotos() {
  for (const el of conteudo.querySelectorAll('.foto[data-foto]')) {
    const f = await dbFotos.pegar(el.dataset.foto);
    const img = el.querySelector('img');
    if (f && img) { const u = URL.createObjectURL(f.blob); img.src = u; img.onload = () => URL.revokeObjectURL(u); }
  }
}

function svgDial(p) {
  const ab = (D.ABERTURAS.find((a) => a.id === p.abertura) || D.ABERTURAS[1]).graus;
  const d = p.direcao ?? 0;
  const r = 62, c = 75;
  const pt = (a, rr) => [c + rr * Math.sin((a * Math.PI) / 180), c - rr * Math.cos((a * Math.PI) / 180)];
  const [x1, y1] = pt(d - ab / 2, r), [x2, y2] = pt(d + ab / 2, r), [xa, ya] = pt(d, r - 6);
  return `<svg class="dial" viewBox="0 0 150 150" data-dial>
    <circle cx="75" cy="75" r="70" fill="#050505" stroke="#444" stroke-width="2"/>
    ${['N', 'L', 'S', 'O'].map((t, i) => { const [x, y] = pt(i * 90, 58); return `<text x="${x}" y="${y + 5}" text-anchor="middle" fill="${i ? '#888' : '#5fd3ff'}" font-size="14" font-weight="700" font-family="Barlow Condensed">${t}</text>`; }).join('')}
    ${p.direcao != null ? `<path d="M75 75 L${x1} ${y1} A${r} ${r} 0 ${ab > 180 ? 1 : 0} 1 ${x2} ${y2} Z" fill="#5fd3ff" fill-opacity=".25" stroke="#5fd3ff" stroke-width="1.5"/><line x1="75" y1="75" x2="${xa}" y2="${ya}" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` : '<text x="75" y="80" text-anchor="middle" fill="#888" font-size="13" font-family="Barlow">gire com o dedo</text>'}
    <circle cx="75" cy="75" r="7" fill="#fff"/>
  </svg>`;
}

function renderFichaCamera(p, manterRolagem = false) {
  const rol = manterRolagem ? conteudo.scrollTop : 0;
  const sit = D.SITUACOES;
  const quadra = (p.local || '').startsWith('Quadra ');
  abrirFolha(`${cabeca(`Câmera ${esc(p.codigo)}`, `${p.origem === 'gps' ? `Marcada pelo GPS (±${Math.round(p.gps?.acc || 0)} m)` : 'Marcada no mapa'}${p.manual ? ' · ajustada à mão' : ''} · ${horaBR(p.criadoEm)}`)}
    <div class="campo"><span class="rot">Grupo</span>${opcs('grupo', D.GRUPOS, p.grupo, (g) => (g.id === 'Nova sugerida' ? 'cor-ciano' : ''))}</div>
    <div class="campo"><label for="fLocal">Local</label>
      <select class="txt" id="fLocal" data-input="local">${D.LOCAIS.map((l) => `<option ${l === p.local ? 'selected' : ''}>${l}</option>`).join('')}</select>
      ${quadra ? `<div class="campo"><label for="fRua">Número da rua</label><div class="passo"><button type="button" data-acao="rua" data-d="-1" aria-label="Rua anterior">−</button><input class="txt" id="fRua" inputmode="numeric" data-input="rua" value="${p.rua ?? ''}"><button type="button" data-acao="rua" data-d="1" aria-label="Próxima rua">+</button></div></div>` : ''}
    </div>
    <div class="campo"><label for="fCodigo">Código</label><input class="txt" id="fCodigo" data-input="codigo" value="${esc(p.codigo)}" autocapitalize="characters"><p class="dica">${p.codigoManual ? 'Editado à mão. <button type="button" class="opc" style="min-height:36px;padding:4px 10px;font-size:14px" data-acao="codigo-auto">Voltar ao automático</button>' : 'Automático pelo grupo e local. Pode editar.'}</p></div>
    <div class="campo"><span class="rot">Situação</span>${opcs('situacao', sit, p.situacao, (s) => s.classe)}</div>
    <div class="campo"><span class="rot">Tipo</span>${opcs('tipoCam', D.TIPOS, p.tipoCam)}</div>
    <div class="campo"><span class="rot">Direção</span>
      <div class="dial-caixa">${svgDial(p)}<div class="dial-info"><span class="graus">${p.direcao != null ? `${Math.round(p.direcao)}°` : '—'}</span>
        <button class="btn" type="button" data-acao="apontar">Apontar o celular</button>
        <span class="sub">Bússola agora: <b data-heading>${E.heading != null ? `${Math.round(E.heading)}°` : 'desligada'}</b></span></div></div>
      <p class="dica">Aponte o topo do celular para onde a câmera olha e toque em "Apontar o celular", ou gire a seta com o dedo.</p>
    </div>
    <div class="campo"><span class="rot">Abertura</span>${opcs('abertura', D.ABERTURAS, p.abertura)}</div>
    <div class="campo"><label for="fAlcance">Alcance do cone (m)</label><div class="passo"><button type="button" data-acao="alcance" data-d="-5" aria-label="Diminuir alcance">−</button><input class="txt" id="fAlcance" inputmode="numeric" data-input="alcance" value="${p.alcance}"><button type="button" data-acao="alcance" data-d="5" aria-label="Aumentar alcance">+</button></div></div>
    <div class="campo"><span class="rot">Altura</span>${opcs('altura', D.ALTURAS, p.altura)}</div>
    <div class="campo"><span class="rot">Pega rosto de frente?</span>${opcs('rosto', D.ROSTO, p.rosto)}</div>
    <div class="campo"><span class="rot">O que cobre</span>${opcs('cobre', D.COBRE, p.cobre)}</div>
    <div class="campo"><span class="rot">Prioridade para IA</span>${opcs('prioridadeIA', D.PRIORIDADE, p.prioridadeIA, (x) => (x === 'sim' ? 'cor-ciano' : ''))}</div>
    ${blocoFotos(p)}
    <div class="campo"><label for="fObs">Observações</label><textarea class="txt" id="fObs" data-input="obs" placeholder="Pode ditar pelo microfone do teclado.">${esc(p.obs)}</textarea></div>
    <p class="sub">Criada em ${horaBR(p.criadoEm)} · alterada em ${horaBR(p.atualizadoEm)}</p>
    <div class="btns">
      <button class="btn principal" type="button" data-acao="fechar">Pronto</button>
      <button class="btn" type="button" data-acao="centralizar">Mostrar no mapa (dá para arrastar o pino)</button>
      <button class="btn perigo" type="button" data-acao="excluir">Excluir esta câmera</button>
    </div>`, { cheia: true, aoFechar: () => selecionar(null) });
  conteudo.scrollTop = rol;
  ligarDial(p);
  preencherFotos();
}

function renderFichaOutro(p, manterRolagem = false) {
  const rol = manterRolagem ? conteudo.scrollTop : 0;
  const o = D.OUTROS.find((x) => x.id === p.categoria);
  abrirFolha(`${cabeca(o ? esc(o.nome) : 'Outro ponto', `${p.origem === 'gps' ? `Marcado pelo GPS (±${Math.round(p.gps?.acc || 0)} m)` : 'Marcado no mapa'}${p.manual ? ' · ajustado à mão' : ''} · ${horaBR(p.criadoEm)}`)}
    <div class="campo"><span class="rot">Tipo</span><div class="opcs">${D.OUTROS.map((x) => `<button class="opc" style="flex-basis:100%;text-align:left" type="button" data-acao="campo" data-campo="categoria" data-valor="${x.id}" aria-pressed="${p.categoria === x.id}"><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${x.cor};margin-right:10px;vertical-align:-1px"></span>${x.nome}</button>`).join('')}</div></div>
    ${blocoFotos(p)}
    <div class="campo"><label for="fObs">Observações</label><textarea class="txt" id="fObs" data-input="obs" placeholder="Pode ditar pelo microfone do teclado.">${esc(p.obs)}</textarea></div>
    <div class="btns">
      <button class="btn principal" type="button" data-acao="fechar">Pronto</button>
      <button class="btn" type="button" data-acao="centralizar">Mostrar no mapa (dá para arrastar o pino)</button>
      <button class="btn perigo" type="button" data-acao="excluir">Excluir este ponto</button>
    </div>`, { cheia: true, aoFechar: () => selecionar(null) });
  conteudo.scrollTop = rol;
  preencherFotos();
}
const pontoAtual = () => E.pontos.get(E.selecionado);
function rerender() { const p = pontoAtual(); if (!p) return; if (p.tipo === 'camera') renderFichaCamera(p, true); else renderFichaOutro(p, true); }

acoesFolha.campo = async (b) => {
  const p = pontoAtual(); if (!p) return;
  const c = b.dataset.campo, v = b.dataset.valor;
  if (c === 'cobre') p.cobre = p.cobre.includes(v) ? p.cobre.filter((x) => x !== v) : [...p.cobre, v];
  else p[c] = p[c] === v && ['altura', 'prioridadeIA'].includes(c) ? null : v;
  if ((c === 'grupo') && !p.codigoManual) p.codigo = sugerirCodigo(p);
  await salvarPonto(p);
  rerender();
};
conteudo.addEventListener('input', (e) => {
  const el = e.target.closest('[data-input]');
  const p = pontoAtual();
  if (!el || !p) return;
  const c = el.dataset.input;
  if (c === 'local') {
    p.local = el.value;
    if (!p.local.startsWith('Quadra ')) p.rua = null;
    else if (!p.rua) { const [u] = planoDoPonto(p); p.rua = D.ruaPorU(u); }
    if (!p.codigoManual) p.codigo = sugerirCodigo(p);
    salvarPonto(p).then(rerender);
    return;
  }
  if (c === 'codigo') { p.codigo = el.value.trim().toUpperCase(); p.codigoManual = true; }
  else if (c === 'rua') { p.rua = parseInt(el.value, 10) || null; if (!p.codigoManual) p.codigo = sugerirCodigo(p); }
  else if (c === 'alcance') { p.alcance = Math.max(2, Math.min(200, parseInt(el.value, 10) || 25)); }
  else if (c === 'obs') p.obs = el.value;
  clearTimeout(p._t);
  p._t = setTimeout(() => { delete p._t; salvarPonto(p); }, 350);
});
conteudo.addEventListener('change', (e) => {
  const el = e.target.closest('[data-input="codigo"],[data-input="rua"],[data-input="alcance"]');
  if (el) rerender();
});
acoesFolha['codigo-auto'] = async () => { const p = pontoAtual(); p.codigoManual = false; p.codigo = sugerirCodigo(p); await salvarPonto(p); rerender(); };
acoesFolha.rua = async (b) => { const p = pontoAtual(); p.rua = Math.max(1, Math.min(42, (p.rua || 1) + Number(b.dataset.d))); if (!p.codigoManual) p.codigo = sugerirCodigo(p); await salvarPonto(p); rerender(); };
acoesFolha.alcance = async (b) => { const p = pontoAtual(); p.alcance = Math.max(5, Math.min(200, (Number(p.alcance) || 25) + Number(b.dataset.d))); await salvarPonto(p); rerender(); };
acoesFolha.apontar = async () => {
  const p = pontoAtual();
  if (!E.bussolaAtiva) { const ok = await ativarBussola(); if (!ok) return; await new Promise((r) => setTimeout(r, 900)); }
  if (E.heading == null) { toast('A bússola ainda não respondeu. Gire a seta com o dedo.'); return; }
  p.direcao = Math.round(E.heading);
  await salvarPonto(p);
  rerender();
  toast(`Direção: ${p.direcao}°`);
};
acoesFolha.centralizar = () => {
  const p = pontoAtual();
  const pos = posPonto(p);
  folha.hidden = true;
  map.setView(pos, Math.max(map.getZoom(), 19));
  toast('Arraste o pino para corrigir. Toque nele para voltar à ficha.', 4500);
};
acoesFolha.excluir = async () => {
  const p = pontoAtual();
  if (!confirm(`Excluir ${p.tipo === 'camera' ? `a câmera ${p.codigo}` : 'este ponto'}? As fotos também serão apagadas.`)) return;
  for (const f of p.fotos) await dbFotos.apagar(f);
  await dbPontos.apagar(p.id);
  E.pontos.delete(p.id);
  removerMarcador(p.id);
  E.selecionado = null;
  fecharFolha();
  toast('Excluído.');
};

function ligarDial(p) {
  const svg = conteudo.querySelector('[data-dial]');
  if (!svg) return;
  let ativo = false;
  const ang = (e) => {
    const r = svg.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    return (Math.round((Math.atan2(x, -y) * 180) / Math.PI) + 360) % 360;
  };
  const atualizar = (e) => {
    p.direcao = ang(e);
    const novo = new DOMParser().parseFromString(svgDial(p), 'image/svg+xml').documentElement;
    svg.innerHTML = novo.innerHTML;
    conteudo.querySelector('.dial-info .graus').textContent = `${p.direcao}°`;
    const mk = marcadores.get(p.id);
    if (mk) { if (mk.cone) mk.cone.setLatLngs(conePontos(p, posPonto(p))); else desenharPonto(p); }
  };
  svg.addEventListener('pointerdown', (e) => { ativo = true; svg.setPointerCapture(e.pointerId); atualizar(e); e.preventDefault(); });
  svg.addEventListener('pointermove', (e) => { if (ativo) atualizar(e); });
  const fim = () => { if (ativo) { ativo = false; salvarPonto(p); } };
  svg.addEventListener('pointerup', fim);
  svg.addEventListener('pointercancel', fim);
}

// fotos
let fotoPara = null;
acoesFolha['tirar-foto'] = () => {
  const p = pontoAtual();
  if (p.fotos.length >= 3) return;
  fotoPara = p.id;
  $('#inputFoto').value = '';
  $('#inputFoto').click();
};
$('#inputFoto').addEventListener('change', async (e) => {
  const arq = e.target.files?.[0];
  const p = E.pontos.get(fotoPara);
  if (!arq || !p) return;
  try {
    const blob = await reduzirFoto(arq);
    const f = { id: novoId(), pontoId: p.id, blob, criadoEm: agoraISO(), gps: E.gps.ultima ? { lat: E.gps.ultima.lat, lng: E.gps.ultima.lng, acc: E.gps.ultima.acc } : null };
    await dbFotos.salvar(f);
    p.fotos = [...p.fotos, f.id].slice(0, 3);
    await salvarPonto(p);
    if (E.selecionado === p.id && !folha.hidden) rerender();
    toast('Foto guardada.');
  } catch (err) {
    toast('Não foi possível ler a foto.');
  }
});
acoesFolha['apagar-foto'] = async (b, e) => {
  e.stopPropagation();
  if (!confirm('Apagar esta foto?')) return;
  const p = pontoAtual();
  await dbFotos.apagar(b.dataset.foto);
  p.fotos = p.fotos.filter((x) => x !== b.dataset.foto);
  await salvarPonto(p);
  rerender();
};
async function reduzirFoto(arq, lado = 1600, q = 0.72) {
  const url = URL.createObjectURL(arq);
  try {
    const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = url; });
    const k = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((ok) => c.toBlob(ok, 'image/jpeg', q));
  } finally { URL.revokeObjectURL(url); }
}

// ------------------------------------------------------------------ lista
const filtros = { grupo: '', situacao: '', local: '', prioridade: '', busca: '' };
function telaLista() {
  const sel = (campo, rot, lista) => `<select class="txt" data-filtro="${campo}" aria-label="${rot}"><option value="">${rot}: todos</option>${lista.map((x) => { const id = typeof x === 'string' ? x : x.id; const nome = typeof x === 'string' ? x : x.nome; return `<option value="${esc(id)}" ${filtros[campo] === id ? 'selected' : ''}>${esc(nome)}</option>`; }).join('')}</select>`;
  abrirFolha(`${cabeca('Tudo o que foi marcado')}
    <input class="txt" type="search" placeholder="Buscar código, local ou observação" data-filtro="busca" value="${esc(filtros.busca)}">
    <div class="filtros">
      ${sel('grupo', 'Grupo', D.GRUPOS)}${sel('situacao', 'Situação', D.SITUACOES)}
      ${sel('local', 'Local', D.LOCAIS)}${sel('prioridade', 'Prioridade IA', D.PRIORIDADE)}
    </div>
    <div data-lista></div>`, { cheia: true });
  desenharLista();
}
function desenharLista() {
  const alvo = conteudo.querySelector('[data-lista]');
  if (!alvo) return;
  const b = filtros.busca.trim().toLowerCase();
  const itens = [...E.pontos.values()].filter((p) => {
    if (p.tipo === 'camera') {
      if (filtros.grupo && p.grupo !== filtros.grupo) return false;
      if (filtros.situacao && p.situacao !== filtros.situacao) return false;
      if (filtros.local && p.local !== filtros.local) return false;
      if (filtros.prioridade && p.prioridadeIA !== filtros.prioridade) return false;
    } else if (filtros.grupo || filtros.situacao || filtros.local || filtros.prioridade) return false;
    if (b) {
      const o = D.OUTROS.find((x) => x.id === p.categoria);
      const txt = `${p.codigo || ''} ${p.local || ''} ${p.rua || ''} ${p.obs || ''} ${o ? o.nome : ''} ${p.grupo || ''}`.toLowerCase();
      if (!txt.includes(b)) return false;
    }
    return true;
  }).sort((a, z) => (a.tipo === z.tipo ? (a.codigo || a.criadoEm).localeCompare(z.codigo || z.criadoEm, 'pt-BR', { numeric: true }) : a.tipo === 'camera' ? -1 : 1));
  alvo.innerHTML = itens.length ? `<p class="sub" style="margin-top:12px">${itens.length} ${itens.length === 1 ? 'item' : 'itens'}</p>` + itens.map((p) => {
    if (p.tipo === 'camera') return `<button class="item" type="button" data-acao="ir-ponto" data-id="${p.id}"><span class="bola" style="background:${corPino(p)};border-color:${bordaGrupo(p.grupo)}"></span><span class="txt"><b>${esc(p.codigo)}</b><span>${esc(p.grupo)} · ${esc(p.local)}${p.rua ? `, rua ${p.rua}` : ''} · ${esc(p.situacao)}${p.prioridadeIA === 'sim' ? ' · prioridade IA' : ''}</span></span></button>`;
    const o = D.OUTROS.find((x) => x.id === p.categoria);
    return `<button class="item" type="button" data-acao="ir-ponto" data-id="${p.id}"><span class="bola" style="border-radius:5px;background:${o ? o.cor : '#777'}"></span><span class="txt"><b>${o ? esc(o.nome) : 'Outro ponto (sem tipo)'}</b><span>${esc(p.obs || horaBR(p.criadoEm))}</span></span></button>`;
  }).join('') : '<p class="vazio">Nada encontrado. Use "Câmera aqui" ou "Marcar no mapa" para começar.</p>';
}
conteudo.addEventListener('input', (e) => {
  const el = e.target.closest('[data-filtro]');
  if (!el) return;
  filtros[el.dataset.filtro] = el.value;
  desenharLista();
});
acoesFolha['ir-ponto'] = (b) => {
  const p = E.pontos.get(b.dataset.id);
  if (!p) return;
  map.setView(posPonto(p), Math.max(map.getZoom(), 19));
  ligarSeguir(false);
  abrirFicha(p.id);
};

// ------------------------------------------------------------------ esperado x encontrado
function contarPorLocal() {
  const cams = [...E.pontos.values()].filter((p) => p.tipo === 'camera');
  const linha = (filtro) => {
    const l = cams.filter(filtro);
    const s = (id) => l.filter((p) => p.situacao === id).length;
    return { n: l.length, ok: s('funcionando'), parada: s('parada'), semsinal: s('sem sinal'), naosei: s('não sei') };
  };
  return { cams, linha };
}
function telaEsperado() {
  const { cams, linha } = contarPorLocal();
  const tr = (nome, esperado, c, nota = '') => {
    const falta = Math.max(0, esperado - c.n), mais = Math.max(0, c.n - esperado);
    return `<tr class="${falta ? 'falta' : ''}"><td>${nome}${nota ? `<br><span class="sub">${nota}</span>` : ''}</td><td>${esperado}</td><td>${c.n}</td><td>${c.ok}</td><td>${c.parada + c.semsinal}</td><td>${c.naosei}</td><td class="falta-n">${falta ? falta : mais ? `+${mais}` : '0'}</td></tr>`;
  };
  let totE = 0, totN = 0;
  const linhasPV = D.ESPERADO_PV.map(([local, esp, nome]) => { const c = linha((p) => p.grupo === 'PV' && p.local === local); totE += esp; totN += c.n; return tr(nome || local, esp, c); }).join('');
  const outrosPV = linha((p) => p.grupo === 'PV' && !D.ESPERADO_PV.some(([l]) => l === p.local));
  totN += outrosPV.n;
  const linhasG = D.ESPERADO_GRUPOS.map(([g, esp, nome]) => { const c = linha((p) => p.grupo === g); totE += esp; totN += c.n; return tr(nome, esp, c); }).join('');
  const novas = linha((p) => p.grupo === 'Nova sugerida');
  const faltando = D.ESPERADO_PV.filter(([local, esp]) => esp > linha((p) => p.grupo === 'PV' && p.local === local).n).map(([l, esp, nome]) => nome || l);
  abrirFolha(`${cabeca('Esperado × encontrado', `Lista da administração: ${D.TOTAL_INFORMADO} câmeras no total`)}
    <div class="nums"><div class="num"><b>${D.TOTAL_INFORMADO}</b><span>esperadas</span></div><div class="num"><b>${cams.filter((p) => p.grupo !== 'Nova sugerida').length}</b><span>marcadas</span></div><div class="num"><b>${novas.n}</b><span>novas sugeridas</span></div></div>
    ${faltando.length ? `<p style="margin-top:12px"><b style="color:var(--ciano)">Falta conferir:</b> ${faltando.join(', ')}.</p>` : '<p style="margin-top:12px">Todos os locais da PV têm pelo menos o número esperado de câmeras marcadas.</p>'}
    <p class="sub">Func. = funcionando · Par. = parada ou sem sinal · ? = não sei</p>
    <h3>Câmeras da PV (50)</h3>
    <div style="overflow-x:auto"><table class="tabela"><tr><th>Local</th><th>Esp.</th><th>Marc.</th><th>Func.</th><th>Par.</th><th>?</th><th>Falta</th></tr>
      ${linhasPV}${outrosPV.n ? tr('PV em outros locais', 0, outrosPV) : ''}</table></div>
    <h3>Outros grupos</h3>
    <div style="overflow-x:auto"><table class="tabela"><tr><th>Grupo</th><th>Esp.</th><th>Marc.</th><th>Func.</th><th>Par.</th><th>?</th><th>Falta</th></tr>
      ${linhasG}${tr('Novas sugeridas', 0, novas)}<tr class="total"><td>Total</td><td>${totE}</td><td>${totN}</td><td colspan="4"></td></tr></table></div>
    <p class="nota">${D.OBS_ADM}</p>`, { cheia: true });
}

// ------------------------------------------------------------------ resumo
function telaResumo() {
  const cams = [...E.pontos.values()].filter((p) => p.tipo === 'camera');
  const outros = [...E.pontos.values()].filter((p) => p.tipo !== 'camera');
  const conta = (lista, f) => { const m = new Map(); lista.forEach((p) => { const k = f(p) || 'sem informação'; m.set(k, (m.get(k) || 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
  const tab = (rot, pares) => (pares.length ? `<table class="tabela"><tr><th>${rot}</th><th>Câmeras</th></tr>${pares.map(([k, n]) => `<tr><td>${esc(k)}</td><td>${n}</td></tr>`).join('')}</table>` : '<p class="vazio">Sem dados.</p>');
  abrirFolha(`${cabeca('Resumo da vistoria', E.vistoria.iniciada ? `Iniciada em ${horaBR(E.vistoria.inicio)} no Portão ${E.vistoria.portao}` : 'Vistoria ainda não iniciada')}
    <div class="nums"><div class="num"><b>${cams.length}</b><span>câmeras</span></div><div class="num"><b>${cams.filter((p) => p.prioridadeIA === 'sim').length}</b><span>prioridade IA (sim)</span></div><div class="num"><b>${outros.length}</b><span>outros pontos</span></div></div>
    <div class="legenda"><span><i style="background:#22c55e"></i>Funcionando</span><span><i style="background:#ff4d4d"></i>Parada / sem sinal</span><span><i style="background:#9ca3af"></i>Não sei</span><span><i style="background:${D.COR_NOVA}"></i>Nova sugerida</span></div>
    <h3>Por grupo</h3>${tab('Grupo', conta(cams, (p) => p.grupo))}
    <h3>Por situação</h3>${tab('Situação', conta(cams, (p) => p.situacao))}
    <h3>Por local</h3>${tab('Local', conta(cams, (p) => (p.rua ? `${p.local}, rua ${p.rua}` : p.local)))}
    <h3>Prioridade para IA</h3>${tab('Prioridade', conta(cams, (p) => p.prioridadeIA))}
    <h3>Outros pontos</h3>${outros.length ? `<table class="tabela"><tr><th>Tipo</th><th>Pontos</th></tr>${conta(outros, (p) => D.OUTROS.find((x) => x.id === p.categoria)?.nome).map(([k, n]) => `<tr><td>${esc(k)}</td><td>${n}</td></tr>`).join('')}</table>` : '<p class="vazio">Nenhum.</p>'}
    <p class="sub">Trajeto gravado: ${E.trajeto.length} pontos · Conferência: ${E.conf.pares.length} portão(ões)${E.erroMedio != null ? `, erro médio ${E.erroMedio.toFixed(1).replace('.', ',')} m` : ''}</p>`, { cheia: true });
}

// ------------------------------------------------------------------ camadas
function telaCamadas() {
  const c = E.camadas;
  const ch = (k, rot) => `<label class="chave">${rot}<input type="checkbox" data-camada="${k}" ${c[k] ? 'checked' : ''}></label>`;
  abrirFolha(`${cabeca('Camadas')}
    ${ch('cameras', 'Câmeras')}${ch('cones', 'Cones de visão')}${ch('outros', 'Outros pontos')}${ch('trajeto', 'Trajeto')}${ch('planta', 'Planta')}${ch('digital', 'Portões, quadras e ruas')}
    <div class="campo"><label for="opac">Transparência da planta: <b data-opac>${Math.round((1 - E.opacidade) * 100)}%</b></label><input id="opac" type="range" min="0" max="100" value="${Math.round((1 - E.opacidade) * 100)}" style="width:100%;accent-color:#5fd3ff;height:40px" data-opacidade></div>
    <div class="legenda"><span><i style="background:#22c55e"></i>Funcionando</span><span><i style="background:#ff4d4d"></i>Parada / sem sinal</span><span><i style="background:#9ca3af"></i>Não sei</span><span><i style="background:${D.COR_NOVA}"></i>Nova sugerida</span></div>
    <p class="sub" style="margin-top:8px">Contorno do pino: branco = PV, amarelo = Escritório, lilás = Feirante, ciano = Nova sugerida.</p>`);
}
conteudo.addEventListener('change', async (e) => {
  const el = e.target.closest('[data-camada]');
  if (!el) return;
  E.camadas[el.dataset.camada] = el.checked;
  aplicarCamadas();
  await kv.set('camadas', E.camadas);
});
conteudo.addEventListener('input', (e) => {
  const el = e.target.closest('[data-opacidade]');
  if (!el) return;
  E.opacidade = 1 - Number(el.value) / 100;
  conteudo.querySelector('[data-opac]').textContent = `${el.value}%`;
  camadaPlanta.atualizar();
  const r = $('#ajusteOpac'); if (r) r.value = el.value;
  clearTimeout(E._to); E._to = setTimeout(() => kv.set('opacidade', E.opacidade), 300);
});

// ------------------------------------------------------------------ ajustar planta
let alcas = [], pilhaEncaixe = [], encaixeAntes = null;
function entrarAjuste() {
  fecharFolha();
  E.modo = 'ajuste';
  encaixeAntes = E.encaixe.map((c) => [...c]);
  pilhaEncaixe = [];
  if (!E.camadas.planta) { E.camadas.planta = true; aplicarCamadas(); }
  document.querySelector('.acoes').hidden = true;
  const painel = $('#ajuste');
  painel.innerHTML = `<b style="font-family:var(--titulo);font-size:20px">Ajustar planta</b>
    <p class="sub" style="margin:4px 0 0">Arraste os 4 cantos (e o quadrado branco para mover tudo) até a planta encaixar no terreno.</p>
    <div class="lin"><span class="sub">Transparência</span><input type="range" id="ajusteOpac" min="0" max="100" value="${Math.round((1 - E.opacidade) * 100)}"></div>
    <div class="lin"><button class="btn" type="button" data-aj="girar" data-d="-0.2">Girar −0,2°</button><button class="btn" type="button" data-aj="girar" data-d="0.2">Girar +0,2°</button><button class="btn" type="button" data-aj="desfazer">Desfazer</button></div>
    <div class="lin"><button class="btn" type="button" data-aj="inicial">Encaixe inicial</button><button class="btn" type="button" data-aj="cancelar">Cancelar</button><button class="btn principal" type="button" data-aj="salvar">Salvar encaixe</button></div>`;
  painel.hidden = false;
  map.fitBounds(L.latLngBounds(E.encaixe), { padding: [20, 20] });
  criarAlcas();
}
function criarAlcas() {
  alcas.forEach((a) => a.remove());
  alcas = E.encaixe.map((c, i) => {
    const m = L.marker(c, { draggable: true, zIndexOffset: 3000, icon: L.divIcon({ className: '', iconSize: null, html: `<div class="alca-canto">${i + 1}</div>` }) });
    m.on('dragstart', guardarPasso);
    m.on('drag', () => { const ll = m.getLatLng(); E.encaixe[i] = [ll.lat, ll.lng]; camadaPlanta.atualizar(); posicionarCentro(); });
    return m.addTo(map);
  });
  const cen = L.marker(centroEncaixe(), { draggable: true, zIndexOffset: 3000, icon: L.divIcon({ className: '', iconSize: null, html: '<div class="alca-centro"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3" stroke="#000" stroke-width="2" fill="none"/></svg></div>' }) });
  let ini = null;
  cen.on('dragstart', () => { guardarPasso(); ini = { ll: cen.getLatLng(), cantos: E.encaixe.map((c) => G.projetar(c)) }; });
  cen.on('drag', () => {
    const a = G.projetar([ini.ll.lat, ini.ll.lng]), b = G.projetar([cen.getLatLng().lat, cen.getLatLng().lng]);
    E.encaixe = ini.cantos.map(([x, y]) => G.desprojetar([x + b[0] - a[0], y + b[1] - a[1]]));
    alcas.slice(0, 4).forEach((m, i) => m.setLatLng(E.encaixe[i]));
    camadaPlanta.atualizar();
  });
  alcas.push(cen.addTo(map));
}
const centroEncaixe = () => { const p = E.encaixe.map(G.projetar); return G.desprojetar([p.reduce((s, x) => s + x[0], 0) / 4, p.reduce((s, x) => s + x[1], 0) / 4]); };
function posicionarCentro() { if (alcas[4]) alcas[4].setLatLng(centroEncaixe()); }
function guardarPasso() { pilhaEncaixe.push(E.encaixe.map((c) => [...c])); if (pilhaEncaixe.length > 50) pilhaEncaixe.shift(); }
function aplicarEncaixeVisual() { alcas.slice(0, 4).forEach((m, i) => m.setLatLng(E.encaixe[i])); posicionarCentro(); camadaPlanta.atualizar(); }
$('#ajuste').addEventListener('input', (e) => {
  if (e.target.id !== 'ajusteOpac') return;
  E.opacidade = 1 - Number(e.target.value) / 100;
  camadaPlanta.atualizar();
  clearTimeout(E._to); E._to = setTimeout(() => kv.set('opacidade', E.opacidade), 300);
});
$('#ajuste').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-aj]');
  if (!b) return;
  const a = b.dataset.aj;
  if (a === 'girar') {
    guardarPasso();
    const c = G.projetar(centroEncaixe());
    const t = (Number(b.dataset.d) * Math.PI) / 180; // positivo = horário na tela
    E.encaixe = E.encaixe.map((ll) => { const [x, y] = G.projetar(ll); const dx = x - c[0], dy = y - c[1]; return G.desprojetar([c[0] + dx * Math.cos(t) + dy * Math.sin(t), c[1] - dx * Math.sin(t) + dy * Math.cos(t)]); });
    aplicarEncaixeVisual();
  } else if (a === 'desfazer') {
    if (!pilhaEncaixe.length) { toast('Nada para desfazer.'); return; }
    E.encaixe = pilhaEncaixe.pop(); aplicarEncaixeVisual();
  } else if (a === 'inicial') {
    guardarPasso(); E.encaixe = D.ENCAIXE_INICIAL.map((c) => [...c]); aplicarEncaixeVisual();
  } else if (a === 'cancelar') {
    E.encaixe = encaixeAntes; sairAjuste();
  } else if (a === 'salvar') {
    await kv.set('encaixe', E.encaixe);
    sairAjuste();
    toast('Encaixe salvo. A planta agora está em coordenadas reais.');
  }
});
function sairAjuste() {
  alcas.forEach((a) => a.remove()); alcas = [];
  $('#ajuste').hidden = true;
  document.querySelector('.acoes').hidden = false;
  E.modo = null;
  recalcularPlano();
  recalcularConferencia();
  camadaPlanta.atualizar();
  montarDigital();
  redesenharTudo();
}

// ------------------------------------------------------------------ offline
async function telaOffline() {
  const info = (await kv.get('offline')) || null;
  const prov = E.ajustes.provedor === 'mapbox' && E.ajustes.mapboxToken ? 'mapbox' : 'esri';
  const n = contarTiles(prov, E.encaixe);
  abrirFolha(`${cabeca('Mapa sem internet')}
    <p>Baixa as imagens de satélite só da área da Fundac (com uns 200 m de margem) e guarda no celular. Junto com o app e a planta, tudo funciona em modo avião depois disso.</p>
    <p class="sub">${prov === 'esri' ? 'Satélite Esri: nesta região a imagem vai até o zoom 18 (cerca de 0,6 m por pixel). Mais perto do que isso, o app amplia a imagem.' : 'Satélite Mapbox: zooms 15 a 20.'} São ${n} imagens.</p>
    ${info ? `<p>Último download: ${horaBR(info.quando)} · ${info.ok} imagens${info.falhas ? `, ${info.falhas} falharam` : ''} · ${info.provedor === 'mapbox' ? 'Mapbox' : 'Esri'}.</p>` : '<p>Ainda não baixado.</p>'}
    <div class="progresso" hidden data-prog><i></i></div><p class="sub" data-prog-txt></p>
    <div class="btns"><button class="btn principal" type="button" data-acao="baixar-offline">${info ? 'Baixar de novo' : 'Baixar mapa para usar sem internet'}</button></div>`);
}
acoesFolha['tela-offline'] = () => telaOffline();
acoesFolha['baixar-offline'] = async (b) => {
  b.disabled = true;
  const barra = conteudo.querySelector('[data-prog]'), txt = conteudo.querySelector('[data-prog-txt]');
  barra.hidden = false;
  const prov = E.ajustes.provedor === 'mapbox' && E.ajustes.mapboxToken ? 'mapbox' : 'esri';
  const r = await baixarMapaOffline(prov, E.ajustes.mapboxToken, E.encaixe, (feito, total) => {
    barra.firstElementChild.style.width = `${Math.round((feito / total) * 100)}%`;
    txt.textContent = `${feito} de ${total} imagens`;
  });
  await kv.set('offline', { quando: agoraISO(), provedor: prov, ok: r.ok, falhas: r.falhas });
  b.disabled = false;
  txt.textContent = r.falhas ? `Pronto, com ${r.falhas} falhas. Toque de novo para completar.` : 'Pronto. O mapa da Fundac está guardado no celular.';
  toast(r.falhas ? 'Download incompleto.' : 'Mapa guardado para usar sem internet.');
};

// ------------------------------------------------------------------ exportar / importar
function telaExportar() {
  const n = E.pontos.size;
  abrirFolha(`${cabeca('Exportar e compartilhar', `${n} ${n === 1 ? 'item marcado' : 'itens marcados'}`)}
    <div class="menu-lista">
      <button class="btn principal" type="button" data-acao="exp" data-t="json" data-share="1">Compartilhar arquivo completo (com fotos)</button>
      <button class="btn" type="button" data-acao="exp" data-t="csv" data-share="1">Compartilhar planilha CSV</button>
      <button class="btn" type="button" data-acao="exp" data-t="png" data-share="1">Compartilhar imagem do mapa (PNG)</button>
      <button class="btn" type="button" data-acao="exp" data-t="json">Baixar arquivo completo</button>
      <button class="btn" type="button" data-acao="exp" data-t="csv">Baixar planilha CSV</button>
      <button class="btn" type="button" data-acao="exp" data-t="png">Baixar imagem do mapa</button>
      <button class="btn" type="button" data-acao="importar">Importar arquivo para continuar</button>
    </div>
    <p class="nota">O arquivo completo (.json) tem tudo: câmeras, pontos, fotos, encaixe da planta, conferência e trajeto. Use-o para continuar em outro aparelho ou no computador.</p>`);
}
acoesFolha.exp = async (b) => {
  const t = b.dataset.t, share = !!b.dataset.share;
  b.disabled = true;
  const txtAntes = b.textContent;
  b.textContent = 'Gerando…';
  try {
    const estado = await estadoParaExportar();
    const arq = t === 'json' ? await exportarJSON(estado) : t === 'csv' ? exportarCSV(estado) : await exportarPNG(estado);
    await compartilharOuBaixar(arq, share);
    await kv.set('ultimaExportacao', agoraISO());
    E._naoExportado = false;
  } catch (err) {
    console.error(err);
    toast('Não foi possível gerar o arquivo.');
  }
  b.disabled = false;
  b.textContent = txtAntes;
};
async function estadoParaExportar() {
  return {
    pontos: [...E.pontos.values()].map((p) => ({ ...p, _pos: posPonto(p), _plano: planoDoPonto(p) })),
    encaixe: E.encaixe, conf: E.conf, erroMedio: E.erroMedio, vistoria: E.vistoria, trajeto: E.trajeto,
    trajetoCorrigido: E.trajeto.map((t) => corrigir([t.lat, t.lng])),
    planoParaLL, provedor: E.ajustes.provedor === 'mapbox' && E.ajustes.mapboxToken ? 'mapbox' : 'esri', mapboxToken: E.ajustes.mapboxToken,
    portoes: D.PORTOES.map((g) => ({ ...g, ll: posPortao(g.n) })),
    corPino, bordaGrupo, camadas: E.camadas, opacidade: E.opacidade,
  };
}
acoesFolha.importar = () => { $('#inputImportar').value = ''; $('#inputImportar').click(); };
$('#inputImportar').addEventListener('change', async (e) => {
  const arq = e.target.files?.[0];
  if (!arq) return;
  try {
    const dados = await importarArquivo(arq);
    if (!confirm(`Importar ${dados.pontos.length} itens e ${dados.fotos.length} fotos? O que está neste celular será substituído.`)) return;
    await dbPontos.limpar(); await dbFotos.limpar(); await dbTrajeto.limpar();
    for (const f of dados.fotos) await dbFotos.salvar(f);
    for (const p of dados.pontos) await dbPontos.salvar(p);
    for (const t of dados.trajeto) await dbTrajeto.add(t);
    if (dados.encaixe) await kv.set('encaixe', dados.encaixe);
    if (dados.conf) await kv.set('conferencia', dados.conf);
    if (dados.vistoria) await kv.set('vistoria', dados.vistoria);
    toast('Importado. Recarregando…');
    setTimeout(() => location.reload(), 700);
  } catch (err) {
    console.error(err);
    toast('Arquivo inválido ou de outro app.');
  }
});

// ------------------------------------------------------------------ menu e ajustes
function telaMenu() {
  abrirFolha(`${cabeca('Menu')}
    <div class="menu-lista">
      <button class="btn" type="button" data-acao="m" data-t="inicio">${E.vistoria.iniciada ? 'Vistoria (início e portão de partida)' : 'Iniciar vistoria'}</button>
      <button class="btn" type="button" data-acao="m" data-t="portao">Conferência nos portões (${E.conf.pares.length})</button>
      <button class="btn" type="button" data-acao="m" data-t="lista">Lista de tudo o que foi marcado</button>
      <button class="btn" type="button" data-acao="m" data-t="esperado">Esperado × encontrado</button>
      <button class="btn" type="button" data-acao="m" data-t="resumo">Resumo</button>
      <button class="btn principal" type="button" data-acao="m" data-t="exportar">Exportar e compartilhar</button>
      <button class="btn" type="button" data-acao="m" data-t="camadas">Camadas e transparência da planta</button>
      <button class="btn" type="button" data-acao="ajustar-planta">Ajustar planta no satélite</button>
      <button class="btn" type="button" data-acao="tela-offline">Baixar mapa para usar sem internet</button>
      <button class="btn" type="button" data-acao="m" data-t="ajustes">Satélite (Esri ou Mapbox)</button>
      <button class="btn" type="button" data-acao="m" data-t="ajuda">Como usar</button>
      <button class="btn" type="button" data-acao="trajeto-limpar">Apagar o trajeto gravado</button>
      <button class="btn perigo" type="button" data-acao="apagar-tudo">Apagar tudo deste celular</button>
    </div>`, { cheia: true });
}
acoesFolha.m = (b) => ({ inicio: telaInicio, portao: () => telaPortao(), lista: telaLista, esperado: telaEsperado, resumo: telaResumo, exportar: telaExportar, camadas: telaCamadas, ajustes: telaAjustes, ajuda: telaAjuda })[b.dataset.t]();
acoesFolha['ajustar-planta'] = () => entrarAjuste();
acoesFolha['trajeto-limpar'] = async () => {
  if (!confirm('Apagar o trajeto gravado até agora?')) return;
  await dbTrajeto.limpar(); E.trajeto = []; ultimoTrajeto = null; desenharTrajeto(); toast('Trajeto apagado.');
};
acoesFolha['apagar-tudo'] = async () => {
  if (!confirm('Apagar TODAS as câmeras, pontos, fotos, conferência e trajeto deste celular?')) return;
  if (!confirm('Tem certeza? Se ainda não exportou, isso não tem volta.')) return;
  await dbPontos.limpar(); await dbFotos.limpar(); await dbTrajeto.limpar();
  for (const k of ['conferencia', 'vistoria']) await kv.del(k);
  location.reload();
};
function telaAjustes() {
  const a = E.ajustes;
  abrirFolha(`${cabeca('Imagem de satélite')}
    <div class="campo"><span class="rot">Fonte</span><div class="opcs">
      <button class="opc" type="button" data-acao="prov" data-v="esri" aria-pressed="${a.provedor !== 'mapbox'}">Esri World Imagery</button>
      <button class="opc" type="button" data-acao="prov" data-v="mapbox" aria-pressed="${a.provedor === 'mapbox'}">Mapbox Satellite</button></div></div>
    <div class="campo"><label for="mbtoken">Chave do Mapbox (token público, começa com pk.)</label><input class="txt" id="mbtoken" value="${esc(a.mapboxToken)}" autocomplete="off" spellcheck="false" placeholder="pk.…"><p class="dica">Fica guardada só neste celular. Sem chave, o app usa a Esri.</p></div>
    <div class="btns"><button class="btn principal" type="button" data-acao="salvar-ajustes">Salvar</button></div>`);
}
acoesFolha.prov = (b) => { E.ajustes.provedor = b.dataset.v; conteudo.querySelectorAll('[data-acao="prov"]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); };
acoesFolha['salvar-ajustes'] = async () => {
  E.ajustes.mapboxToken = conteudo.querySelector('#mbtoken').value.trim();
  if (E.ajustes.provedor === 'mapbox' && !E.ajustes.mapboxToken.startsWith('pk.')) { toast('Informe uma chave pública do Mapbox (pk.).'); return; }
  await kv.set('ajustes', E.ajustes);
  montarSatelite();
  fecharFolha();
  toast(E.ajustes.provedor === 'mapbox' ? 'Usando Mapbox. Baixe o mapa offline de novo.' : 'Usando Esri.');
};
function telaAjuda() {
  abrirFolha(`${cabeca('Como usar')}
    <ol class="passos">
      <li><b>Antes de ir</b>, com internet: abra o app, toque em <b>Baixar mapa para usar sem internet</b> e, se precisar, em <b>Ajustar planta</b> para encaixar os cantos no terreno.</li>
      <li>Para usar como aplicativo: no Android, menu do Chrome, "Adicionar à tela inicial"; no iPhone, Compartilhar, "Adicionar à Tela de Início".</li>
      <li>No <b>Portão 02</b> (Rua Rui Limeira Rosal), toque em <b>Iniciar vistoria no Portão 02</b>. Se a distância for grande, toque em <b>Corrigir aqui</b>.</li>
      <li>Ative a <b>bússola</b> (botão da direita) para ver para onde está virado e para apontar as câmeras.</li>
      <li>Embaixo de cada câmera: <b>Câmera aqui</b> (GPS) ou <b>Marcar no mapa</b> (toque no lugar exato). Preencha a ficha: tudo é salvo na hora.</li>
      <li>Ao passar por outro portão, toque em <b>Estou no portão</b> para afinar a posição (com 2 ou mais, o app calcula o erro médio).</li>
      <li>Acompanhe em <b>Esperado × encontrado</b> o que ainda falta conferir.</li>
      <li>No fim, <b>Exportar e compartilhar</b>: arquivo completo, planilha CSV e imagem do mapa.</li>
    </ol>
    <p class="nota">Pino: verde funcionando, vermelho parada ou sem sinal, cinza não sei, azul nova sugerida. O contorno mostra o grupo.</p>`, { cheia: true });
}

// ------------------------------------------------------------------ botões fixos
function ligarSeguir(on) {
  E.seguir = on;
  $('#btnSeguir').setAttribute('aria-pressed', String(on));
  if (on && E.gps.ultima) map.setView(corrigir([E.gps.ultima.lat, E.gps.ultima.lng]), Math.max(map.getZoom(), 19));
}
$('#btnSeguir').onclick = async () => { if (!E.seguir && !(await garantirGps())) return; ligarSeguir(!E.seguir); if (E.seguir) fecharFolha(); };
map.on('dragstart', () => { if (E.seguir) ligarSeguir(false); });
$('#btnFeira').onclick = () => { ligarSeguir(false); map.fitBounds(L.latLngBounds(E.encaixe), { padding: [10, 10] }); };
$('#btnCamadas').onclick = () => telaCamadas();
$('#btnBussola').onclick = async () => {
  if (E.bussolaAtiva) { toast(E.heading != null ? `Bússola ligada: ${Math.round(E.heading)}°` : 'Bússola ligada, aguardando o sensor.'); return; }
  const ok = await ativarBussola();
  if (ok) toast('Bússola ligada. A seta azul mostra para onde você está virado.');
};
$('#btnMenu').onclick = () => telaMenu();
$('#chipGps').onclick = async () => { if (E.gps.estado !== 'ok') await garantirGps(); else if (E.gps.ultima) { ligarSeguir(true); } };
$('#btnCameraAqui').onclick = () => marcarPeloGps('camera');
$('#btnMarcarMapa').onclick = () => { fecharFolha(); entrarModoMarcar('camera'); };
$('#btnOutroPonto').onclick = () => {
  abrirFolha(`${cabeca('Outro ponto', 'Sem cobertura, monitoramento, energia, furto, aglomeração')}<div class="btns"><button class="btn principal" type="button" data-acao="outro-gps">Aqui (pelo GPS)</button><button class="btn" type="button" data-acao="outro-mapa">Marcar no mapa</button></div>`);
};
acoesFolha['outro-gps'] = () => marcarPeloGps('outro');
acoesFolha['outro-mapa'] = () => { fecharFolha(); entrarModoMarcar('outro'); };
$('#btnPortao').onclick = () => telaPortao();
$('#btnLista').onclick = () => telaLista();
$('#btnEsperado').onclick = () => telaEsperado();

// planta ausente
function avisoPlantaFaltando() {
  const av = $('#aviso');
  av.className = 'aviso amarelo';
  av.innerHTML = 'A imagem da planta não carregou. O mapa segue só com o satélite. <button type="button" data-a="carregar-planta">Carregar planta</button>';
  av.hidden = false;
}
$('#inputPlanta').addEventListener('change', async (e) => {
  const arq = e.target.files?.[0];
  if (!arq) return;
  await kv.set('plantaCustom', arq);
  E.plantaUrl = URL.createObjectURL(arq);
  camadaPlanta.trocarImagem(E.plantaUrl);
  $('#aviso').hidden = true;
  toast('Planta carregada. Use "Ajustar planta" para encaixar.');
});

// lembrete de exportar ao sair
window.addEventListener('beforeunload', (e) => {
  if (E.pontos.size && E._naoExportado) { e.preventDefault(); e.returnValue = ''; }
});

// ------------------------------------------------------------------ carregar
async function carregar() {
  pedirArmazenamentoPersistente();
  const [enc, conf, vist, cam, opac, aj, custom] = await Promise.all(['encaixe', 'conferencia', 'vistoria', 'camadas', 'opacidade', 'ajustes', 'plantaCustom'].map((k) => kv.get(k)));
  if (enc) E.encaixe = enc;
  if (conf) E.conf = conf;
  if (vist) E.vistoria = vist;
  if (cam) Object.assign(E.camadas, cam);
  if (typeof opac === 'number') E.opacidade = opac;
  if (aj) Object.assign(E.ajustes, aj);
  if (custom) E.plantaUrl = URL.createObjectURL(custom);
  recalcularPlano();
  recalcularConferencia();
  montarSatelite();
  montarDigital();
  for (const p of await dbPontos.todos()) E.pontos.set(p.id, p);
  E.trajeto = await dbTrajeto.todos();
  ultimoTrajeto = E.trajeto.at(-1) || null;
  aplicarCamadas();
  redesenharTudo();
  map.fitBounds(L.latLngBounds(E.encaixe), { padding: [10, 10] });
  aplicarZoomClasse();
  atualizarChipGps();
  // GPS: se já houver permissão, liga direto; senão, explica antes de pedir.
  try {
    const st = navigator.permissions ? await navigator.permissions.query({ name: 'geolocation' }) : null;
    if (st && st.state === 'granted') iniciarGps();
    if (st && st.state === 'denied') { E.gps.estado = 'negado'; atualizarChipGps(); }
  } catch { /* Safari antigo */ }
  if (E.vistoria.iniciada) { iniciarGps(); manterTelaLigada(); }
  else telaInicio();
  const ult = await kv.get('ultimaExportacao');
  const ultAlt = [...E.pontos.values()].reduce((m, p) => (p.atualizadoEm > m ? p.atualizadoEm : m), '');
  E._naoExportado = ultAlt && (!ult || ult < ultAlt);
  if (E._naoExportado && E.pontos.size >= 5) setTimeout(() => toast('Lembrete: exporte a vistoria pelo menu ao terminar.', 4500), 1500);
}
carregar();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// para os testes automáticos
window.__vistoria = { E, map, posPonto, planoParaLL, llParaPlano, corrigir };
