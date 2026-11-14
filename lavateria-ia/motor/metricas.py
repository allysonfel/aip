"""Métricas de qualidade (antes x depois), sobre os registros do banco num
intervalo de tempo. Uso: python metricas.py "2026-11-14 22:00+00" "2026-11-14 23:30+00"

- falsas: recortes de "pessoa" que o CLIP não reconhece como pessoa (lixo,
  moto, objeto). Pergunta fechada: pessoa x moto x carro x lixo x rua vazia.
- duplicadas (pessoas): mesmo canal, assinatura visual com cosseno >= 0,92
  de um registro anterior em até 120 s.
- duplicadas (veículos): mesmo canal e tipo, começou até 5 s depois do fim de
  outro e o recorte tem histograma de cor parecido (correlação >= 0,8).
- consistência: entre os pares duplicados (mesmo objeto), % com a mesma cor.
"""

from __future__ import annotations

import json
import os
import sys

import cv2
import numpy as np
import psycopg
import torch
from PIL import Image

torch.set_num_threads(1)
ini, fim = sys.argv[1], sys.argv[2]
db = psycopg.connect(os.environ["DATABASE_URL"])


def img(b: bytes) -> np.ndarray:
    return cv2.imdecode(np.frombuffer(b, np.uint8), cv2.IMREAD_COLOR)


def hist(b: np.ndarray) -> np.ndarray:
    h = cv2.calcHist([cv2.cvtColor(b, cv2.COLOR_BGR2HSV)], [0, 1], None, [16, 8], [0, 180, 0, 256])
    return cv2.normalize(h, h).flatten()


import open_clip  # noqa: E402

modelo, _, prep = open_clip.create_model_and_transforms("ViT-B-16", pretrained="laion2b_s34b_b88k")
modelo.eval()
tok = open_clip.get_tokenizer("ViT-B-16")
CLASSES = ["a photo of a person", "a photo of a motorcycle", "a photo of a car", "a photo of a trash bag or garbage on the ground", "a photo of an empty street or wall"]
with torch.no_grad():
    T = modelo.encode_text(tok(CLASSES))
    T = T / T.norm(dim=-1, keepdim=True)


def classe_clip(b: np.ndarray) -> tuple[int, float]:
    with torch.no_grad():
        e = modelo.encode_image(prep(Image.fromarray(cv2.cvtColor(b, cv2.COLOR_BGR2RGB))).unsqueeze(0))
        e = e / e.norm(dim=-1, keepdim=True)
        p = (100 * e @ T.T).softmax(-1)[0]
    i = int(p.argmax())
    return i, float(p[i])


with db.cursor() as c:
    c.execute(
        """SELECT p.id, p.canal, extract(epoch from p.inicio)::float, extract(epoch from p.fim)::float, p.recorte, p.atributos, p.assinatura
           FROM pessoas p WHERE p.inicio BETWEEN %s AND %s ORDER BY p.inicio""",
        (ini, fim),
    )
    pessoas = c.fetchall()
    c.execute(
        """SELECT id, canal, classe, extract(epoch from inicio)::float, extract(epoch from fim)::float, recorte, cor, cor_conf
           FROM veiculos WHERE inicio BETWEEN %s AND %s ORDER BY inicio""",
        (ini, fim),
    )
    veiculos = c.fetchall()

horas = max(1e-9, (max([p[3] for p in pessoas] + [v[4] for v in veiculos] + [0]) - min([p[2] for p in pessoas] + [v[3] for v in veiculos] + [1e18])) / 3600)

# ---------- pessoas
falsas, motos, por_canal = 0, 0, {}
for pid, canal, t0, t1, rec, attrs, ass in pessoas:
    por_canal[canal] = por_canal.get(canal, 0) + 1
    if rec is None:
        continue
    i, _ = classe_clip(img(rec))
    if i != 0:
        falsas += 1
        motos += i == 1
dup_p, pares_p, iguais_p = 0, 0, 0
for k, (pid, canal, t0, t1, rec, attrs, ass) in enumerate(pessoas):
    if not ass:
        continue
    a = np.array(ass)
    for pid2, canal2, s0, s1, _, attrs2, ass2 in pessoas[:k]:
        if canal2 != canal or not ass2 or t0 - s1 > 120:
            continue
        if float(a @ np.array(ass2)) >= 0.92:
            dup_p += 1
            pares_p += 1
            v1 = (attrs.get("cima") or {}).get("valor")
            v2 = (attrs2.get("cima") or {}).get("valor")
            iguais_p += v1 == v2
            break
azul_p = sum(1 for p in pessoas if (p[5].get("cima") or {}).get("valor") == "azul" and (p[5].get("cima") or {}).get("conf", 0) >= 0.65)
com_cor_p = sum(1 for p in pessoas if (p[5].get("cima") or {}).get("valor") and (p[5].get("cima") or {}).get("conf", 0) >= 0.65)

# ---------- veículos
dup_v, iguais_v = 0, 0
hs = [hist(img(v[5])) if v[5] else None for v in veiculos]
for k, (vid, canal, classe, t0, t1, rec, cor, conf) in enumerate(veiculos):
    for j in range(k - 1, -1, -1):
        vid2, canal2, classe2, s0, s1, rec2, cor2, conf2 = veiculos[j]
        if t0 - s1 > 5:
            break
        if canal2 == canal and classe2 == classe and -1 <= t0 - s1 and hs[k] is not None and hs[j] is not None and cv2.compareHist(hs[k], hs[j], cv2.HISTCMP_CORREL) >= 0.8:
            dup_v += 1
            iguais_v += (cor if (conf or 0) >= 0.65 else None) == (cor2 if (conf2 or 0) >= 0.65 else None)
            break
azul_v = sum(1 for v in veiculos if v[6] == "azul" and (v[7] or 0) >= 0.65)
com_cor_v = sum(1 for v in veiculos if v[6] and (v[7] or 0) >= 0.65)

pct = lambda a, b: round(100 * a / b, 1) if b else None
print(json.dumps({
    "intervalo": [ini, fim], "horas": round(horas, 2),
    "pessoas": len(pessoas), "pessoas_por_hora": round(len(pessoas) / horas, 1), "por_camera": por_canal,
    "pessoas_falsas_pct": pct(falsas, len(pessoas)), "motos_como_pessoa": motos,
    "pessoas_duplicadas_pct": pct(dup_p, len(pessoas)), "consistencia_cor_cima_pct": pct(iguais_p, pares_p),
    "pessoas_azul_pct": pct(azul_p, com_cor_p),
    "veiculos": len(veiculos), "veiculos_duplicados_pct": pct(dup_v, len(veiculos)), "consistencia_cor_veiculo_pct": pct(iguais_v, dup_v),
    "veiculos_azul_pct": pct(azul_v, com_cor_v),
}, ensure_ascii=False, indent=1, default=float))
