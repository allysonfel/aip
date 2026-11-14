"""Motor de visão do piloto da Lavateria Fast Bezerros (etapa 1).

Lê as câmeras do mediamtx (RTSP, rede interna do Coolify), detecta pessoas
e veículos com RF-DETR Nano (CPU), rastreia e conta quem cruza as linhas
virtuais. Tudo vai para o Postgres do painel:
  - cameras.quadro: último quadro anotado (caixas, linha, contagens), com
    as cabeças borradas quando a privacidade está ligada;
  - cameras.quadro_cru: quadro sem anotação (tela de configuração);
  - eventos: entrada/saída de pessoas e passagem de veículos (com sentido);
  - motor_status: uso de CPU e memória, quadros por segundo e tempo de
    inferência, para medir quantas câmeras a VPS aguenta.

O painel é dono do schema; o motor só espera as tabelas existirem.
Configuração (câmeras ativas, quadros por segundo, linhas) é relida do
banco a cada 10 s. Sem reconhecimento facial: só "pessoa", "carro" etc.
"""

from __future__ import annotations

import json
import os
import queue
import signal
import threading
import time
from dataclasses import dataclass, field

import cv2
import numpy as np
import psutil
import psycopg
import supervision as sv
import torch

from captura import FonteVideo

DATABASE_URL = os.environ["DATABASE_URL"]
RTSP_BASE = os.environ.get("MEDIAMTX_RTSP", "rtsp://mediamtx:8554").rstrip("/")
THREADS = int(os.environ.get("MOTOR_THREADS", "2"))
CONF_MIN = float(os.environ.get("MOTOR_CONFIANCA", "0.35"))

torch.set_num_threads(THREADS)
cv2.setNumThreads(1)

# Rótulos COCO originais usados pelo RF-DETR.
CLASSES = {1: "pessoa", 2: "bicicleta", 3: "carro", 4: "moto", 6: "onibus", 8: "caminhao"}
VEICULOS = {"bicicleta", "carro", "moto", "onibus", "caminhao"}

PARAR = threading.Event()


def log(*a) -> None:
    print(time.strftime("%H:%M:%S"), "[motor]", *a, flush=True)


# ---------------------------------------------------------------- detector

MODELO_ONNX = os.environ.get("MOTOR_ONNX") or next(iter(sorted(__import__("glob").glob("/app/modelo/*.onnx"))), "/app/modelo/rfdetr-nano.onnx")
RESOLUCAO = 384
MEDIA = np.array([0.485, 0.456, 0.406], dtype=np.float32)
DESVIO = np.array([0.229, 0.224, 0.225], dtype=np.float32)


class Detector:
    """RF-DETR Nano. Preferência: OpenVINO sobre o ONNX exportado no build
    (medido na VPS, 2 vCPU: 45 ms por quadro contra 176 ms do PyTorch, com a
    mesma entrada de 384 px). Se o OpenVINO falhar, usa o PyTorch."""

    def __init__(self) -> None:
        self.motor = "pytorch"
        self._req = None
        try:
            import openvino as ov

            core = ov.Core()
            modelo = core.compile_model(MODELO_ONNX, "CPU", {"INFERENCE_NUM_THREADS": THREADS, "PERFORMANCE_HINT": "LATENCY"})
            self._req = modelo.create_infer_request()
            self._saidas = [o.get_any_name() for o in modelo.outputs]
            self.motor = "openvino"
            log(f"detector: OpenVINO ({MODELO_ONNX}, {THREADS} threads)")
        except Exception as e:
            log("OpenVINO indisponível, usando PyTorch:", repr(e)[:300])
            torch.set_num_threads(THREADS)
            from rfdetr import RFDETRNano

            m = RFDETRNano(device="cpu")
            try:
                self._torch = m.inference()
            except Exception:
                self._torch = m

    def detectar(self, bgr: np.ndarray) -> sv.Detections:
        h, w = bgr.shape[:2]
        if self._req is None:
            with torch.inference_mode():
                d = self._torch.predict(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), threshold=CONF_MIN)
            return d[np.isin(d.class_id, list(CLASSES))]
        rgb = cv2.cvtColor(cv2.resize(bgr, (RESOLUCAO, RESOLUCAO), interpolation=cv2.INTER_LINEAR), cv2.COLOR_BGR2RGB)
        x = ((rgb.astype(np.float32) / 255.0 - MEDIA) / DESVIO).transpose(2, 0, 1)[None]
        r = self._req.infer({0: np.ascontiguousarray(x)})
        vals = {k.get_any_name(): v for k, v in r.items()}
        caixas, logits = vals.get("dets", list(vals.values())[0])[0], vals.get("labels", list(vals.values())[1])[0]
        # Mesmo pós-processamento do RF-DETR: as 300 maiores probabilidades
        # entre todas as consultas x classes.
        prob = 1.0 / (1.0 + np.exp(-logits))
        plano = prob.reshape(-1)
        topo = np.argpartition(-plano, 300)[:300]
        topo = topo[plano[topo] > CONF_MIN]
        if not len(topo):
            return sv.Detections.empty()
        q, cls = topo // prob.shape[1], topo % prob.shape[1]
        manter = np.isin(cls, list(CLASSES))
        q, cls, conf = q[manter], cls[manter], plano[topo][manter]
        cx, cy, bw, bh = caixas[q].T
        xyxy = np.stack([(cx - bw / 2) * w, (cy - bh / 2) * h, (cx + bw / 2) * w, (cy + bh / 2) * h], axis=1).clip(0, [w, h, w, h])
        d = sv.Detections(xyxy=xyxy.astype(np.float32), confidence=conf.astype(np.float32), class_id=cls.astype(int))
        # A mesma consulta pode aparecer em duas classes (ex.: carro e caminhão): fica a mais provável.
        return d.with_nms(threshold=0.7, class_agnostic=True)


