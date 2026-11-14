"""Atributos de pessoas e veículos: UM resultado por objeto, por votação entre
os melhores recortes dele (até 5), e não um resultado por recorte.

Antes de estimar, confere se o recorte é mesmo de uma pessoa (CLIP, pergunta
fechada: pessoa x moto x carro x lixo x rua vazia). Se não for, nada é
estimado e o registro não é gravado (lixo, moto e sombra viravam "pessoa").

Pessoas:
  - gênero estimado e parte de baixo (calça, bermuda/short, saia/vestido):
    CLIP ViT-B-16, média das probabilidades dos recortes;
  - boné/chapéu, mochila e bolsa: média do CLIP com o modelo de pedestres da
    Intel (person-attributes-recognition-crossroad-0230);
  - cores de cima e de baixo: HSV só no miolo do tronco e das pernas (sem o
    fundo), depois de corrigir o tom da câmera (balanço de branco); votação
    entre os recortes;
  - condutor/passageiro de moto ou bicicleta: sem parte de baixo, e o resto
    só se o recorte mostrar bem a pessoa.
Veículos:
  - cor por HSV no miolo da carroceria (sem faróis, lanternas e reflexos),
    com balanço de branco e "prata"; votação entre os recortes.

Imagem noturna (preto e branco): sem cor. Sem reconhecimento facial.
"""

from __future__ import annotations

import os
from collections import defaultdict

import cv2
import numpy as np

PASTA_OMZ = os.environ.get("MOTOR_OMZ", "/app/modelo/omz")
CLIP_NOME = os.environ.get("MOTOR_CLIP", "ViT-B-16")
CLIP_PESOS = os.environ.get("MOTOR_CLIP_PESOS", "laion2b_s34b_b88k")

PROMPTS = {
    "genero": (["a photo of a man", "a photo of a woman"], ["masculino", "feminino"]),
    "baixo_tipo": (["a photo of a person wearing long trousers or jeans", "a photo of a person wearing shorts", "a photo of a woman wearing a skirt or a dress"], ["calça", "bermuda/short", "saia/vestido"]),
    "bone": (["a person wearing a cap or a hat", "a person with nothing on the head"], [True, False]),
    "mochila": (["a person carrying a backpack", "a person without a backpack"], [True, False]),
    "bolsa": (["a person carrying a handbag or a shoulder bag", "a person not carrying any bag"], [True, False]),
}
E_PESSOA = ["a photo of a person", "a photo of a motorcycle", "a photo of a car", "a photo of a trash bag or garbage on the ground", "a photo of an empty street or wall"]


# ---------------------------------------------------------------- cor

def corrigir_tom(bgr: np.ndarray, ganhos) -> np.ndarray:
    """Balanço de branco da câmera (ganhos por canal B, G, R)."""
    if ganhos is None:
        return bgr
    return np.clip(bgr.astype(np.float32) * np.asarray(ganhos, dtype=np.float32), 0, 255).astype(np.uint8)


def ganhos_da_imagem(bgr: np.ndarray) -> np.ndarray | None:
    """Ganhos de balanço de branco pelos pixels quase cinzas da cena (asfalto,
    paredes, chão). Pixels muito coloridos (a fachada azul) ficam de fora, para
    não puxarem a correção."""
    peq = cv2.resize(bgr, (160, 110))
    hsv = cv2.cvtColor(peq, cv2.COLOR_BGR2HSV)
    m = (hsv[..., 1] < 60) & (hsv[..., 2] > 40) & (hsv[..., 2] < 225)
    if m.sum() < 400:
        return None
    med = peq[m].astype(np.float32).mean(axis=0)  # B, G, R
    alvo = med.mean()
    return np.clip(alvo / np.maximum(med, 1), 0.6, 1.6)


