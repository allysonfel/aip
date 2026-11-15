"""Regras da loja (etapa 4), com base nas regras da branch vigia-cameras do
André. Cada regra liga e desliga na Configuração; os alertas vão para a
tabela `alertas` (sino do painel). Sem WhatsApp por enquanto.

Horários em Brasília (UTC-3, sem horário de verão). A loja abre e fecha nos
horários configurados; fora deles ela está "fechada" e vigiada.
"""

from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone

BR = timezone(timedelta(hours=-3))

REGRAS_PADRAO = {
    "loja_fechada": True,
    "fechamento": True,
    "sala_maquinas": True,
    "camera_caida": True,
    "pet": True,
    "fachada_fechada": True,
    "totem": True,
}

INTERNAS_PADRAO = {"cam3", "cam4", "cam5"}  # Recepção, Sala de Máquinas, Salão
SALA_MAQUINAS = "cam4"
LOJA_FECHADA_S = 3.0  # pessoa dentro da área interna por 3 s seguidos
PET_INTERVALO_S = 1800  # no máximo um alerta de pet a cada 30 min por câmera


def hora_br(ts: float | None = None) -> float:
    d = datetime.fromtimestamp(ts or time.time(), BR)
    return d.hour + d.minute / 60


def dentro(h: float, de: float, ate: float) -> bool:
    return de <= h < ate if de <= ate else (h >= de or h < ate)


