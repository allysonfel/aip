"""Atributos de pessoas e veículos (etapa 2), calculados UMA vez por pessoa ou
veículo rastreado, a partir do melhor recorte dele (maior, mais nítido e sem
encostar na borda da imagem).

Pessoas:
  - gênero estimado e tipo da parte de baixo (calça, bermuda/short,
    saia/vestido): CLIP ViT-B-16 (comparação imagem x texto, sem treino);
  - boné/chapéu, mochila e bolsa: média do CLIP com o modelo de atributos
    de pedestre da Intel (person-attributes-recognition-crossroad-0230);
  - cor da parte de cima e da parte de baixo: cor dominante em HSV na região
    do corpo que o modelo da Intel indica, com o nome da cor;
Veículos:
  - cor: modelo da Intel vehicle-attributes-recognition-barrier-0039.

Cada atributo sai com a confiança (0 a 1). O painel mostra "indefinido"
abaixo do limiar configurado. Imagem noturna (preto e branco): sem cor.
Nada de reconhecimento facial: o sistema não sabe QUEM é a pessoa.
"""

from __future__ import annotations

import os

import cv2
import numpy as np

PASTA_OMZ = os.environ.get("MOTOR_OMZ", "/app/modelo/omz")
CLIP_NOME = os.environ.get("MOTOR_CLIP", "ViT-B-16")
CLIP_PESOS = os.environ.get("MOTOR_CLIP_PESOS", "laion2b_s34b_b88k")

CORES_VEICULO = ["branco", "cinza", "amarelo", "vermelho", "verde", "azul", "preto"]
CORES = ["preto", "branco", "cinza", "vermelho", "azul", "verde", "amarelo", "laranja", "rosa", "roxo", "marrom", "bege"]

PROMPTS = {
    "genero": (["a photo of a man", "a photo of a woman"], ["masculino", "feminino"]),
    "baixo_tipo": (["a photo of a person wearing long trousers or jeans", "a photo of a person wearing shorts", "a photo of a woman wearing a skirt or a dress"], ["calça", "bermuda/short", "saia/vestido"]),
    "bone": (["a person wearing a cap or a hat", "a person with nothing on the head"], [True, False]),
    "mochila": (["a person carrying a backpack", "a person without a backpack"], [True, False]),
    "bolsa": (["a person carrying a handbag or a shoulder bag", "a person not carrying any bag"], [True, False]),
}


# ---------------------------------------------------------------- cor

def nome_da_cor(hsv: np.ndarray) -> tuple[str, float]:
    """Cor dominante nomeada de uma região HSV (OpenCV: H 0-180). Confiança =
    fração dos pixels da região que caíram nessa cor."""
    h = hsv[..., 0].astype(int).ravel()
    s = hsv[..., 1].astype(int).ravel()
    v = hsv[..., 2].astype(int).ravel()
    if h.size < 20:
        return "", 0.0
    nomes = np.empty(h.size, dtype=object)
    escuro = v < 50
    sem_sat = (s < 40) & ~escuro
    nomes[escuro] = "preto"
    nomes[sem_sat & (v >= 190)] = "branco"
    nomes[sem_sat & (v < 190)] = "cinza"
    cor = ~escuro & ~sem_sat
    hh, ss, vv = h[cor], s[cor], v[cor]
    n = np.where(
        (hh < 8) | (hh >= 170), np.where((ss < 110) & (vv > 170), "rosa", "vermelho"),
        np.where(hh < 22, np.where(vv < 140, "marrom", np.where(ss < 110, "bege", "laranja")),
        np.where(hh < 34, np.where((ss < 100) & (vv > 150), "bege", "amarelo"),
        np.where(hh < 86, "verde",
        np.where(hh < 131, "azul",
        np.where(hh < 151, "roxo", "rosa")))))).astype(object)
    nomes[cor] = n
    valores, contagem = np.unique(nomes, return_counts=True)
    i = int(np.argmax(contagem))
    return str(valores[i]), float(contagem[i] / h.size)


def imagem_noturna(bgr: np.ndarray) -> bool:
    """Câmera em modo noturno (infravermelho) manda imagem praticamente sem cor."""
    peq = cv2.resize(bgr, (96, 64))
    s = cv2.cvtColor(peq, cv2.COLOR_BGR2HSV)[..., 1]
    return float(s.mean()) < 14


def _regiao(rec: np.ndarray, cx: float, cy: float, rw: float, rh: float) -> np.ndarray:
    h, w = rec.shape[:2]
    x1, x2 = int(max(0, (cx - rw) * w)), int(min(w, (cx + rw) * w))
    y1, y2 = int(max(0, (cy - rh) * h)), int(min(h, (cy + rh) * h))
    return rec[y1:y2, x1:x2]


# ---------------------------------------------------------------- modelos