def classificar_pixels(hsv: np.ndarray, veiculo: bool) -> np.ndarray:
    h = hsv[..., 0].astype(int).ravel()
    s = hsv[..., 1].astype(int).ravel()
    v = hsv[..., 2].astype(int).ravel()
    nomes = np.empty(h.size, dtype=object)
    escuro = v < 55
    sem_sat = (s < 45) & ~escuro
    nomes[escuro] = "preto"
    if veiculo:
        nomes[sem_sat & (v >= 185)] = "branco"
        nomes[sem_sat & (v >= 115) & (v < 185)] = "prata"
        nomes[sem_sat & (v < 115)] = "cinza"
    else:
        nomes[sem_sat & (v >= 185)] = "branco"
        nomes[sem_sat & (v < 185)] = "cinza"
    cor = ~escuro & ~sem_sat
    hh, ss, vv = h[cor], s[cor], v[cor]
    nomes[cor] = np.where(
        (hh < 8) | (hh >= 168), np.where((ss < 120) & (vv > 160), "rosa", "vermelho"),
        np.where(hh < 20, np.where(vv < 130, "marrom", np.where((ss < 100) & (vv > 150), "bege", "laranja")),
        np.where(hh < 33, np.where((ss < 90) & (vv > 150), "bege", "amarelo"),
        np.where(hh < 85, "verde",
        np.where(hh < 128, "azul",
        np.where(hh < 148, "roxo", "rosa")))))).astype(object)
    return nomes


def cor_da_regiao(bgr: np.ndarray, veiculo: bool = False) -> tuple[str | None, float]:
    """Cor dominante nomeada. Confiança = fração dos pixels nessa cor."""
    if bgr.size == 0 or bgr.shape[0] * bgr.shape[1] < 30:
        return None, 0.0
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    if veiculo:
        # fora: faróis/reflexos (muito claros) e lanternas (vermelho muito saturado e claro)
        flat = hsv.reshape(-1, 3)
        ok = ~((flat[:, 2] > 245) & (flat[:, 1] < 60)) & ~((flat[:, 1] > 200) & (flat[:, 2] > 230))
        if ok.sum() < 30:
            return None, 0.0
        hsv = flat[ok][None]
    nomes = classificar_pixels(hsv, veiculo)
    valores, contagem = np.unique(nomes, return_counts=True)
    i = int(np.argmax(contagem))
    return str(valores[i]), float(contagem[i] / nomes.size)


def miolo(rec: np.ndarray, x0: float, x1: float, y0: float, y1: float) -> np.ndarray:
    h, w = rec.shape[:2]
    return rec[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)]


def votar(itens: list[tuple[str | None, float]]) -> dict:
    """Votação ponderada pela confiança. Confiança final = soma da confiança
    do vencedor / número de recortes (penaliza discordância)."""
    validos = [(v, c) for v, c in itens if v]
    if not validos:
        return {"valor": None, "conf": 0.0}
    placar: dict[str, float] = defaultdict(float)
    for v, c in validos:
        placar[v] += c
    venc = max(placar, key=placar.get)
    concord = sum(1 for v, _ in validos if v == venc) / len(validos)
    return {"valor": venc, "conf": round(placar[venc] / len(itens), 3), "concordancia": round(concord, 2), "recortes": len(itens)}


def imagem_noturna(bgr: np.ndarray) -> bool:
    peq = cv2.resize(bgr, (96, 64))
    return float(cv2.cvtColor(peq, cv2.COLOR_BGR2HSV)[..., 1].mean()) < 14


# ---------------------------------------------------------------- modelos


