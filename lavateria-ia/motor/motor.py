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
from regras import Regras
from objetos import Objetos, no_poligono
from atributos import ganhos_da_imagem

DATABASE_URL = os.environ["DATABASE_URL"]
RTSP_BASE = os.environ.get("MEDIAMTX_RTSP", "rtsp://mediamtx:8554").rstrip("/")
THREADS = int(os.environ.get("MOTOR_THREADS", "2"))
CONF_MIN = float(os.environ.get("MOTOR_CONFIANCA", "0.35"))

torch.set_num_threads(THREADS)
cv2.setNumThreads(1)

# Rótulos COCO originais usados pelo RF-DETR.
CLASSES = {1: "pessoa", 2: "bicicleta", 3: "carro", 4: "moto", 6: "onibus", 8: "caminhao", 17: "gato", 18: "cachorro"}
PETS = {"gato", "cachorro"}
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
    interna: bool = False
    fachada: bool = False
    zona_totem: list | None = None
    conf_min: float = 0.4
    exclusao: list | None = None  # polígonos (0 a 1) onde nada é detectado
    fonte: FonteVideo | None = None
    proximo: float = 0.0
    rastreador: sv.ByteTrack | None = None
    veiculos: RastreadorVeiculos | None = None
    objs_p: Objetos | None = None
    objs_v: Objetos | None = None
    contador: Linha | None = None
    chave_linha: str = ""
    tamanho: tuple[int, int] | None = None
    ultimo_cru: float = 0.0
    ultimo_seq: int = -1
    processados: list[float] = field(default_factory=list)
    contagem: dict[str, int] = field(default_factory=dict)
    noturna: bool | None = None
    transformador: sv.ViewTransformer | None = None
    jpeg_cena: tuple[int, bytes] | None = None
    poligono: np.ndarray | None = None
    exclusao_px: list = field(default_factory=list)
    ganhos: np.ndarray | None = None  # balanço de branco (B, G, R)
    ganhos_em: float = 0.0

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
    # Pessoa que nunca se mexeu: 20 s nas câmeras de rua (lixo, sombra); nas
    # internas não se descarta (cliente sentado esperando a roupa).
    cam.objs_p = Objetos("pessoa", largura, cam.interna, parado_s=20.0)
    cam.objs_v = Objetos("veiculo", largura, cam.interna, parado_s=1e9)
    cam.exclusao_px = [np.array([[p[0] * largura, p[1] * altura] for p in z], dtype=np.float32) for z in (cam.exclusao or []) if len(z) >= 3]
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

PRELIMINAR_PESSOA_S = 30.0  # quem fica muito tempo ganha um registro antes de sair
PRELIMINAR_VEICULO_S = 60.0


def cena_jpeg(cam: "Camera", img: np.ndarray, seq: int) -> bytes:
    """Quadro inteiro reduzido (para a sequência de imagens da busca), uma vez por quadro analisado."""
    if cam.jpeg_cena is None or cam.jpeg_cena[0] != seq:
        h, w = img.shape[:2]
        esc = min(1.0, 640 / w)
        peq = cv2.resize(img, (int(w * esc), int(h * esc))) if esc < 1 else img
        cam.jpeg_cena = (seq, jpeg(peq, 70))
    return cam.jpeg_cena[1]


def guardar_quadro(o, ts: float, obter) -> None:
    if not o.quadros or ts - o.quadros[-1][0] >= 1.0:
        o.quadros.append((ts, obter()))
        if len(o.quadros) > 8:
            del o.quadros[1]  # mantém o primeiro (chegada) e os mais recentes