class Atributos:
    def __init__(self, threads: int = 1) -> None:
        import openvino as ov
        import open_clip
        import torch

        torch.set_num_threads(threads)
        self._torch = torch
        core = ov.Core()
        cfg = {"INFERENCE_NUM_THREADS": threads}
        self.par = core.compile_model(f"{PASTA_OMZ}/person-attributes-recognition-crossroad-0230.xml", "CPU", cfg)
        self.vei = core.compile_model(f"{PASTA_OMZ}/vehicle-attributes-recognition-barrier-0039.xml", "CPU", cfg)
        self.clip, _, self.prep = open_clip.create_model_and_transforms(CLIP_NOME, pretrained=CLIP_PESOS)
        self.clip.eval()
        tok = open_clip.get_tokenizer(CLIP_NOME)
        with torch.no_grad():
            self.textos = {}
            for k, (prompts, valores) in PROMPTS.items():
                t = self.clip.encode_text(tok(prompts))
                self.textos[k] = (t / t.norm(dim=-1, keepdim=True), valores)

    def _clip(self, rec_bgr: np.ndarray) -> tuple[dict[str, list[float]], list[float]]:
        from PIL import Image

        img = self.prep(Image.fromarray(cv2.cvtColor(rec_bgr, cv2.COLOR_BGR2RGB))).unsqueeze(0)
        with self._torch.no_grad():
            e = self.clip.encode_image(img)
            e = e / e.norm(dim=-1, keepdim=True)
            probs = {k: (100 * e @ t.T).softmax(-1)[0].tolist() for k, (t, _) in self.textos.items()}
            return probs, [round(float(x), 4) for x in e[0].tolist()]

    def _par(self, rec_bgr: np.ndarray):
        x = cv2.resize(rec_bgr, (80, 160)).transpose(2, 0, 1)[None].astype(np.float32)
        r = self.par(x)
        vals = list(r.values())
        attrs = np.array(vals[0]).ravel()  # is_male, bag, backpack, hat, longsleeves, longpants, longhair, coat
        cima = np.array(vals[1]).ravel()
        baixo = np.array(vals[2]).ravel()
        return attrs, cima, baixo

    def pessoa(self, rec_bgr: np.ndarray, noturna: bool) -> dict:
        h, w = rec_bgr.shape[:2]
        if h < 48 or w < 20:
            return {"pequeno": True}
        attrs, p_cima, p_baixo = self._par(rec_bgr)
        c, assinatura = self._clip(rec_bgr)

        # Saia/vestido depende do gênero estimado: com homem muito provável, o
        # CLIP confundia pernas cruzadas ou recorte cortado com saia.
        p_fem = c["genero"][1]
        bt = list(c["baixo_tipo"])
        bt[2] *= 0.15 + 0.85 * p_fem
        tot = sum(bt) or 1.0
        c["baixo_tipo"] = [x / tot for x in bt]

        def escolha(k):
            probs = c[k]
            i = int(np.argmax(probs))
            return {"valor": PROMPTS[k][1][i], "conf": round(float(probs[i]), 3)}

        def sim_nao(k, p_par):
            p = (c[k][0] + float(p_par)) / 2  # probabilidade de "sim"
            return {"valor": p >= 0.5, "conf": round(max(p, 1 - p), 3)}

        out = {
            "genero": escolha("genero"),
            "baixo_tipo": escolha("baixo_tipo"),
            "bone": sim_nao("bone", attrs[3]),
            "mochila": sim_nao("mochila", attrs[2]),
            "bolsa": sim_nao("bolsa", attrs[1]),
        }
        if noturna:
            out["cima"] = {"valor": None, "motivo": "sem cor (imagem noturna)"}
            out["baixo_cor"] = {"valor": None, "motivo": "sem cor (imagem noturna)"}
        else:
            hsv = cv2.cvtColor(rec_bgr, cv2.COLOR_BGR2HSV)
            # pontos de cor do modelo da Intel; se vierem estranhos, usa o tronco e as pernas
            cx, cy = (float(p_cima[0]), float(p_cima[1])) if 0.1 < p_cima[1] < 0.6 else (0.5, 0.33)
            bx, by = (float(p_baixo[0]), float(p_baixo[1])) if 0.4 < p_baixo[1] < 0.95 else (0.5, 0.7)
            for chave, (px, py) in (("cima", (cx, cy)), ("baixo_cor", (bx, by))):
                nome, conf = nome_da_cor(_regiao(hsv, px, py, 0.2, 0.1))
                out[chave] = {"valor": nome or None, "conf": round(conf, 3)}
        # Assinatura visual (vetor do CLIP): serve só para comparar recortes
        # entre câmeras (experimental). Não é biometria de rosto.
        out["_assinatura"] = assinatura
        return out

    def veiculo(self, rec_bgr: np.ndarray, noturna: bool) -> dict:
        h, w = rec_bgr.shape[:2]
        if h < 24 or w < 24:
            return {"pequeno": True}
        if noturna:
            return {"cor": {"valor": None, "motivo": "sem cor (imagem noturna)"}}
        x = cv2.resize(rec_bgr, (72, 72)).transpose(2, 0, 1)[None].astype(np.float32)
        r = {k.get_any_name(): np.array(v).ravel() for k, v in self.vei(x).items()}
        cor = r["color"]
        i = int(np.argmax(cor))
        return {"cor": {"valor": CORES_VEICULO[i], "conf": round(float(cor[i]), 3)}}