class Atributos:
    def __init__(self, threads: int = 1) -> None:
        import openvino as ov
        import open_clip
        import torch

        torch.set_num_threads(threads)
        self._torch = torch
        core = ov.Core()
        self.par = core.compile_model(f"{PASTA_OMZ}/person-attributes-recognition-crossroad-0230.xml", "CPU", {"INFERENCE_NUM_THREADS": threads})
        self.clip, _, self.prep = open_clip.create_model_and_transforms(CLIP_NOME, pretrained=CLIP_PESOS)
        self.clip.eval()
        tok = open_clip.get_tokenizer(CLIP_NOME)
        with torch.no_grad():
            self.textos = {}
            for k, (prompts, valores) in PROMPTS.items():
                t = self.clip.encode_text(tok(prompts))
                self.textos[k] = (t / t.norm(dim=-1, keepdim=True), valores)
            t = self.clip.encode_text(tok(E_PESSOA))
            self.t_pessoa = t / t.norm(dim=-1, keepdim=True)

    def _emb(self, rec_bgr: np.ndarray):
        from PIL import Image

        img = self.prep(Image.fromarray(cv2.cvtColor(rec_bgr, cv2.COLOR_BGR2RGB))).unsqueeze(0)
        with self._torch.no_grad():
            e = self.clip.encode_image(img)
            return e / e.norm(dim=-1, keepdim=True)

    def eh_pessoa(self, e) -> tuple[bool, float]:
        p = (100 * e @ self.t_pessoa.T).softmax(-1)[0]
        return bool(int(p.argmax()) == 0 and float(p[0]) >= 0.5), float(p[0])

    def _par(self, rec_bgr: np.ndarray):
        x = cv2.resize(rec_bgr, (80, 160)).transpose(2, 0, 1)[None].astype(np.float32)
        vals = list(self.par(x).values())
        return np.array(vals[0]).ravel()  # is_male, bag, backpack, hat, longsleeves, longpants, longhair, coat

    def pessoa(self, recortes: list[np.ndarray], noturna: bool, condutor: bool, ganhos) -> dict | None:
        """None = não é pessoa (não gravar). Recortes em ordem de qualidade."""
        recortes = [r for r in recortes if r.shape[0] >= 40 and r.shape[1] >= 16]
        if not recortes:
            return {"pequeno": True, "papel": "condutor" if condutor else "pedestre"}
        embs = [self._emb(r) for r in recortes]
        # é pessoa? decide pelo melhor recorte e confirma pela maioria
        votos = [self.eh_pessoa(e) for e in embs]
        if not votos[0][0] and sum(v for v, _ in votos) <= len(votos) / 2:
            return None
        out: dict = {"papel": "condutor" if condutor else "pedestre", "e_pessoa": round(float(np.mean([p for _, p in votos])), 3)}
        bem_visto = recortes[0].shape[0] >= 90
        if condutor and not bem_visto:
            out["pequeno"] = True
            out["_assinatura"] = [round(float(x), 4) for x in embs[0][0].tolist()]
            return out

        probs: dict[str, list] = {k: [] for k in PROMPTS}
        with self._torch.no_grad():
            for e in embs:
                for k, (t, _) in self.textos.items():
                    probs[k].append((100 * e @ t.T).softmax(-1)[0].tolist())
        par = [self._par(r) for r in recortes]
        media = {k: np.mean(np.array(v), axis=0) for k, v in probs.items()}
        # saia/vestido depende do gênero estimado (CLIP confundia pernas cruzadas e recorte cortado)
        bt = media["baixo_tipo"].copy()
        bt[2] *= 0.15 + 0.85 * media["genero"][1]
        media["baixo_tipo"] = bt / (bt.sum() or 1)

        def escolha(k):
            i = int(np.argmax(media[k]))
            return {"valor": PROMPTS[k][1][i], "conf": round(float(media[k][i]), 3), "recortes": len(recortes)}

        def sim_nao(k, idx_par):
            p = (float(media[k][0]) + float(np.mean([a[idx_par] for a in par]))) / 2
            return {"valor": p >= 0.5, "conf": round(max(p, 1 - p), 3), "recortes": len(recortes)}

        out["genero"] = escolha("genero")
        out["bone"] = sim_nao("bone", 3)
        out["mochila"] = sim_nao("mochila", 2)
        out["bolsa"] = sim_nao("bolsa", 1)
        if not condutor:
            out["baixo_tipo"] = escolha("baixo_tipo")
        if noturna:
            out["cima"] = {"valor": None, "motivo": "sem cor (imagem noturna)"}
            if not condutor:
                out["baixo_cor"] = {"valor": None, "motivo": "sem cor (imagem noturna)"}
        else:
            corr = [corrigir_tom(r, ganhos) for r in recortes]
            # miolo do tronco e das pernas: longe das bordas da caixa, onde aparece o fundo
            out["cima"] = votar([cor_da_regiao(miolo(r, 0.32, 0.68, 0.22, 0.45)) for r in corr])
            if not condutor:
                out["baixo_cor"] = votar([cor_da_regiao(miolo(r, 0.34, 0.66, 0.6, 0.82)) for r in corr])
        out["_assinatura"] = [round(float(x), 4) for x in embs[0][0].tolist()]
        return out

    def veiculo(self, recortes: list[np.ndarray], noturna: bool, ganhos) -> dict:
        recortes = [r for r in recortes if r.shape[0] >= 20 and r.shape[1] >= 20]
        if not recortes:
            return {"pequeno": True}
        if noturna:
            return {"cor": {"valor": None, "motivo": "sem cor (imagem noturna)"}}
        corr = [corrigir_tom(r, ganhos) for r in recortes]
        # miolo da carroceria: sem rodas, para-choques, faróis e o asfalto em volta
        return {"cor": votar([cor_da_regiao(miolo(r, 0.22, 0.78, 0.3, 0.7), veiculo=True) for r in corr])}