def datetime_utc(ts: float):
    from datetime import datetime, timezone

    return datetime.fromtimestamp(ts, timezone.utc)


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
        self.nao_pessoa = 0
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

    @staticmethod
    def _gravar(db, tabela: str, chave: tuple, campos: dict, quadros: list) -> None:
        """UM registro por objeto: atualiza o existente (mesmo canal, objeto e
        início) ou cria. A sequência de imagens é trocada pela mais nova."""
        canal, oid, inicio = chave
        cols = list(campos)
        with db.cursor() as c:
            c.execute(
                f"UPDATE {tabela} SET " + ", ".join(f"{k} = %s" for k in cols)
                + " WHERE canal = %s AND track_id = %s AND inicio = to_timestamp(%s) RETURNING id",
                [*campos.values(), canal, oid, inicio],
            )
            r = c.fetchone()
            if r is None:
                c.execute(
                    f"INSERT INTO {tabela} (canal, track_id, inicio, " + ", ".join(cols) + ") VALUES (%s, %s, to_timestamp(%s), " + ", ".join(["%s"] * len(cols)) + ") RETURNING id",
                    [canal, oid, inicio, *campos.values()],
                )
                r = c.fetchone()
            ref = r[0]
            tipo = "pessoa" if tabela == "pessoas" else "veiculo"
            c.execute("DELETE FROM quadros_momento WHERE tipo = %s AND ref_id = %s", (tipo, ref))
            for ts, img in quadros:
                c.execute("INSERT INTO quadros_momento (tipo, ref_id, ts, img) VALUES (%s, %s, to_timestamp(%s), %s)", (tipo, ref, ts, img))

    @staticmethod
    def _apagar(db, tabela: str, chave: tuple) -> None:
        canal, oid, inicio = chave
        tipo = "pessoa" if tabela == "pessoas" else "veiculo"
        with db.cursor() as c:
            c.execute(f"DELETE FROM {tabela} WHERE canal = %s AND track_id = %s AND inicio = to_timestamp(%s) RETURNING id", (canal, oid, inicio))
            for (ref,) in c.fetchall():
                c.execute("DELETE FROM quadros_momento WHERE tipo = %s AND ref_id = %s", (tipo, ref))

    def _fazer(self, db, tarefa: tuple) -> None:
        tipo = tarefa[0]
        t0 = time.perf_counter()
        if tipo == "apagar_pessoa":
            self._apagar(db, "pessoas", tarefa[1])
            return
        if tipo == "pessoa":
            _, chave, fim, recortes, noturna, condutor, ganhos, quadros = tarefa
            attrs = self.modelos.pessoa(recortes, noturna, condutor, ganhos) if self.modelos else {}
            if attrs is None:  # não é pessoa: não grava (e apaga o preliminar, se houver)
                self.nao_pessoa += 1
                self._apagar(db, "pessoas", chave)
                return
            assinatura = attrs.pop("_assinatura", None)
            self._gravar(db, "pessoas", chave, {
                "fim": datetime_utc(fim), "recorte": jpeg(recortes[0], 88), "atributos": json.dumps(attrs), "noturna": noturna, "assinatura": assinatura,
            }, quadros)
        elif tipo == "veiculo":
            _, chave, classe, fim, sentido, recortes, noturna, ganhos, vel, desloc, quadros = tarefa
            attrs = self.modelos.veiculo(recortes, noturna, ganhos) if self.modelos else {}
            cor = attrs.get("cor", {})
            self._gravar(db, "veiculos", chave, {
                "classe": classe, "fim": datetime_utc(fim), "sentido": sentido, "recorte": jpeg(recortes[0], 88), "cor": cor.get("valor"), "cor_conf": cor.get("conf"),
                "atributos": json.dumps(attrs), "noturna": noturna, "velocidade_kmh": vel, "deslocamento": desloc,
            }, quadros)
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
        self.regras = Regras(self.salvar_alerta)
        self.ocupacao = 0

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
            c.execute("SELECT canal, caminho, nome, ativa, fps, tipo_linha, linha, calibracao, interna, fachada, zona_totem, conf_min, exclusao FROM cameras ORDER BY canal")
            linhas = c.fetchall()
            c.execute("SELECT valor FROM config WHERE chave = 'loja'")
            loja = c.fetchone()
        if loja:
            self.regras.configurar(loja[0])
        extras = {r[0]: (r[8], r[9], r[10]) for r in linhas}
        filtros = {r[0]: (float(r[11]) if r[11] is not None else 0.4, r[12]) for r in linhas}
        linhas = [r[:8] for r in linhas]
        ativas = {r[0] for r in linhas if r[3]}
        for canal in list(self.cameras):
            if canal not in ativas:
                self._parar_camera(canal)
        for canal, caminho, nome, ativa, fps, tipo_linha, linha, calibracao in linhas:
            if not ativa:
                continue
            cam = self.cameras.get(canal)
            if cam is not None:
                cam.interna, cam.fachada, cam.zona_totem = extras[canal]
                if (cam.conf_min, json.dumps(cam.exclusao)) != (filtros[canal][0], json.dumps(filtros[canal][1])):
                    cam.conf_min, cam.exclusao = filtros[canal]
                    if cam.tamanho:
                        w, h = cam.tamanho
                        cam.exclusao_px = [np.array([[p[0] * w, p[1] * h] for p in z], dtype=np.float32) for z in (cam.exclusao or []) if len(z) >= 3]
            if cam and cam.caminho != caminho:
                self._parar_camera(canal)
                cam = None
            if cam is None:
                cam = Camera(canal, caminho, nome, float(fps), tipo_linha, linha, calibracao)
                cam.interna, cam.fachada, cam.zona_totem = extras[canal]
                cam.conf_min, cam.exclusao = filtros[canal]
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

    def salvar_alerta(self, tipo: str, canal: str | None, nivel: str, mensagem: str, img) -> None:
        log(f"alerta [{nivel}] {mensagem}")
        with self.db.cursor() as c:
            c.execute(
                "INSERT INTO alertas (tipo, canal, nivel, mensagem, imagem) VALUES (%s, %s, %s, %s, %s)",
                (tipo, canal, nivel, mensagem, jpeg(img, 75) if img is not None else None),
            )

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
        ts = q.ts
        if cam.tamanho != (w, h):
            montar_rastreio(cam, w, h)
            self.contagem_hoje(cam)
        dets = self.detectar(img)
        nomes = [CLASSES[int(c)] for c in dets.class_id]
        confs = dets.confidence if dets.confidence is not None else np.ones(len(dets))
        rua = not cam.interna

        # ---- filtros antes do rastreio (o lixo perto do carro virava "pessoa")
        idx_p = []
        for i, n in enumerate(nomes):
            if n != "pessoa" or confs[i] < cam.conf_min:
                continue
            x1, y1, x2, y2 = dets.xyxy[i]
            bw, bh = x2 - x1, y2 - y1
            # pessoa em pé é mais alta que larga; nas internas há gente sentada
            if bh < (30 if rua else 40) or bh / max(bw, 1) < (1.15 if rua else 0.75):
                continue
            if cam.exclusao_px and no_poligono(cam.exclusao_px, ((x1 + x2) / 2, y2)):
                continue
            idx_p.append(i)
        pessoas = cam.rastreador.update_with_detections(dets[idx_p] if idx_p else sv.Detections.empty())
        if pessoas.tracker_id is None:
            pessoas.tracker_id = np.array([], dtype=int)
        pconf = pessoas.confidence if pessoas.confidence is not None else np.ones(len(pessoas))

        # Veículos só contam (e aparecem) na câmera da rua.
        idx_v = []
        if cam.tipo_linha == "veiculos":
            for i, n in enumerate(nomes):
                if n not in VEICULOS or confs[i] < max(0.4, cam.conf_min - 0.05):
                    continue
                x1, y1, x2, y2 = dets.xyxy[i]
                if (x2 - x1) * (y2 - y1) < (0.025 * w) ** 2:
                    continue
                if cam.exclusao_px and no_poligono(cam.exclusao_px, ((x1 + x2) / 2, (y1 + y2) / 2)):
                    continue
                idx_v.append(i)
        veiculos = cam.veiculos.atualizar(dets.xyxy[idx_v] if idx_v else np.zeros((0, 4)), [nomes[i] for i in idx_v], ts)
        cam.veiculos.saiu = []

        # ---- objetos estáveis (um registro por objeto)
        po = cam.objs_p.atualizar(pessoas.tracker_id, pessoas.xyxy, pconf, ["pessoa"] * len(pessoas), ts, img, lambda c: ((c[0] + c[2]) / 2, c[3]))
        vo = cam.objs_v.atualizar([v.id for v in veiculos], [v.caixa for v in veiculos], [1.0] * len(veiculos), [v.classe for v in veiculos], ts, img, lambda c: ((c[0] + c[2]) / 2, (c[1] + c[3]) / 2))

        # condutor/passageiro: pessoa sobreposta a moto ou bicicleta (em qualquer câmera)
        motos = [dets.xyxy[i] for i, n in enumerate(nomes) if n in ("moto", "bicicleta") and confs[i] >= 0.35]
        for o in po:
            x1, y1, x2, y2 = o.caixa
            area = max(1.0, (x2 - x1) * (y2 - y1))
            for a1, b1, a2, b2 in motos:
                inter = max(0.0, min(x2, a2) - max(x1, a1)) * max(0.0, min(y2, b2) - max(y1, b1))
                if inter / area >= 0.3:
                    o.condutor += 1
                    break

        # tom da câmera (balanço de branco), a cada 30 s
        cam.noturna = imagem_noturna_rapida(img)
        if ts - cam.ganhos_em > 30 and not cam.noturna:
            g = ganhos_da_imagem(img)
            if g is not None:
                cam.ganhos = g if cam.ganhos is None else 0.7 * cam.ganhos + 0.3 * g
            cam.ganhos_em = ts
        ganhos = None if cam.ganhos is None else [round(float(x), 3) for x in cam.ganhos]

        for o in po + vo:
            guardar_quadro(o, ts, lambda: cena_jpeg(cam, img, q.seq))
        if cam.transformador is not None:
            for o in vo:
                pe = np.array([[(o.caixa[0] + o.caixa[2]) / 2, o.caixa[3]]], dtype=np.float32)  # contato com o chão
                if cam.poligono is None or cv2.pointPolygonTest(cam.poligono, (float(pe[0][0]), float(pe[0][1])), False) >= 0:
                    o.trajeto.append((ts, cam.transformador.transform_points(pe)[0]))

        fps = cam.fps
        for o in po:
            if not o.descartado and cam.objs_p.parado_demais(o):
                o.descartado = True  # nunca se mexeu: não é pessoa passando
                if o.registrado_em:
                    self.analisador.enviar(("apagar_pessoa", (cam.canal, o.uid, o.inicio)))
            if o.confirmado(fps) and not o.descartado and not o.registrado_em and ts - o.inicio >= PRELIMINAR_PESSOA_S:
                o.registrado_em = ts
                self._enviar_pessoa(cam, o, ganhos)
        for o in vo:
            if o.confirmado(fps) and not o.registrado_em and ts - o.inicio >= PRELIMINAR_VEICULO_S:
                o.registrado_em = ts
                self._enviar_veiculo(cam, o, ganhos, w)

        # ---- quem saiu de vez (depois da janela de junção) vira UM registro
        cam.objs_p.manutencao(ts, 3.0)
        cam.objs_v.manutencao(ts, 2.5)
        for o in cam.objs_p.finalizados:
            if o.confirmado(fps) and not o.descartado and o.recortes:
                self._enviar_pessoa(cam, o, ganhos)
            elif o.registrado_em:
                self.analisador.enviar(("apagar_pessoa", (cam.canal, o.uid, o.inicio)))
        for o in cam.objs_v.finalizados:
            if o.confirmado(fps) and o.recortes:
                self._enviar_veiculo(cam, o, ganhos, w)
        cam.objs_p.finalizados = []
        cam.objs_v.finalizados = []

        # ---- contagem pelas linhas (pelo id estável)
        mudou = False
        if cam.contador is not None:
            if cam.tipo_linha == "entrada":
                for o in po:
                    s = cam.contador.atualizar(o.uid, tuple(o.pos))
                    if s and not o.descartado:
                        self.salvar_evento(cam.canal, "entrada" if s == "a" else "saida", "pessoa", s, o.uid)
                        mudou = True
                cam.contador.esquecer(set(cam.objs_p.vivos) | {x.uid for x in cam.objs_p.sumidos})
            elif cam.tipo_linha == "veiculos":
                for o in vo:
                    s = cam.contador.atualizar(o.uid, tuple(o.pos))
                    # uma vez só por veículo, e só se ele andou de verdade (parado ou manobrando não conta)
                    if s and not o.contado and o.desloc_max >= 0.06:
                        o.contado, o.sentido = True, s
                        self.salvar_evento(cam.canal, "veiculo", o.classe, s, o.uid)
                        mudou = True
                cam.contador.esquecer(set(cam.objs_v.vivos) | {x.uid for x in cam.objs_v.sumidos})
        if mudou:
            self.contagem_hoje(cam)

        validas = [o for o in po if o.confirmado(fps) and not o.descartado]
        vvalidos = [o for o in vo if o.confirmado(fps)]

        # ---- regras da loja (alertas)
        pets = [i for i, n in enumerate(nomes) if n in PETS and confs[i] >= 0.45]
        zona = [(p[0] * w, p[1] * h) for p in cam.zona_totem] if cam.zona_totem and len(cam.zona_totem) >= 3 else None
        self.regras.avaliar(cam.canal, cam.nome, ts, img, [(o.uid, tuple(map(float, o.caixa))) for o in validas], len(pets) if cam.interna else 0, cam.fachada, cam.interna, zona)

        # ---- caixas para o navegador (só objetos confirmados)
        def norm(c):
            return [round(float(c[0]) / w, 4), round(float(c[1]) / h, 4), round(float(c[2]) / w, 4), round(float(c[3]) / h, 4)]

        objetos = (
            [{"id": o.uid, "c": "pessoa", "b": norm(o.caixa), **({"r": "condutor"} if o.eh_condutor() else {})} for o in validas]
            + [{"id": 100000 + o.uid, "c": o.classe, "b": norm(o.caixa)} for o in vvalidos]
            + [{"id": 200000 + k, "c": nomes[i], "b": norm(dets.xyxy[i])} for k, i in enumerate(pets)]
        )
        cam.processados.append(time.time())
        agora = time.time()
        with self.db.cursor() as c:
            c.execute("INSERT INTO deteccoes (canal, ts, objetos) VALUES (%s, %s, %s)", (cam.canal, int(ts * 1000), json.dumps(objetos)))
            c.execute(
                "UPDATE cameras SET pessoas_agora = %s, veiculos_agora = %s, online = true, erro = NULL, contagem_hoje = %s WHERE canal = %s",
                (len(validas), len(vvalidos), json.dumps(cam.contagem), cam.canal),
            )
            if agora - cam.ultimo_cru > 5:
                cam.ultimo_cru = agora
                base = img.copy()
                if self.borrar and validas:
                    borrar_cabecas(base, np.array([o.caixa for o in validas]))
                c.execute("UPDATE cameras SET quadro_cru = %s, quadro_cru_em = now(), largura = %s, altura = %s WHERE canal = %s", (jpeg(base, 80), w, h, cam.canal))

    def _enviar_pessoa(self, cam: Camera, o, ganhos) -> None:
        recs = [r for _, _, r in o.recortes]
        self.analisador.enviar(("pessoa", (cam.canal, o.uid, o.inicio), o.ultimo, recs, bool(cam.noturna), o.eh_condutor(), ganhos, list(o.quadros)))

    def _enviar_veiculo(self, cam: Camera, o, ganhos, w: int) -> None:
        recs = [r for _, _, r in o.recortes]
        vel = velocidade_kmh(o.trajeto) if cam.transformador is not None else None
        self.analisador.enviar(("veiculo", (cam.canal, o.uid, o.inicio), o.classe, o.ultimo, o.sentido, recs, bool(cam.noturna), ganhos, vel, round(o.desloc_max, 3), list(o.quadros)))

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
        cams["_atributos"] = {"nome": "atributos", "fila": self.analisador.fila.qsize(), "ms": round(float(np.mean(self.analisador.ms)), 1) if self.analisador.ms else None, "descartados": self.analisador.descartados, "nao_pessoa": self.analisador.nao_pessoa}
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
            c.execute("DELETE FROM alertas WHERE quando < now() - make_interval(days => %s)", (self.retencao_dias,))
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
                        c.execute(
                            """SELECT count(*) FILTER (WHERE tipo='entrada') - count(*) FILTER (WHERE tipo='saida') FROM eventos
                               WHERE ocorrido_em >= (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo')"""
                        )
                        self.ocupacao = max(0, int(c.fetchone()[0] or 0))
                    self.regras.avaliar_geral({k: (c.nome, bool(c.fonte and c.fonte.online)) for k, c in self.cameras.items()}, self.ocupacao)
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