# ---------------------------------------------------------------- linhas

LINHA_FAIXA_MORTA = 0.008
LINHA_TOLERANCIA_PONTAS = 0.08


class Linha:
    """Cruzamento de linha (adaptado do ContadorLinha do motor do shopping):
    o lado de cada ID fica guardado enquanto ele existir, então quem some
    por um quadro (comum a 2 quadros por segundo) ainda conta. Devolve "a"
    quando termina do lado negativo (produto vetorial com fim - início) e
    "b" no outro sentido."""

    def __init__(self, a, b, largura: int, faixa_rel: float = LINHA_FAIXA_MORTA) -> None:
        self.a = np.array(a, dtype=float)
        self.b = np.array(b, dtype=float)
        self.v = self.b - self.a
        self.comp = float(np.hypot(*self.v)) or 1.0
        self.faixa = faixa_rel * largura
        self._lado: dict[int, tuple[bool, np.ndarray]] = {}

    def _dist(self, p: np.ndarray) -> float:
        d = p - self.a
        return float(d[0] * self.v[1] - d[1] * self.v[0]) / self.comp

    def atualizar(self, tid: int, ponto) -> str | None:
        p = np.array(ponto, dtype=float)
        dist = self._dist(p)
        if abs(dist) < self.faixa:
            return None
        lado = dist < 0
        anterior = self._lado.get(tid)
        self._lado[tid] = (lado, p)
        if anterior is None or anterior[0] == lado:
            return None
        p0 = anterior[1]
        d0 = self._dist(p0)
        x = p0 + (p - p0) * (d0 / (d0 - dist))
        u = float(np.dot(x - self.a, self.v)) / self.comp**2
        if -LINHA_TOLERANCIA_PONTAS <= u <= 1 + LINHA_TOLERANCIA_PONTAS:
            return "a" if lado else "b"
        return None

    def esquecer(self, vivos: set[int]) -> None:
        self._lado = {k: v for k, v in self._lado.items() if k in vivos}


# ---------------------------------------------------------------- rastreio de veículos


@dataclass
class _Veiculo:
    id: int
    classe: str
    centro: np.ndarray
    visto: float
    caixa: np.ndarray
    origem: np.ndarray | None = None
    contado: bool = False
    sentido: str | None = None
    inicio: float = 0.0


class RastreadorVeiculos:
    """A 2 quadros por segundo um carro anda boa parte da imagem entre um
    quadro e outro, e o ByteTrack (que depende de sobreposição de caixas)
    perde o veículo. Aqui a associação é pelo centro mais próximo, dentro
    de um raio proporcional à imagem, preferindo a mesma classe."""

    def __init__(self, largura: int, raio_rel: float = 0.25, validade_s: float = 1.6) -> None:
        self.raio = raio_rel * largura
        self.validade = validade_s
        self._v: dict[int, _Veiculo] = {}
        self._prox = 1
        self.saiu: list[_Veiculo] = []

    def atualizar(self, caixas: np.ndarray, classes: list[str], ts: float) -> list[_Veiculo]:
        self.saiu = [v for v in self._v.values() if ts - v.visto > self.validade]
        self._v = {k: v for k, v in self._v.items() if ts - v.visto <= self.validade}
        livres = dict(self._v)
        saida: list[_Veiculo] = []
        centros = [np.array([(c[0] + c[2]) / 2, (c[1] + c[3]) / 2]) for c in caixas]
        ordem = sorted(range(len(caixas)), key=lambda i: -(caixas[i][2] - caixas[i][0]) * (caixas[i][3] - caixas[i][1]))
        for i in ordem:
            melhor, dmin = None, self.raio
            for vid, v in livres.items():
                d = float(np.hypot(*(v.centro - centros[i])))
                if v.classe != classes[i]:
                    d *= 1.6
                if d < dmin:
                    melhor, dmin = vid, d
            if melhor is None:
                melhor = self._prox
                self._prox += 1
            else:
                livres.pop(melhor)
            antes = self._v.get(melhor)
            v = _Veiculo(melhor, classes[i], centros[i], ts, caixas[i], origem=antes.origem if antes else centros[i], contado=bool(antes and antes.contado),
                         sentido=antes.sentido if antes else None, inicio=antes.inicio if antes else ts)
            self._v[melhor] = v
            saida.append(v)
        return saida

    def vivos(self) -> set[int]:
        return set(self._v)


