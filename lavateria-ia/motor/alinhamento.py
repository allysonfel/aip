"""Alinhamento automático entre a hora que o motor dá a cada quadro (RTSP) e a
hora que o navegador usa para o vídeo (PROGRAM-DATE-TIME do HLS do mediamtx).

Medido na VPS: a diferença muda de câmera para câmera (Frente2 0,92 s, Salão
0,09 s) e é estável. Então, a cada 20 minutos, o motor baixa os últimos
trechos do HLS de cada câmera, casa quadro a quadro com as miniaturas que ele
mesmo viu e guarda a diferença em cameras.ajuste_video_ms. O painel desenha
as caixas com esse ajuste: a caixa fica no quadro certo do vídeo.
Só leitura no mediamtx (mesmo usuário de leitura do motor)."""

from __future__ import annotations

import base64
import datetime
import re
import tempfile
import urllib.parse
import urllib.request

import cv2
import numpy as np


def _auth_da_url(rtsp: str) -> tuple[str, str]:
    u = urllib.parse.urlparse(rtsp)
    cred = f"{urllib.parse.unquote(u.username or '')}:{urllib.parse.unquote(u.password or '')}"
    return "Basic " + base64.b64encode(cred.encode()).decode(), u.hostname or "mediamtx"


def medir(rtsp_base: str, caminho: str, historico) -> float | None:
    """Diferença (s) hora do motor - hora do vídeo; None se não deu para casar."""
    auth, host = _auth_da_url(rtsp_base)
    base = f"http://{host}:8888/lavateria/{caminho}/"

    def get(nome: str) -> bytes:
        return urllib.request.urlopen(urllib.request.Request(base + nome, headers={"Authorization": auth}), timeout=10).read()

    vistos = list(historico)
    if len(vistos) < 50:
        return None
    indice = get("index.m3u8").decode()
    variante = next((l.strip() for l in indice.splitlines() if l.strip() and not l.startswith("#")), "main_stream.m3u8")
    pl = get(variante).decode()
    # HLS comum (.ts) ou de baixa latência (fMP4: precisa do segmento de iniciação)
    mapa = re.search(r'#EXT-X-MAP:URI="([^"]+)"', pl)
    init = get(mapa.group(1)) if mapa else b""
    segs = re.findall(r"#EXT-X-PROGRAM-DATE-TIME:(\S+)\s+(?:#EXT-X-PART:[^\n]*\s+)*#EXTINF:[\d.]+,\s+(\S+)", pl)
    mini = np.array([v[1] for v in vistos], dtype=np.float32)
    tss = np.array([v[0] for v in vistos])
    dif = []
    for pdt, nome in segs[-3:]:
        t0 = datetime.datetime.fromisoformat(pdt.replace("Z", "+00:00")).timestamp()
        with tempfile.NamedTemporaryFile(suffix=".mp4" if init else ".ts") as tf:
            tf.write(init + get(nome))
            tf.flush()
            cap = cv2.VideoCapture(tf.name)
            k, pts0 = 0, None
            while True:
                ok, im = cap.read()
                if not ok:
                    break
                pts = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
                pts0 = pts if pts0 is None else pts0
                k += 1
                if k % 4:
                    continue
                g = cv2.resize(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), (88, 60)).astype(np.float32)
                erros = ((mini - g) ** 2).mean(axis=(1, 2))
                ordem = np.argsort(erros)
                if len(ordem) > 1 and erros[ordem[0]] < 0.8 * erros[ordem[1]]:
                    dif.append(float(tss[ordem[0]] - (t0 + pts - pts0)))
            cap.release()
    if len(dif) < 8:
        return None
    return float(np.median(dif))
