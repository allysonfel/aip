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
COR_PESSOA = (255, 196, 64)  # BGR: azul claro
COR_VEICULO = (64, 200, 255)  # BGR: âmbar
COR_LINHA = (80, 220, 120)

PARAR = threading.Event()


def log(*a) -> None:
    print(time.strftime("%H:%M:%S"), "[motor]", *a, flush=True)


# ---------------------------------------------------------------- linhas

LINHA_FAIXA_MORTA = 0.008
LINHA_TOLERANCIA_PONTAS = 0.08


class Linha:
    """Cruzamento de linha (adaptado do ContadorLinha do motor do shopping):
    o lado de cada ID fica guardado enquanto ele existir, então quem some
    por um quadro (comum a 2 quadros por segundo) ainda conta. Devolve "a"
    quando termina do lado negativo (produto vetorial com fim - início) e
    "b" no outro sentido."""

    def __init__(self, a, b, largura: int) -> None:
        self.a = np.array(a, dtype=float)
        self.b = np.array(b, dtype=float)
        self.v = self.b - self.a
        self.comp = float(np.hypot(*self.v)) or 1.0
        self.faixa = LINHA_FAIXA_MORTA * largura
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


class RastreadorVeiculos:
    """A 2 quadros por segundo um carro anda boa parte da imagem entre um
    quadro e outro, e o ByteTrack (que depende de sobreposição de caixas)
    perde o veículo. Aqui a associação é pelo centro mais próximo, dentro
    de um raio proporcional à imagem, preferindo a mesma classe."""

    def __init__(self, largura: int, raio_rel: float = 0.38, validade_s: float = 2.2) -> None:
        self.raio = raio_rel * largura
        self.validade = validade_s
        self._v: dict[int, _Veiculo] = {}
        self._prox = 1

    def atualizar(self, caixas: np.ndarray, classes: list[str], ts: float) -> list[_Veiculo]:
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
            v = _Veiculo(melhor, classes[i], centros[i], ts, caixas[i])
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
    fonte: FonteVideo | None = None
    proximo: float = 0.0
    rastreador: sv.ByteTrack | None = None
    veiculos: RastreadorVeiculos | None = None
    contador: Linha | None = None
    chave_linha: str = ""
    tamanho: tuple[int, int] | None = None
    ultimo_cru: float = 0.0
    processados: list[float] = field(default_factory=list)
    contagem: dict[str, int] = field(default_factory=dict)

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
    cam.contador = None
    cam.chave_linha = json.dumps(cam.linha, sort_keys=True) if cam.linha else ""
    if cam.tipo_linha and cam.linha:
        a = (cam.linha["a"][0] * largura, cam.linha["a"][1] * altura)
        b = (cam.linha["b"][0] * largura, cam.linha["b"][1] * altura)
        cam.contador = Linha(a, b, largura)


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


def desenhar(img: np.ndarray, cam: Camera, pessoas: sv.Detections, veiculos: list[_Veiculo]) -> np.ndarray:
    out = img.copy()
    for (x1, y1, x2, y2), tid in zip(pessoas.xyxy, pessoas.tracker_id if pessoas.tracker_id is not None else []):
        cv2.rectangle(out, (int(x1), int(y1)), (int(x2), int(y2)), COR_PESSOA, 2)
        _rotulo(out, f"pessoa {tid}", int(x1), int(y1), COR_PESSOA)
    for v in veiculos:
        x1, y1, x2, y2 = v.caixa
        cv2.rectangle(out, (int(x1), int(y1)), (int(x2), int(y2)), COR_VEICULO, 2)
        _rotulo(out, v.classe, int(x1), int(y1), COR_VEICULO)
    if cam.contador is not None and cam.tamanho:
        a = tuple(int(x) for x in cam.contador.a)
        b = tuple(int(x) for x in cam.contador.b)
        cv2.line(out, a, b, COR_LINHA, 2, cv2.LINE_AA)
        cv2.circle(out, a, 4, COR_LINHA, -1)
        cv2.circle(out, b, 4, COR_LINHA, -1)
        if cam.tipo_linha == "entrada":
            texto = f"entradas {cam.contagem.get('entrada', 0)}  saidas {cam.contagem.get('saida', 0)}"
        else:
            texto = f"sentido A {cam.contagem.get('a', 0)}  sentido B {cam.contagem.get('b', 0)}"
        _rotulo(out, texto, 8, out.shape[0] - 8, COR_LINHA, embaixo=True)
    return out