# ---------------------------------------------------------------- câmeras


@dataclass
class Camera:
    canal: str
    caminho: str
    nome: str
    fps: float
    tipo_linha: str | None
    linha: dict | None
    calibracao: dict | None = None
    fonte: FonteVideo | None = None
    proximo: float = 0.0
    rastreador: sv.ByteTrack | None = None
    veiculos: RastreadorVeiculos | None = None
    contador: Linha | None = None
    chave_linha: str = ""
    tamanho: tuple[int, int] | None = None
    ultimo_cru: float = 0.0
    ultimo_seq: int = -1
    processados: list[float] = field(default_factory=list)
    contagem: dict[str, int] = field(default_factory=dict)
    rastros: dict[int, "Rastro"] = field(default_factory=dict)
    rastros_v: dict[int, "Rastro"] = field(default_factory=dict)
    noturna: bool | None = None
    transformador: sv.ViewTransformer | None = None
    trajeto_v: dict[int, list] = field(default_factory=dict)
    jpeg_cena: tuple[int, bytes] | None = None
    poligono: np.ndarray | None = None

    def fps_processado(self) -> float:
        agora = time.time()
        self.processados = [t for t in self.processados if agora - t <= 10]
        return round(len(self.processados) / 10, 2)


def montar_rastreio(cam: Camera, largura: int, altura: int) -> None:
    cam.tamanho = (largura, altura)
    cam.rastreador = sv.ByteTrack(
        track_activation_threshold=0.35,
        lost_track_buffer=max(4, int(cam.fps * 4)),
        minimum_matching_threshold=0.9,
        frame_rate=max(1, int(round(cam.fps))),
        minimum_consecutive_frames=1,
    )
    cam.veiculos = RastreadorVeiculos(largura)
    cam.transformador = None
    cal = cam.calibracao or {}
    pts = cal.get("pontos")
    if pts and len(pts) == 4 and cal.get("largura_m") and cal.get("comprimento_m"):
        # 4 pontos sobre a rua (na ordem: frente-esquerda, frente-direita,
        # fundo-direita, fundo-esquerda) e as medidas reais do trecho.
        fonte = np.array([[p[0] * largura, p[1] * altura] for p in pts], dtype=np.float32)
        lw, lc = float(cal["largura_m"]), float(cal["comprimento_m"])
        alvo = np.array([[0, lc], [lw, lc], [lw, 0], [0, 0]], dtype=np.float32)
        cam.transformador = sv.ViewTransformer(source=fonte, target=alvo)
        cam.poligono = fonte
    cam.contador = None
    cam.chave_linha = json.dumps(cam.linha, sort_keys=True) if cam.linha else ""
    if cam.tipo_linha and cam.linha:
        a = (cam.linha["a"][0] * largura, cam.linha["a"][1] * altura)
        b = (cam.linha["b"][0] * largura, cam.linha["b"][1] * altura)
        cam.contador = Linha(a, b, largura, faixa_rel=0.03 if cam.tipo_linha == "veiculos" else 0.015)


# ---------------------------------------------------------------- privacidade e desenho


def borrar_cabecas(img: np.ndarray, caixas: np.ndarray) -> None:
    """Borra a parte de cima de cada pessoa (onde fica o rosto). Não é
    detecção de rosto: é uma faixa fixa da caixa, para não depender de
    achar o rosto de longe ou de costas."""
    h, w = img.shape[:2]
    for x1, y1, x2, y2 in caixas:
        bw, bh = x2 - x1, y2 - y1
        cx1 = int(max(0, x1 - 0.1 * bw))
        cx2 = int(min(w, x2 + 0.1 * bw))
        cy1 = int(max(0, y1 - 0.05 * bh))
        cy2 = int(min(h, y1 + 0.24 * bh))
        if cx2 - cx1 < 3 or cy2 - cy1 < 3:
            continue
        regiao = img[cy1:cy2, cx1:cx2]
        k = max(9, (min(regiao.shape[:2]) // 2) | 1)
        img[cy1:cy2, cx1:cx2] = cv2.GaussianBlur(regiao, (k, k), 0)


def imagem_noturna_rapida(bgr: np.ndarray) -> bool:
    peq = cv2.resize(bgr, (96, 64))
    return float(cv2.cvtColor(peq, cv2.COLOR_BGR2HSV)[..., 1].mean()) < 14


def jpeg(img: np.ndarray, qualidade: int = 72) -> bytes:
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, qualidade])
    return buf.tobytes() if ok else b""



# ---------------------------------------------------------------- recortes e atributos

