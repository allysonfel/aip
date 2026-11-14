"""Limpeza dos registros falsos e duplicados feitos ANTES das correções.
Uso: python limpeza.py "<início>" "<fim>"  (só mexe nesse intervalo)

Mesmos critérios das métricas (metricas.py):
  - pessoa cujo recorte o CLIP não reconhece como pessoa (lixo, moto, objeto);
  - pessoa duplicada: mesmo canal, assinatura com cosseno >= 0,92 de um
    registro mantido em até 120 s (fica o primeiro, com o fim estendido);
  - veículo duplicado: mesmo canal e tipo, começou até 5 s depois do fim de um
    registro mantido e o recorte é parecido (fica o primeiro).
Apaga também a sequência de imagens (quadros_momento) de cada registro apagado.
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
db = psycopg.connect(os.environ["DATABASE_URL"], autocommit=True)

import open_clip  # noqa: E402

modelo, _, prep = open_clip.create_model_and_transforms("ViT-B-16", pretrained="laion2b_s34b_b88k")
modelo.eval()
tok = open_clip.get_tokenizer("ViT-B-16")
with torch.no_grad():
    T = modelo.encode_text(tok(["a photo of a person", "a photo of a motorcycle", "a photo of a car", "a photo of a trash bag or garbage on the ground", "a photo of an empty street or wall"]))
    T = T / T.norm(dim=-1, keepdim=True)


def img(b: bytes) -> np.ndarray:
    return cv2.imdecode(np.frombuffer(b, np.uint8), cv2.IMREAD_COLOR)


def e_pessoa(b: bytes) -> bool:
    with torch.no_grad():
        e = modelo.encode_image(prep(Image.fromarray(cv2.cvtColor(img(b), cv2.COLOR_BGR2RGB))).unsqueeze(0))
        e = e / e.norm(dim=-1, keepdim=True)
        p = (100 * e @ T.T).softmax(-1)[0]
    return int(p.argmax()) == 0


def hist(b: bytes) -> np.ndarray:
    h = cv2.calcHist([cv2.cvtColor(img(b), cv2.COLOR_BGR2HSV)], [0, 1], None, [16, 8], [0, 180, 0, 256])
    return cv2.normalize(h, h).flatten()


def apagar(tabela: str, tipo: str, ids: list[int]) -> None:
    if not ids:
        return
    with db.cursor() as c:
        c.execute("DELETE FROM quadros_momento WHERE tipo = %s AND ref_id = ANY(%s)", (tipo, ids))
        c.execute(f"DELETE FROM {tabela} WHERE id = ANY(%s)", (ids,))


with db.cursor() as c:
    c.execute("SELECT id, canal, extract(epoch from inicio)::float, extract(epoch from fim)::float, recorte, assinatura FROM pessoas WHERE inicio BETWEEN %s AND %s ORDER BY inicio", (ini, fim))
    pessoas = c.fetchall()
    c.execute("SELECT id, canal, classe, extract(epoch from inicio)::float, extract(epoch from fim)::float, recorte FROM veiculos WHERE inicio BETWEEN %s AND %s ORDER BY inicio", (ini, fim))
    veiculos = c.fetchall()

nao_pessoa, dup_p, mantidas = [], [], []
fim_novo: dict[int, float] = {}
for pid, canal, t0, t1, rec, ass in pessoas:
    if rec is not None and not e_pessoa(rec):
        nao_pessoa.append(pid)
        continue
    dono = None
    if ass:
        a = np.array(ass)
        for mid, mcanal, m0, m1, mass in reversed(mantidas):
            if t0 - max(m1, fim_novo.get(mid, m1)) > 120:
                break
            if mcanal == canal and mass and float(a @ np.array(mass)) >= 0.92:
                dono = mid
                break
    if dono is not None:
        dup_p.append(pid)
        fim_novo[dono] = max(fim_novo.get(dono, 0), t1)
    else:
        mantidas.append((pid, canal, t0, t1, ass))

dup_v, mant_v = [], []
fim_v: dict[int, float] = {}
hs = {v[0]: hist(v[5]) for v in veiculos if v[5]}
for vid, canal, classe, t0, t1, rec in veiculos:
    dono = None
    for mid, mcanal, mclasse, m0, m1 in reversed(mant_v):
        fm = max(m1, fim_v.get(mid, m1))
        if t0 - fm > 5:
            break
        if mcanal == canal and mclasse == classe and t0 - fm >= -1 and vid in hs and mid in hs and cv2.compareHist(hs[vid], hs[mid], cv2.HISTCMP_CORREL) >= 0.8:
            dono = mid
            break
    if dono is not None:
        dup_v.append(vid)
        fim_v[dono] = max(fim_v.get(dono, 0), t1)
    else:
        mant_v.append((vid, canal, classe, t0, t1))

with db.cursor() as c:
    for mid, f in fim_novo.items():
        c.execute("UPDATE pessoas SET fim = greatest(fim, to_timestamp(%s)) WHERE id = %s", (f, mid))
    for mid, f in fim_v.items():
        c.execute("UPDATE veiculos SET fim = greatest(fim, to_timestamp(%s)) WHERE id = %s", (f, mid))
apagar("pessoas", "pessoa", nao_pessoa + dup_p)
apagar("veiculos", "veiculo", dup_v)
print(json.dumps({
    "pessoas_antes": len(pessoas), "nao_pessoa_apagadas": len(nao_pessoa), "pessoas_duplicadas_apagadas": len(dup_p), "pessoas_depois": len(pessoas) - len(nao_pessoa) - len(dup_p),
    "veiculos_antes": len(veiculos), "veiculos_duplicados_apagados": len(dup_v), "veiculos_depois": len(veiculos) - len(dup_v),
}, ensure_ascii=False, indent=1))