def _rotulo(img, texto, x, y, cor, embaixo=False) -> None:
    (tw, th), _ = cv2.getTextSize(texto, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
    y0 = y - th - 6 if not embaixo else y - th - 6
    y0 = max(0, y0)
    cv2.rectangle(img, (x, y0), (x + tw + 6, y0 + th + 6), cor, -1)
    cv2.putText(img, texto, (x + 3, y0 + th + 2), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (20, 20, 20), 1, cv2.LINE_AA)


def jpeg(img: np.ndarray, qualidade: int = 72) -> bytes:
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, qualidade])
    return buf.tobytes() if ok else b""


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
        log(f"carregando RF-DETR Nano (CPU, {THREADS} threads)...")
        from rfdetr import RFDETRNano

        self.modelo = RFDETRNano(device="cpu")
        # Preditor otimizado (TorchScript) do próprio RF-DETR: mesmo resultado,
        # menos tempo por quadro na CPU. Se falhar, segue com o modelo normal.
        self.preditor = self.modelo
        try:
            self.preditor = self.modelo.inference()
            log("preditor otimizado pronto")
        except Exception as e:
            log("sem preditor otimizado, usando o modelo normal:", repr(e))

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
            c.execute("SELECT canal, caminho, nome, ativa, fps, tipo_linha, linha FROM cameras ORDER BY canal")
            linhas = c.fetchall()
        ativas = {r[0] for r in linhas if r[3]}
        for canal in list(self.cameras):
            if canal not in ativas:
                self._parar_camera(canal)
        for canal, caminho, nome, ativa, fps, tipo_linha, linha in linhas:
            if not ativa:
                continue
            cam = self.cameras.get(canal)
            if cam and cam.caminho != caminho:
                self._parar_camera(canal)
                cam = None
            if cam is None:
                cam = Camera(canal, caminho, nome, float(fps), tipo_linha, linha)
                cam.fonte = FonteVideo(f"{RTSP_BASE}/lavateria/{caminho}", eh_arquivo=False)
                cam.fonte.iniciar()
                self.cameras[canal] = cam
                log(f"câmera {canal} ({nome}) ligada a {fps} q/s")
            else:
                mudou = cam.fps != float(fps) or cam.tipo_linha != tipo_linha or (json.dumps(linha, sort_keys=True) if linha else "") != cam.chave_linha
                cam.nome, cam.fps, cam.tipo_linha, cam.linha = nome, float(fps), tipo_linha, linha
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
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        t0 = time.perf_counter()
        with torch.inference_mode():
            dets = self.preditor.predict(rgb, threshold=CONF_MIN)
        self.ms_inferencia.append((time.perf_counter() - t0) * 1000)
        self.ms_inferencia = self.ms_inferencia[-50:]
        manter = np.isin(dets.class_id, list(CLASSES))
        return dets[manter]

    def processar(self, cam: Camera) -> None:
        q = cam.fonte.ultimo() if cam.fonte else None
        if q is None:
            return
        img = q.imagem
        h, w = img.shape[:2]
        if cam.tamanho != (w, h):
            montar_rastreio(cam, w, h)
            self.contagem_hoje(cam)
        dets = self.detectar(img)
        nomes = [CLASSES[int(c)] for c in dets.class_id]
        e_pessoa = np.array([n == "pessoa" for n in nomes], dtype=bool)
        pessoas = cam.rastreador.update_with_detections(dets[e_pessoa]) if len(dets) else cam.rastreador.update_with_detections(sv.Detections.empty())
        if pessoas.tracker_id is None:
            pessoas.tracker_id = np.array([], dtype=int)
        # Veículos só contam (e aparecem) na câmera da rua: nas internas, o
        # carro visto pela porta de vidro não interessa.
        idx_v = [i for i, n in enumerate(nomes) if n in VEICULOS] if cam.tipo_linha == "veiculos" else []
        veiculos = cam.veiculos.atualizar(dets.xyxy[idx_v] if idx_v else np.zeros((0, 4)), [nomes[i] for i in idx_v], q.ts)

        mudou_contagem = False
        if cam.contador is not None:
            if cam.tipo_linha == "entrada":
                for (x1, y1, x2, y2), tid in zip(pessoas.xyxy, pessoas.tracker_id):
                    s = cam.contador.atualizar(int(tid), ((x1 + x2) / 2, y2))
                    if s:
                        tipo = "entrada" if s == "a" else "saida"
                        self.salvar_evento(cam.canal, tipo, "pessoa", s, int(tid))
                        mudou_contagem = True
                cam.contador.esquecer({int(t) for t in pessoas.tracker_id})
            elif cam.tipo_linha == "veiculos":
                for v in veiculos:
                    s = cam.contador.atualizar(v.id, tuple(v.centro))
                    if s:
                        self.salvar_evento(cam.canal, "veiculo", v.classe, s, v.id)
                        mudou_contagem = True
                cam.contador.esquecer(cam.veiculos.vivos())
        if mudou_contagem:
            self.contagem_hoje(cam)

        base = img.copy()
        if self.borrar and len(pessoas):
            borrar_cabecas(base, pessoas.xyxy)
        anotado = desenhar(base, cam, pessoas, veiculos)
        cam.processados.append(time.time())
        agora = time.time()
        with self.db.cursor() as c:
            c.execute(
                "UPDATE cameras SET quadro = %s, quadro_em = now(), pessoas_agora = %s, veiculos_agora = %s, online = true, erro = NULL WHERE canal = %s",
                (jpeg(anotado), int(len(pessoas)), len(veiculos), cam.canal),
            )
            if agora - cam.ultimo_cru > 20:
                cam.ultimo_cru = agora
                c.execute("UPDATE cameras SET quadro_cru = %s, quadro_cru_em = now(), largura = %s, altura = %s WHERE canal = %s", (jpeg(base, 80), w, h, cam.canal))

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
        with self.db.cursor() as c:
            c.execute(
                """INSERT INTO motor_status (id, cpu_pct, mem_mb, ms_inferencia, threads, cameras, atualizado_em)
                   VALUES (1, %s, %s, %s, %s, %s, now())
                   ON CONFLICT (id) DO UPDATE SET cpu_pct = EXCLUDED.cpu_pct, mem_mb = EXCLUDED.mem_mb, ms_inferencia = EXCLUDED.ms_inferencia,
                     threads = EXCLUDED.threads, cameras = EXCLUDED.cameras, atualizado_em = now()""",
                (round(cpu, 1), round(mem), ms and round(ms, 1), THREADS, json.dumps(cams)),
            )
            c.execute(
                "INSERT INTO motor_amostras (cpu_pct, mem_mb, ms_inferencia, cameras_ativas, fps_total) VALUES (%s, %s, %s, %s, %s)",
                (round(cpu, 1), round(mem), ms and round(ms, 1), len(self.cameras), sum(v["fps_processado"] for v in cams.values())),
            )

    def limpar(self) -> None:
        with self.db.cursor() as c:
            c.execute("DELETE FROM eventos WHERE ocorrido_em < now() - make_interval(days => %s)", (self.retencao_dias,))
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
                        cam.proximo = time.time() + 1.0 / max(0.2, cam.fps)
                        self.processar(cam)
                        trabalhou = True
                if time.time() - self._ultimo_status > 5:
                    self._ultimo_status = time.time()
                    self.atualizar_offline()
                    self.escrever_status()
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
