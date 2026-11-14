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
    "baixo_tipo": (["a photo of a person wearing long trousers or jeans", "a photo of a person wearing shorts"], ["calça", "bermuda/short"]),
    "mochila": (["a person carrying a backpack", "a person without a backpack"], [True, False]),
    "bolsa": (["a person carrying a handbag or a shoulder bag", "a person not carrying any bag"], [True, False]),
}
# Gênero no recorte em PRETO E BRANCO: a cor da roupa (camisa rosa) não pode influenciar.
PROMPTS_CINZA = {"genero": (["a black and white photo of a man", "a black and white photo of a woman"], ["masculino", "feminino"])}
# Boné num recorte ampliado só da cabeça.
PROMPTS_CABECA = {"bone": (["a close-up photo of a head wearing a cap or a hat", "a close-up photo of a head with bare hair and no hat"], [True, False])}
E_PESSOA = ["a photo of a person", "a photo of a motorcycle", "a photo of a car", "a photo of a trash bag or garbage on the ground", "a photo of an empty street or wall"]
URL_POSE = "https://download.openmmlab.com/mmpose/v1/projects/rtmposev1/onnx_sdk/rtmpose-t_simcc-body7_pt-body7_420e-256x192-026a1439_20230504.zip"
CONCORDANCIA_MIN = 0.6


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

        def textos(d):
            out = {}
            with torch.no_grad():
                for k, (prompts, valores) in d.items():
                    t = self.clip.encode_text(tok(prompts))
                    out[k] = (t / t.norm(dim=-1, keepdim=True), valores)
            return out

        self.t_cor = textos(PROMPTS)
        self.t_cinza = textos(PROMPTS_CINZA)
        self.t_cabeca = textos(PROMPTS_CABECA)
        with torch.no_grad():
            t = self.clip.encode_text(tok(E_PESSOA))
            self.t_pessoa = t / t.norm(dim=-1, keepdim=True)
        self.pose = None
        try:
            from rtmlib import RTMPose

            self.pose = RTMPose(onnx_model=URL_POSE, model_input_size=(192, 256), backend="onnxruntime", device="cpu")
        except Exception as e:  # sem pose: calça x short fica indefinido
            print("[atributos] pose indisponível:", repr(e)[:200], flush=True)

    # ---------- básicos

    def _emb(self, rec_bgr: np.ndarray):
        from PIL import Image

        img = self.prep(Image.fromarray(cv2.cvtColor(rec_bgr, cv2.COLOR_BGR2RGB))).unsqueeze(0)
        with self._torch.no_grad():
            e = self.clip.encode_image(img)
            return e / e.norm(dim=-1, keepdim=True)

    def assinatura(self, rec_bgr: np.ndarray) -> np.ndarray:
        """Vetor visual do recorte (para juntar a mesma passagem). Não é biometria de rosto."""
        return self._emb(rec_bgr)[0].numpy().astype(np.float32)

    @staticmethod
    def _probs(e, textos) -> dict[str, list[float]]:
        return {k: (100 * e @ t.T).softmax(-1)[0].tolist() for k, (t, _) in textos.items()}

    def _par(self, rec_bgr: np.ndarray):
        x = cv2.resize(rec_bgr, (80, 160)).transpose(2, 0, 1)[None].astype(np.float32)
        return np.array(list(self.par(x).values())[0]).ravel()  # is_male, bag, backpack, hat, longsleeves, longpants, longhair, coat

    def _classe(self, rec_bgr: np.ndarray) -> np.ndarray:
        with self._torch.no_grad():
            return (100 * self._emb(rec_bgr) @ self.t_pessoa.T).softmax(-1)[0].numpy()

    @staticmethod
    def _cabeca(rec: np.ndarray) -> np.ndarray:
        h, w = rec.shape[:2]
        cab = rec[: max(8, int(h * 0.24)), int(w * 0.1): max(int(w * 0.1) + 4, int(w * 0.9))]
        return cv2.resize(cab, (224, 224), interpolation=cv2.INTER_CUBIC)

    def _pernas(self, rec: np.ndarray) -> tuple[str | None, float]:
        """Pose (joelho e tornozelo) + pele entre eles: perna aparecendo = short;
        coberta = calça. Devolve (valor, confiança) ou (None, 0) se não der para ver."""
        if self.pose is None or rec.shape[0] < 60:
            return None, 0.0
        h, w = rec.shape[:2]
        esc = max(1.0, 256 / h)
        big = cv2.resize(rec, (int(w * esc), int(h * esc)), interpolation=cv2.INTER_CUBIC)
        kp, sc = self.pose(big, bboxes=[[0, 0, big.shape[1], big.shape[0]]])
        kp, sc = kp[0], sc[0]
        ycc = cv2.cvtColor(big, cv2.COLOR_BGR2YCrCb)
        fracs = []
        for j, a in ((13, 15), (14, 16)):
            if min(sc[j], sc[a]) < 0.35 or np.hypot(*(kp[a] - kp[j])) < 0.06 * big.shape[0]:
                continue
            m = np.zeros(big.shape[:2], np.uint8)
            cv2.line(m, tuple(map(int, kp[j])), tuple(map(int, kp[a])), 255, max(3, int(big.shape[1] * 0.08)))
            px = ycc[m > 0]
            if len(px) < 20:
                continue
            fracs.append(float(((px[:, 1] >= 133) & (px[:, 1] <= 173) & (px[:, 2] >= 77) & (px[:, 2] <= 127)).mean()))
        if not fracs:
            return None, 0.0
        pele = float(np.mean(fracs))
        if pele >= 0.4:
            return "bermuda/short", min(1.0, 0.6 + pele * 0.4)
        if pele <= 0.12:
            return "calça", min(1.0, 0.6 + (0.12 - pele) * 3)
        return None, 0.0

    # ---------- pessoa

    def pessoa(self, recortes: list[np.ndarray], recs_attr: list[np.ndarray], noturna: bool, condutor: bool, ganhos) -> dict | None:
        """None = não é pessoa (não gravar). `recortes` (os melhores, para conferir
        se é pessoa) e `recs_attr` (só os tirados dentro da zona de atributos)."""
        recortes = [r for r in recortes if r.shape[0] >= 30 and r.shape[1] >= 12]
        if not recortes:
            return None
        cls = self._classe(recortes[0])
        p_pessoa, p_moto = float(cls[0]), float(cls[1])
        if int(cls.argmax()) not in (0, 1) or (int(cls.argmax()) == 1 and not condutor and p_pessoa < 0.15):
            return None  # lixo, carro, rua vazia: não é pessoa
        condutor = condutor or p_moto >= 0.25
        out: dict = {"papel": "condutor" if condutor else "pedestre", "e_pessoa": round(p_pessoa, 3)}
        if p_moto > p_pessoa:  # o recorte mostra mais moto do que pessoa: não estima nada
            out["pequeno"] = True
            out["motivo"] = "mais moto do que pessoa no recorte"
            return out
        recs = [r for r in recs_attr if r.shape[0] >= 70 and r.shape[1] >= 24]
        if not recs:
            out["pequeno"] = True
            out["motivo"] = "fora da zona de atributos ou pequeno demais" if recs_attr == [] else "recorte pequeno"
            return out

        # por recorte: CLIP colorido, CLIP em preto e branco, CLIP da cabeça e modelo da Intel
        p_cor, p_cinza, p_cab, par = [], [], [], []
        for r in recs:
            p_cor.append(self._probs(self._emb(r), self.t_cor))
            cinza = cv2.cvtColor(cv2.cvtColor(r, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
            p_cinza.append(self._probs(self._emb(cinza), self.t_cinza))
            p_cab.append(self._probs(self._emb(self._cabeca(r)), self.t_cabeca))
            par.append(self._par(r))
        par = np.array(par)

        def combinar(k, por_recorte, valores, par_sim=None):
            """Média do CLIP entre recortes; concordância = fração dos recortes que
            votam no vencedor. Com o modelo da Intel (par_sim = prob. de 'sim' ou do
            1º valor), só vale se os dois concordarem."""
            m = np.mean([x[k] for x in por_recorte], axis=0)
            i = int(np.argmax(m))
            votos = [int(np.argmax(x[k])) for x in por_recorte]
            conc = votos.count(i) / len(votos)
            conf = float(m[i])
            acordo = True
            if par_sim is not None:
                i_par = 0 if par_sim >= 0.5 else 1
                acordo = i_par == i
                conf = (conf + max(par_sim, 1 - par_sim)) / 2
            ok = acordo and conc >= CONCORDANCIA_MIN
            return {"valor": valores[i] if ok else None, "conf": round(conf, 3), "concordancia": round(conc, 2), "acordo": acordo, "recortes": len(por_recorte)}

        out["genero"] = combinar("genero", p_cinza, PROMPTS_CINZA["genero"][1], float(par[:, 0].mean()))
        out["bone"] = combinar("bone", p_cab, PROMPTS_CABECA["bone"][1], float(par[:, 3].mean()))
        out["mochila"] = combinar("mochila", p_cor, PROMPTS["mochila"][1], float(par[:, 2].mean()))
        out["bolsa"] = combinar("bolsa", p_cor, PROMPTS["bolsa"][1], float(par[:, 1].mean()))
        if not condutor:
            clip_baixo = combinar("baixo_tipo", p_cor, PROMPTS["baixo_tipo"][1], None)
            pose_valor, pose_conf = self._pernas(recs[0])
            acordo = pose_valor is not None and pose_valor == clip_baixo["valor"]
            out["baixo_tipo"] = {
                "valor": clip_baixo["valor"] if acordo else None,
                "conf": round((clip_baixo["conf"] + pose_conf) / 2, 3) if acordo else round(clip_baixo["conf"], 3),
                "concordancia": clip_baixo["concordancia"], "acordo": acordo, "pose": pose_valor, "recortes": len(recs),
            }
        if noturna:
            out["cima"] = {"valor": None, "motivo": "sem cor (imagem noturna)"}
            if not condutor:
                out["baixo_cor"] = {"valor": None, "motivo": "sem cor (imagem noturna)"}
        else:
            corr = [corrigir_tom(r, ganhos) for r in recs]
            out["cima"] = votar([cor_da_regiao(miolo(r, 0.32, 0.68, 0.22, 0.45)) for r in corr])
            if not condutor:
                out["baixo_cor"] = votar([cor_da_regiao(miolo(r, 0.34, 0.66, 0.6, 0.82)) for r in corr])
            for k in ("cima", "baixo_cor"):
                if k in out and out[k].get("concordancia", 1) < CONCORDANCIA_MIN:
                    out[k]["valor"] = None
        return out

    def veiculo(self, recortes: list[np.ndarray], noturna: bool, ganhos) -> dict:
        recortes = [r for r in recortes if r.shape[0] >= 20 and r.shape[1] >= 20]
        if not recortes:
            return {"pequeno": True}
        if noturna:
            return {"cor": {"valor": None, "motivo": "sem cor (imagem noturna)"}}
        corr = [corrigir_tom(r, ganhos) for r in recortes]
        cor = votar([cor_da_regiao(miolo(r, 0.22, 0.78, 0.3, 0.7), veiculo=True) for r in corr])
        if cor.get("concordancia", 1) < CONCORDANCIA_MIN:
            cor["valor"] = None
        return {"cor": cor}