ANALISAR_APOS_S = 6.0  # pessoa presente há 6 s: já dá para analisar com um bom recorte
PESSOA_SAIU_S = 3.0


@dataclass
class Rastro:
    inicio: float
    ultimo: float
    pontuacao: float = 0.0
    recorte: np.ndarray | None = None
    analisado: bool = False
    quadros: list = field(default_factory=list)  # (ts, jpeg) a cada ~1 s, para a busca


def recorte_com_margem(img: np.ndarray, caixa, margem: float = 0.08) -> tuple[np.ndarray, bool]:
    h, w = img.shape[:2]
    x1, y1, x2, y2 = caixa
    mx, my = (x2 - x1) * margem, (y2 - y1) * margem
    a, b, c, d = int(max(0, x1 - mx)), int(max(0, y1 - my)), int(min(w, x2 + mx)), int(min(h, y2 + my))
    borda = x1 <= 2 or y1 <= 2 or x2 >= w - 2 or y2 >= h - 2
    return img[b:d, a:c].copy(), borda


def cena_jpeg(cam: "Camera", img: np.ndarray, seq: int) -> bytes:
    """Quadro inteiro reduzido (para a sequência de imagens da busca), uma vez por quadro analisado."""
    if cam.jpeg_cena is None or cam.jpeg_cena[0] != seq:
        h, w = img.shape[:2]
        esc = min(1.0, 640 / w)
        peq = cv2.resize(img, (int(w * esc), int(h * esc))) if esc < 1 else img
        cam.jpeg_cena = (seq, jpeg(peq, 70))
    return cam.jpeg_cena[1]


def guardar_quadro(r: "Rastro", ts: float, obter) -> None:
    if not r.quadros or ts - r.quadros[-1][0] >= 1.0:
        r.quadros.append((ts, obter()))
        if len(r.quadros) > 8:
            del r.quadros[1]  # mantém o primeiro (chegada) e os mais recentes


def atualizar_rastro(rastros: dict, chave: int, img: np.ndarray, caixa, conf: float, ts: float) -> "Rastro":
    r = rastros.get(chave)
    if r is None:
        r = Rastro(inicio=ts, ultimo=ts)
        rastros[chave] = r
    r.ultimo = ts
    x1, y1, x2, y2 = caixa
    rec, borda = recorte_com_margem(img, caixa)
    # Melhor recorte: maior área, mais confiança e sem encostar na borda da imagem.
    pont = (x2 - x1) * (y2 - y1) * float(conf) * (0.35 if borda else 1.0)
    if pont > r.pontuacao and rec.size:
        r.pontuacao, r.recorte = pont, rec
    return r



def velocidade_kmh(trajeto: list) -> float | None:
    """Velocidade pelo trajeto em metros (perspectiva corrigida pela
    calibração): deslocamento entre o primeiro e o último ponto dentro do
    trecho calibrado, dividido pelo tempo. Precisa de 2 pontos e 0,4 s."""
    if len(trajeto) < 2:
        return None
    (t0, p0), (t1, p1) = trajeto[0], trajeto[-1]
    dt = t1 - t0
    if dt < 0.4:
        return None
    v = float(np.hypot(*(np.array(p1) - np.array(p0)))) / dt * 3.6
    return round(v, 1) if 0 < v < 200 else None