class Regras:
    """Avalia as regras a cada análise. Para não repetir o mesmo alerta, cada
    (regra, câmera) só alerta de novo depois de `intervalo` segundos."""

    def __init__(self, salvar_alerta) -> None:
        self.salvar = salvar_alerta  # (tipo, canal, nivel, mensagem, imagem_bgr | None)
        self.cfg = {"abre": 6.0, "fecha": 23.0, "limpeza_de": 14.0, "limpeza_ate": 17.0, "regras": dict(REGRAS_PADRAO), "fachada_s": 60, "totem_s": 180}
        self._ultimo: dict[tuple, float] = {}
        self._presenca: dict[tuple, list[float]] = {}  # (canal, tid, situação) -> [desde, último]
        self._caida: dict[str, float] = {}
        self._fech_aviso_dia: str | None = None
        self._fech_conf_dia: str | None = None

    def configurar(self, cfg: dict) -> None:
        regras = dict(REGRAS_PADRAO)
        regras.update(cfg.get("regras") or {})
        self.cfg.update({k: v for k, v in cfg.items() if k != "regras"})
        self.cfg["regras"] = regras

    def ativa(self, nome: str) -> bool:
        return bool(self.cfg["regras"].get(nome, False))

    def aberta(self, ts: float | None = None) -> bool:
        return dentro(hora_br(ts), float(self.cfg["abre"]), float(self.cfg["fecha"]))

    def _alertar(self, chave: tuple, intervalo: float, tipo: str, canal: str | None, nivel: str, msg: str, img=None) -> None:
        agora = time.time()
        if agora - self._ultimo.get(chave, 0) < intervalo:
            return
        self._ultimo[chave] = agora
        self.salvar(tipo, canal, nivel, msg, img)

    # ---------- por análise de câmera

    def _ha(self, k: tuple, ts: float) -> float:
        """Há quantos segundos SEGUIDOS a pessoa está na situação k (uma falha
        de detecção de até 1 s não zera a conta)."""
        p = self._presenca.get(k)
        if p is None or ts - p[1] > 1.0:
            p = [ts, ts]
        p[1] = ts
        self._presenca[k] = p
        return ts - p[0]

    def avaliar(self, canal: str, nome: str, ts: float, img, pessoas: list[tuple[int, tuple]], fachada: bool, interna: bool, zona_totem) -> None:
        """pessoas: nas câmeras internas, só quem tem o pé dentro da área interna."""
        aberta = self.aberta(ts)
        n = len(pessoas)
        if interna and n and not aberta and self.ativa("loja_fechada"):
            # só alerta com a pessoa dentro da loja por pelo menos 3 s seguidos
            seguidos = [tid for tid, _ in pessoas if self._ha((canal, tid, "fechada"), ts) >= LOJA_FECHADA_S]
            if seguidos:
                self._alertar(("loja_fechada", canal), 300, "loja_fechada", canal, "urgente", f"Loja fechada: {n} pessoa(s) na câmera {nome}.", img)
        if canal == SALA_MAQUINAS and n and self.ativa("sala_maquinas"):
            limpeza = dentro(hora_br(ts), float(self.cfg["limpeza_de"]), float(self.cfg["limpeza_ate"]))
            if not limpeza:
                self._alertar(("sala_maquinas", canal), 300, "sala_maquinas", canal, "alto", f"Pessoa na Sala de Máquinas fora do horário da limpeza ({nome}).", img)

        # presença prolongada: fachada com a loja fechada e zona do totem
        for tid, (x1, y1, x2, y2) in pessoas:
            pe = ((x1 + x2) / 2, y2)
            if fachada and not aberta and self.ativa("fachada_fechada"):
                if self._ha((canal, tid, "fachada"), ts) >= float(self.cfg["fachada_s"]):
                    self._alertar(("fachada", canal, tid), 600, "fachada_fechada", canal, "alto", f"Pessoa parada na fachada há mais de {int(self.cfg['fachada_s'])} s com a loja fechada ({nome}).", img)
            if zona_totem is not None and self.ativa("totem") and _no_poligono(zona_totem, pe):
                if self._ha((canal, tid, "totem"), ts) >= float(self.cfg["totem_s"]):
                    self._alertar(("totem", canal, tid), 900, "totem", canal, "medio", f"Cliente parado no totem há mais de {int(self.cfg['totem_s']) // 60} min ({nome}). Pode estar com dificuldade.", img)
        for k in [k for k, p in self._presenca.items() if k[0] == canal and ts - p[1] > 1.0]:
            del self._presenca[k]

    def pet(self, canal: str, nome: str, classe: str, img) -> None:
        """Pet já confirmado (detector + CLIP, dentro da área interna, 3 s).
        Um alerta por animal: no máximo um a cada 30 min por câmera."""
        if self.ativa("pet"):
            bicho = {"cachorro": "Cachorro", "gato": "Gato"}.get(classe, "Cachorro ou gato")
            self._alertar(("pet", canal), PET_INTERVALO_S, "pet", canal, "medio", f"{bicho} na loja (câmera {nome}). Registre para a higienização da máquina usada depois.", img)

    # ---------- gerais (a cada poucos segundos)

    def avaliar_geral(self, cameras_online: dict[str, tuple[str, bool]], ocupacao: int) -> None:
        agora = time.time()
        if self.ativa("camera_caida"):
            for canal, (nome, online) in cameras_online.items():
                if online:
                    if canal in self._caida and agora - self._caida[canal] >= 120:
                        self.salvar("camera_voltou", canal, "info", f"A câmera {nome} voltou a mandar imagem.", None)
                    self._caida.pop(canal, None)
                else:
                    desde = self._caida.setdefault(canal, agora)
                    if agora - desde >= 120:
                        todas = all(not o for _, o in cameras_online.values())
                        nivel = "urgente" if todas and not self.aberta() else "alto"
                        self._alertar(("camera_caida", canal), 3600, "camera_caida", canal, nivel, f"Câmera {nome} sem imagem há mais de 2 minutos.", None)
        if self.ativa("fechamento"):
            d = datetime.now(BR)
            dia = d.strftime("%Y-%m-%d")
            h = d.hour + d.minute / 60
            fecha = float(self.cfg["fecha"])
            if fecha - 0.25 <= h < fecha and self._fech_aviso_dia != dia:
                self._fech_aviso_dia = dia
                if ocupacao > 0:
                    self.salvar("fechamento", None, "medio", f"Faltam 15 min para fechar e ainda há {ocupacao} pessoa(s) na loja (pela contagem da porta).", None)
            if fecha + 5 / 60 <= h < fecha + 0.5 and self._fech_conf_dia != dia:
                self._fech_conf_dia = dia
                if ocupacao > 0:
                    self.salvar("fechamento", None, "alto", f"5 min depois do fechamento a contagem ainda indica {ocupacao} pessoa(s) dentro. Confira as câmeras.", None)
                else:
                    self.salvar("fechamento", None, "info", "Loja fechou vazia (pela contagem da porta).", None)


def _no_poligono(poligono, ponto) -> bool:
    import cv2
    import numpy as np

    return cv2.pointPolygonTest(np.asarray(poligono, dtype=np.float32), (float(ponto[0]), float(ponto[1])), False) >= 0
