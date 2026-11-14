"""Ciclo de vida de cada pessoa e veículo numa câmera: UM registro por objeto.

O rastreador (ByteTrack para pessoas, centro mais próximo para veículos) dá um
ID por quadro. Aqui esses IDs viram objetos estáveis:
  - filtros antes do rastreio: confiança mínima por câmera, tamanho e
    proporção da caixa (pessoa em pé é mais alta que larga) e zonas de
    exclusão desenhadas na Configuração;
  - confirmação: só conta depois de visto por pelo menos 1 segundo;
  - junção: se o rastreio perde o ID e cria outro logo depois, no mesmo
    lugar e com a mesma aparência (histograma de cor), é o mesmo objeto;
  - parado: pessoa que nunca se mexeu por muito tempo (lixo, sombra,
    manequim) é descartada; veículo parado vira UM registro longo;
  - condutor/passageiro: pessoa sobreposta a moto ou bicicleta;
  - recortes: os 5 melhores, separados no tempo, para a votação dos atributos.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import cv2
import numpy as np

MAX_RECORTES = 5
JUNTAR_S = 6.0  # até quantos segundos depois de sumir ainda dá para juntar
JUNTAR_DIST = 0.12  # distância máxima (fração da largura) para juntar
JUNTAR_APARENCIA = 0.55  # correlação mínima de histograma para juntar


def aparencia(img: np.ndarray, caixa) -> np.ndarray | None:
    h, w = img.shape[:2]
    x1, y1, x2, y2 = caixa
    bw, bh = x2 - x1, y2 - y1
    a, b = int(max(0, x1 + 0.2 * bw)), int(min(w, x2 - 0.2 * bw))
    c, d = int(max(0, y1 + 0.15 * bh)), int(min(h, y2 - 0.15 * bh))
    if b - a < 3 or d - c < 3:
        return None
    hsv = cv2.cvtColor(img[c:d, a:b], cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0, 1], None, [16, 8], [0, 180, 0, 256])
    return cv2.normalize(hist, hist).flatten()


def recorte(img: np.ndarray, caixa, margem: float = 0.08) -> tuple[np.ndarray, bool]:
    h, w = img.shape[:2]
    x1, y1, x2, y2 = caixa
    mx, my = (x2 - x1) * margem, (y2 - y1) * margem
    a, b, c, d = int(max(0, x1 - mx)), int(max(0, y1 - my)), int(min(w, x2 + mx)), int(min(h, y2 + my))
    borda = x1 <= 2 or y1 <= 2 or x2 >= w - 2 or y2 >= h - 2
    return img[b:d, a:c].copy(), borda


def no_poligono(poligonos_px: list[np.ndarray], ponto) -> bool:
    return any(cv2.pointPolygonTest(p, (float(ponto[0]), float(ponto[1])), False) >= 0 for p in poligonos_px)


@dataclass
class Objeto:
    uid: int
    tipo: str  # "pessoa" | "veiculo"
    classe: str
    inicio: float
    ultimo: float
    origem: np.ndarray
    pos: np.ndarray
    caixa: np.ndarray
    hist: np.ndarray | None
    vistos: int = 1
    desloc_max: float = 0.0  # fração da largura
    recortes: list = field(default_factory=list)  # (pontuação, ts, recorte)
    quadros: list = field(default_factory=list)  # (ts, jpeg)
    condutor: int = 0  # quadros sobreposto a moto/bicicleta
    contado: bool = False
    sentido: str | None = None
    trajeto: list = field(default_factory=list)
    registrado_em: float = 0.0  # quando foi mandado para a análise (registro preliminar)
    descartado: bool = False

    def confirmado(self, fps: float) -> bool:
        return self.ultimo - self.inicio >= 1.0 and self.vistos >= max(2, int(fps * 0.8))

    def eh_condutor(self) -> bool:
        return self.tipo == "pessoa" and self.condutor >= max(2, 0.3 * self.vistos)

    def guardar_recorte(self, img: np.ndarray, caixa, conf: float, ts: float) -> None:
        rec, borda = recorte(img, caixa)
        if not rec.size:
            return
        x1, y1, x2, y2 = caixa
        pont = float((x2 - x1) * (y2 - y1)) * float(conf) * (0.35 if borda else 1.0)
        # Recortes separados no tempo (variedade para a votação)
        perto = [i for i, (_, t, _) in enumerate(self.recortes) if abs(t - ts) < 0.6]
        if perto:
            i = perto[0]
            if pont > self.recortes[i][0]:
                self.recortes[i] = (pont, ts, rec)
            return
        self.recortes.append((pont, ts, rec))
        self.recortes.sort(key=lambda r: -r[0])
        del self.recortes[MAX_RECORTES:]


class Objetos:
    """Objetos de UM tipo numa câmera."""

    def __init__(self, tipo: str, largura: int, interna: bool, parado_s: float) -> None:
        self.tipo = tipo
        self.largura = largura
        self.interna = interna
        self.parado_s = parado_s
        self.vivos: dict[int, Objeto] = {}  # uid -> objeto
        self.alias: dict[int, int] = {}  # id do rastreador -> uid
        self.sumidos: list[Objeto] = []  # esperando a janela de junção
        self._prox = 1
        self.finalizados: list[Objeto] = []  # prontos para registrar (saíram de vez)

    def _juntar(self, pos: np.ndarray, hist, classe: str, ts: float) -> Objeto | None:
        melhor, nota = None, 0.0
        for o in self.sumidos:
            if ts - o.ultimo > JUNTAR_S or (self.tipo == "veiculo" and o.classe != classe and {o.classe, classe} - {"carro", "caminhao", "onibus"}):
                continue
            d = float(np.hypot(*(o.pos - pos))) / self.largura
            if d > JUNTAR_DIST * (1 + (ts - o.ultimo) / JUNTAR_S):
                continue
            ap = float(cv2.compareHist(o.hist, hist, cv2.HISTCMP_CORREL)) if o.hist is not None and hist is not None else 0.5
            if ap < JUNTAR_APARENCIA:
                continue
            n = ap - d
            if n > nota:
                melhor, nota = o, n
        if melhor is not None:
            self.sumidos.remove(melhor)
        return melhor

    def atualizar(self, ids, caixas, confs, classes, ts: float, img: np.ndarray, ponto_de) -> list[Objeto]:
        """ponto_de(caixa) -> ponto de referência (pé da pessoa, centro do veículo)."""
        vistos = []
        for tid, caixa, conf, classe in zip(ids, caixas, confs, classes):
            tid = int(tid)
            pos = np.array(ponto_de(caixa), dtype=float)
            uid = self.alias.get(tid)
            o = self.vivos.get(uid) if uid is not None else None
            if o is None:
                hist = aparencia(img, caixa)
                o = self._juntar(pos, hist, classe, ts)
                if o is None:
                    o = Objeto(self._prox, self.tipo, classe, ts, ts, pos.copy(), pos, np.array(caixa), hist)
                    self._prox += 1
                self.vivos[o.uid] = o
                self.alias[tid] = o.uid
            else:
                o.vistos += 1
                if o.vistos % 5 == 0:
                    h = aparencia(img, caixa)
                    if h is not None:
                        o.hist = h if o.hist is None else (0.7 * o.hist + 0.3 * h).astype(np.float32)
            o.ultimo, o.pos, o.caixa = ts, pos, np.array(caixa)
            if o.classe != classe and self.tipo == "veiculo" and o.vistos < 4:
                o.classe = classe
            o.desloc_max = max(o.desloc_max, float(np.hypot(*(pos - o.origem))) / self.largura)
            o.guardar_recorte(img, caixa, conf, ts)
            vistos.append(o)
        return vistos

    def manutencao(self, ts: float, sumir_s: float) -> None:
        """Objetos que sumiram vão para a janela de junção; depois dela, saem de vez."""
        for uid, o in list(self.vivos.items()):
            if ts - o.ultimo > sumir_s:
                del self.vivos[uid]
                self.sumidos.append(o)
        for o in [o for o in self.sumidos if ts - o.ultimo > JUNTAR_S]:
            self.sumidos.remove(o)
            self.finalizados.append(o)
        vivos = set(self.vivos)
        self.alias = {t: u for t, u in self.alias.items() if u in vivos}

    def parado_demais(self, o: Objeto) -> bool:
        """Pessoa que nunca se mexeu (desde que surgiu) por mais de parado_s."""
        return self.tipo == "pessoa" and not self.interna and o.ultimo - o.inicio >= self.parado_s and o.desloc_max < 0.03