class Analisador(threading.Thread):
    """Fila de análise de atributos em segundo plano (uma pessoa ou veículo por
    vez), com conexão própria ao banco: não atrasa a detecção das câmeras."""

    def __init__(self) -> None:
        super().__init__(daemon=True, name="atributos")
        self.fila: queue.Queue = queue.Queue(maxsize=200)
        self.ms: list[float] = []
        self.descartados = 0
        self.modelos = None

    def enviar(self, tarefa: tuple) -> None:
        try:
            self.fila.put_nowait(tarefa)
        except queue.Full:
            self.descartados += 1

    def run(self) -> None:
        from atributos import Atributos

        try:
            self.modelos = Atributos(threads=1)
            log("atributos: modelos carregados (CLIP + Intel)")
        except Exception as e:
            log("atributos indisponíveis:", repr(e)[:300])
        db = psycopg.connect(DATABASE_URL, autocommit=True)
        while not PARAR.is_set():
            try:
                tarefa = self.fila.get(timeout=1)
            except queue.Empty:
                continue
            try:
                self._fazer(db, tarefa)
            except psycopg.Error as e:
                log("atributos: erro de banco:", e)
                try:
                    db.close()
                except Exception:
                    pass
                time.sleep(2)
                db = psycopg.connect(DATABASE_URL, autocommit=True)
            except Exception as e:
                log("atributos: erro:", repr(e)[:300])

    def _fazer(self, db, tarefa: tuple) -> None:
        tipo = tarefa[0]
        if tipo == "pessoa_fim":
            _, canal, tid, inicio, fim = tarefa
            with db.cursor() as c:
                c.execute("UPDATE pessoas SET fim = to_timestamp(%s) WHERE canal = %s AND track_id = %s AND inicio = to_timestamp(%s)", (fim, canal, tid, inicio))
            return
        t0 = time.perf_counter()
        if tipo == "pessoa":
            _, canal, tid, inicio, fim, rec, noturna, quadros = tarefa
            attrs = self.modelos.pessoa(rec, noturna) if self.modelos else {}
            assinatura = attrs.pop("_assinatura", None)
            with db.cursor() as c:
                c.execute(
                    """INSERT INTO pessoas (canal, track_id, inicio, fim, recorte, atributos, noturna, assinatura)
                       VALUES (%s, %s, to_timestamp(%s), to_timestamp(%s), %s, %s, %s, %s) RETURNING id""",
                    (canal, tid, inicio, fim, jpeg(rec, 88), json.dumps(attrs), noturna, assinatura),
                )
                pid = c.fetchone()[0]
                for ts, img in quadros:
                    c.execute("INSERT INTO quadros_momento (tipo, ref_id, ts, img) VALUES ('pessoa', %s, to_timestamp(%s), %s)", (pid, ts, img))
        elif tipo == "veiculo":
            _, canal, vid, classe, inicio, fim, sentido, rec, noturna, vel, desloc, quadros = tarefa
            attrs = self.modelos.veiculo(rec, noturna) if self.modelos else {}
            cor = attrs.get("cor", {})
            with db.cursor() as c:
                c.execute(
                    """INSERT INTO veiculos (canal, track_id, classe, inicio, fim, sentido, recorte, cor, cor_conf, atributos, noturna, velocidade_kmh, deslocamento)
                       VALUES (%s, %s, %s, to_timestamp(%s), to_timestamp(%s), %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                    (canal, vid, classe, inicio, fim, sentido, jpeg(rec, 88), cor.get("valor"), cor.get("conf"), json.dumps(attrs), noturna, vel, desloc),
                )
                vid_db = c.fetchone()[0]
                for ts, img in quadros:
                    c.execute("INSERT INTO quadros_momento (tipo, ref_id, ts, img) VALUES ('veiculo', %s, to_timestamp(%s), %s)", (vid_db, ts, img))
        self.ms.append((time.perf_counter() - t0) * 1000)
        self.ms = self.ms[-50:]


# ---------------------------------------------------------------- motor


class Motor:
    def __init__(self) -> None:
        self.db = psycopg.connect(DATABASE_URL, autocommit=True)
        self.cameras: dict[str, Camera] = {}
        self.borrar = True
        self.retencao_dias = 30
        self.ms_inferencia: list[float] = []
        self.proc = psutil.Process()
        self.proc.cpu_percent(None)
        self._ultimo_status = 0.0
        self._ultima_config = 0.0
        self._ultima_limpeza = 0.0
        self._ultimo_cru_inativas = 0.0
        self.detector = Detector()
        self.analisador = Analisador()
        self.analisador.start()

    # ---------- banco

    def esperar_schema(self) -> None:
        while not PARAR.is_set():
            try:
                with self.db.cursor() as c:
                    c.execute("SELECT to_regclass('public.cameras') IS NOT NULL AND to_regclass('public.motor_status') IS NOT NULL")
                    if c.fetchone()[0]:
                        return
            except psycopg.Error as e:
                log("banco indisponível:", e)
                self._reconectar()
            log("esperando o painel criar as tabelas...")
            time.sleep(5)

    def _reconectar(self) -> None:
        try:
            self.db.close()
        except Exception:
            pass
        time.sleep(2)
        self.db = psycopg.connect(DATABASE_URL, autocommit=True)

    def ler_config(self) -> None:
        with self.db.cursor() as c:
            c.execute("SELECT chave, valor FROM config")
            cfg = {k: v for k, v in c.fetchall()}
            self.borrar = bool(cfg.get("borrar_rostos", True))
            self.retencao_dias = int(cfg.get("retencao_dias", 30))
            c.execute("SELECT canal, caminho, nome, ativa, fps, tipo_linha, linha, calibracao FROM cameras ORDER BY canal")
            linhas = c.fetchall()
        ativas = {r[0] for r in linhas if r[3]}
        for canal in list(self.cameras):
            if canal not in ativas:
                self._parar_camera(canal)
        for canal, caminho, nome, ativa, fps, tipo_linha, linha, calibracao in linhas:
            if not ativa:
                continue
            cam = self.cameras.get(canal)
            if cam and cam.caminho != caminho:
                self._parar_camera(canal)
                cam = None
            if cam is None:
                cam = Camera(canal, caminho, nome, float(fps), tipo_linha, linha, calibracao)
                cam.fonte = FonteVideo(f"{RTSP_BASE}/lavateria/{caminho}", eh_arquivo=False)
                cam.fonte.iniciar()
                self.cameras[canal] = cam
                log(f"câmera {canal} ({nome}) ligada a {fps} q/s")
            else:
                mudou = (
                    cam.fps != float(fps) or cam.tipo_linha != tipo_linha
                    or (json.dumps(linha, sort_keys=True) if linha else "") != cam.chave_linha
                    or json.dumps(calibracao, sort_keys=True) != json.dumps(cam.calibracao, sort_keys=True)
                )
                cam.nome, cam.fps, cam.tipo_linha, cam.linha, cam.calibracao = nome, float(fps), tipo_linha, linha, calibracao
                if mudou and cam.tamanho:
                    montar_rastreio(cam, *cam.tamanho)
                    log(f"câmera {canal}: configuração atualizada")

    def _parar_camera(self, canal: str) -> None:
        cam = self.cameras.pop(canal, None)
        if cam and cam.fonte:
            cam.fonte.parar()
            log(f"câmera {canal} desligada")

    def salvar_evento(self, canal: str, tipo: str, classe: str, sentido: str | None, tid: int) -> None:
        with self.db.cursor() as c:
            c.execute(
                "INSERT INTO eventos (canal, tipo, classe, sentido, track_id) VALUES (%s, %s, %s, %s, %s)",
                (canal, tipo, classe, sentido, tid),
            )

    def contagem_hoje(self, cam: Camera) -> None:
        """Contagem do dia (horário de Brasília) para escrever no quadro."""
        coluna = "tipo" if cam.tipo_linha == "entrada" else "sentido"
        with self.db.cursor() as c:
            c.execute(
                f"""SELECT {coluna}, count(*) FROM eventos WHERE canal = %s
                    AND ocorrido_em >= (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo')
                    GROUP BY 1""",
                (cam.canal,),
            )
            cam.contagem = dict(c.fetchall())

    # ---------- processamento

    def detectar(self, bgr: np.ndarray) -> sv.Detections:
        t0 = time.perf_counter()
        dets = self.detector.detectar(bgr)
        self.ms_inferencia.append((time.perf_counter() - t0) * 1000)
        self.ms_inferencia = self.ms_inferencia[-50:]
        return dets

    def processar(self, cam: Camera) -> None:
        q = cam.fonte.ultimo() if cam.fonte else None
        if q is None or q.seq == cam.ultimo_seq:
            return
        cam.ultimo_seq = q.seq
        img = q.imagem
        h, w = img.shape[:2]
        if cam.tamanho != (w, h):
            montar_rastreio(cam, w, h)
            self.contagem_hoje(cam)
        dets = self.detectar(img)
        nomes = [CLASSES[int(c)] for c in dets.class_id]
        e_pessoa = np.array([n == "pessoa" for n in nomes], dtype=bool)
        pessoas = cam.rastreador.update_with_detections(dets[e_pessoa] if len(dets) else sv.Detections.empty())
        if pessoas.tracker_id is None:
            pessoas.tracker_id = np.array([], dtype=int)
        # Veículos só contam (e aparecem) na câmera da rua: nas internas, o
        # carro visto pela porta de vidro não interessa.
        idx_v = [i for i, n in enumerate(nomes) if n in VEICULOS] if cam.tipo_linha == "veiculos" else []
        veiculos = cam.veiculos.atualizar(dets.xyxy[idx_v] if idx_v else np.zeros((0, 4)), [nomes[i] for i in idx_v], q.ts)

        # Recortes para os atributos (uma análise por pessoa ou veículo).
        cam.noturna = imagem_noturna_rapida(img)  # barato: imagem de 96x64
        vivos = set()
        for caixa, tid, conf in zip(pessoas.xyxy, pessoas.tracker_id, pessoas.confidence if pessoas.confidence is not None else np.ones(len(pessoas))):
            tid = int(tid)
            vivos.add(tid)
            r = atualizar_rastro(cam.rastros, tid, img, caixa, conf, q.ts)
            guardar_quadro(r, q.ts, lambda: cena_jpeg(cam, img, q.seq))
            if not r.analisado and q.ts - r.inicio >= ANALISAR_APOS_S and r.recorte is not None:
                r.analisado = True
                self.analisador.enviar(("pessoa", cam.canal, tid, r.inicio, q.ts, r.recorte, cam.noturna, list(r.quadros)))
        for tid in [t for t, r in cam.rastros.items() if t not in vivos and q.ts - r.ultimo > PESSOA_SAIU_S]:
            r = cam.rastros.pop(tid)
            if r.analisado:
                self.analisador.enviar(("pessoa_fim", cam.canal, tid, r.inicio, r.ultimo))
            elif r.recorte is not None and r.ultimo - r.inicio >= 1.0:
                self.analisador.enviar(("pessoa", cam.canal, tid, r.inicio, r.ultimo, r.recorte, cam.noturna, list(r.quadros)))
        for v in veiculos:
            r = atualizar_rastro(cam.rastros_v, v.id, img, v.caixa, 1.0, q.ts)
            guardar_quadro(r, q.ts, lambda: cena_jpeg(cam, img, q.seq))
            pe = np.array([[(v.caixa[0] + v.caixa[2]) / 2, v.caixa[3]]], dtype=np.float32)  # ponto de contato com o chão
            dentro = cam.poligono is None or cv2.pointPolygonTest(cam.poligono, (float(pe[0][0]), float(pe[0][1])), False) >= 0
            if cam.transformador is not None and dentro:
                cam.trajeto_v.setdefault(v.id, []).append((q.ts, cam.transformador.transform_points(pe)[0]))
        for v in cam.veiculos.saiu:
            r = cam.rastros_v.pop(v.id, None)
            trajeto = cam.trajeto_v.pop(v.id, [])
            if r is not None and r.recorte is not None:
                desloc = float(np.hypot(*(v.centro - v.origem))) / w if v.origem is not None else 0.0
                self.analisador.enviar(("veiculo", cam.canal, v.id, v.classe, v.inicio, v.visto, v.sentido, r.recorte, cam.noturna, velocidade_kmh(trajeto), round(desloc, 3), list(r.quadros)))
        cam.veiculos.saiu = []

        mudou = False
        if cam.contador is not None:
            if cam.tipo_linha == "entrada":
                for (x1, y1, x2, y2), tid in zip(pessoas.xyxy, pessoas.tracker_id):
                    s = cam.contador.atualizar(int(tid), ((x1 + x2) / 2, y2))
                    if s:
                        self.salvar_evento(cam.canal, "entrada" if s == "a" else "saida", "pessoa", s, int(tid))
                        mudou = True
                cam.contador.esquecer({int(t) for t in pessoas.tracker_id})
            elif cam.tipo_linha == "veiculos":
                for v in veiculos:
                    s = cam.contador.atualizar(v.id, tuple(v.centro))
                    # Conta uma vez só por veículo, e só se ele andou de verdade
                    # (carro parado perto da linha "cruzava" a cada tremida da caixa).
                    andou = v.origem is not None and float(np.hypot(*(v.centro - v.origem))) >= 0.06 * w
                    if s and not v.contado and andou:
                        v.contado = True
                        v.sentido = s
                        self.salvar_evento(cam.canal, "veiculo", v.classe, s, v.id)
                        mudou = True
                cam.contador.esquecer(cam.veiculos.vivos())
        if mudou:
            self.contagem_hoje(cam)

        # Caixas para o navegador desenhar por cima do vídeo (posições de 0 a 1).
        objetos = [
            {"id": int(t), "c": "pessoa", "b": [round(float(x1) / w, 4), round(float(y1) / h, 4), round(float(x2) / w, 4), round(float(y2) / h, 4)]}
            for (x1, y1, x2, y2), t in zip(pessoas.xyxy, pessoas.tracker_id)
        ] + [
            {"id": 100000 + v.id, "c": v.classe, "b": [round(float(v.caixa[0]) / w, 4), round(float(v.caixa[1]) / h, 4), round(float(v.caixa[2]) / w, 4), round(float(v.caixa[3]) / h, 4)]}
            for v in veiculos
        ]
        cam.processados.append(time.time())
        agora = time.time()
        with self.db.cursor() as c:
            c.execute(
                "INSERT INTO deteccoes (canal, ts, objetos) VALUES (%s, %s, %s)",
                (cam.canal, int(q.ts * 1000), json.dumps(objetos)),
            )
            c.execute(
                "UPDATE cameras SET pessoas_agora = %s, veiculos_agora = %s, online = true, erro = NULL, contagem_hoje = %s WHERE canal = %s",
                (int(len(pessoas)), len(veiculos), json.dumps(cam.contagem), cam.canal),
            )
            if agora - cam.ultimo_cru > 5:
                cam.ultimo_cru = agora
                base = img.copy()
                if self.borrar and len(pessoas):
                    borrar_cabecas(base, pessoas.xyxy)
                c.execute(
                    "UPDATE cameras SET quadro_cru = %s, quadro_cru_em = now(), largura = %s, altura = %s WHERE canal = %s",
                    (jpeg(base, 80), w, h, cam.canal),
                )

    def atualizar_offline(self) -> None:
        with self.db.cursor() as c:
            for cam in self.cameras.values():
                if cam.fonte and not cam.fonte.online:
                    c.execute("UPDATE cameras SET online = false, erro = %s WHERE canal = %s", (cam.fonte.erro or "sem imagem", cam.canal))

    def quadros_das_inativas(self) -> None:
        """A tela de configuração mostra um quadro de TODAS as câmeras (para
        conferir nomes e funções), mesmo as que o motor não analisa ainda."""
        with self.db.cursor() as c:
            c.execute("SELECT canal, caminho FROM cameras WHERE NOT ativa AND (quadro_cru_em IS NULL OR quadro_cru_em < now() - interval '10 minutes')")
            pendentes = c.fetchall()
        for canal, caminho in pendentes:
            cap = cv2.VideoCapture(f"{RTSP_BASE}/lavateria/{caminho}", cv2.CAP_FFMPEG)
            ok, img = cap.read() if cap.isOpened() else (False, None)
            cap.release()
            if not ok or img is None:
                continue
            if self.borrar:
                dets = self.detectar(img)
                borrar_cabecas(img, dets[dets.class_id == 1].xyxy)
            with self.db.cursor() as c:
                c.execute("UPDATE cameras SET quadro_cru = %s, quadro_cru_em = now(), largura = %s, altura = %s WHERE canal = %s", (jpeg(img, 80), img.shape[1], img.shape[0], canal))

    def escrever_status(self) -> None:
        cpu = self.proc.cpu_percent(None)  # % de UM núcleo (200% = 2 vCPU)
        mem = self.proc.memory_info().rss / 1e6
        cams = {
            k: {"nome": c.nome, "fps_alvo": c.fps, "fps_processado": c.fps_processado(), "fps_camera": c.fonte.fps_medido if c.fonte else 0, "online": bool(c.fonte and c.fonte.online)}
            for k, c in self.cameras.items()
        }
        ms = float(np.mean(self.ms_inferencia)) if self.ms_inferencia else None
        cams["_atributos"] = {"nome": "atributos", "fila": self.analisador.fila.qsize(), "ms": round(float(np.mean(self.analisador.ms)), 1) if self.analisador.ms else None, "descartados": self.analisador.descartados}
        with self.db.cursor() as c:
            c.execute(
                """INSERT INTO motor_status (id, cpu_pct, mem_mb, ms_inferencia, threads, cameras, detector, atualizado_em)
                   VALUES (1, %s, %s, %s, %s, %s, %s, now())
                   ON CONFLICT (id) DO UPDATE SET cpu_pct = EXCLUDED.cpu_pct, mem_mb = EXCLUDED.mem_mb, ms_inferencia = EXCLUDED.ms_inferencia,
                     threads = EXCLUDED.threads, cameras = EXCLUDED.cameras, detector = EXCLUDED.detector, atualizado_em = now()""",
                (round(cpu, 1), round(mem), ms and round(ms, 1), THREADS, json.dumps(cams), self.detector.motor),
            )
            c.execute(
                "INSERT INTO motor_amostras (cpu_pct, mem_mb, ms_inferencia, cameras_ativas, fps_total) VALUES (%s, %s, %s, %s, %s)",
                (round(cpu, 1), round(mem), ms and round(ms, 1), len(self.cameras), sum(v.get("fps_processado", 0) for v in cams.values())),
            )

    def limpar(self) -> None:
        with self.db.cursor() as c:
            c.execute("DELETE FROM eventos WHERE ocorrido_em < now() - make_interval(days => %s)", (self.retencao_dias,))
            c.execute("DELETE FROM pessoas WHERE inicio < now() - make_interval(days => %s)", (self.retencao_dias,))
            c.execute("DELETE FROM veiculos WHERE inicio < now() - make_interval(days => %s)", (self.retencao_dias,))
            c.execute("DELETE FROM quadros_momento WHERE ts < now() - make_interval(days => %s)", (self.retencao_dias,))
            c.execute("DELETE FROM motor_amostras WHERE em < now() - interval '30 days'")

    def rodar(self) -> None:
        self.esperar_schema()
        log("schema encontrado, começando")
        while not PARAR.is_set():
            try:
                agora = time.time()
                if agora - self._ultima_config > 10:
                    self._ultima_config = agora
                    self.ler_config()
                if agora - self._ultimo_cru_inativas > 60:
                    self._ultimo_cru_inativas = agora
                    self.quadros_das_inativas()
                if agora - self._ultima_limpeza > 3600:
                    self._ultima_limpeza = agora
                    self.limpar()
                trabalhou = False
                for cam in list(self.cameras.values()):
                    if time.time() >= cam.proximo:
                        periodo = 1.0 / max(0.2, cam.fps)
                        cam.proximo = max(cam.proximo + periodo, time.time() - periodo)
                        self.processar(cam)
                        trabalhou = True
                if time.time() - self._ultimo_status > 5:
                    self._ultimo_status = time.time()
                    self.atualizar_offline()
                    self.escrever_status()
                    with self.db.cursor() as c:
                        c.execute("DELETE FROM deteccoes WHERE criado_em < now() - interval '2 minutes'")
                if not trabalhou:
                    time.sleep(0.03)
            except psycopg.Error as e:
                log("erro de banco, reconectando:", e)
                self._reconectar()
            except Exception as e:  # nunca derrubar o motor por uma câmera
                log("erro:", repr(e))
                time.sleep(1)
        for canal in list(self.cameras):
            self._parar_camera(canal)


def main() -> None:
    signal.signal(signal.SIGTERM, lambda *_: PARAR.set())
    signal.signal(signal.SIGINT, lambda *_: PARAR.set())
    Motor().rodar()


if __name__ == "__main__":
    main()
