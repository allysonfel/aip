# Vistoria de câmeras · Feira da Fundac (Caruaru-PE)

App web (PWA) para a vistoria presencial das câmeras da Feira da Sulanca, Setor
Fundac. Sem servidor de dados: tudo fica no celular (IndexedDB) e sai por
exportação (arquivo completo .json, planilha CSV e imagem PNG).

- Publicado em https://aipbrasil.com/fundac-vistoria (Coolify, projeto
  `fundac-vistoria`, nginx com senha simples: variáveis `FV_USUARIO` e `FV_SENHA`).
- Mapa: Leaflet + satélite Esri World Imagery (na Fundac só existe até o zoom
  18; acima disso a imagem é ampliada). Mapbox Satellite opcional, com a chave
  informada no próprio app.
- Planta: `img/planta-transparente.webp` (sobreposição) e
  `img/planta-restaurada.jpg`, geradas por `ferramentas/restaurar-planta.py`
  (OpenCV, sem IA generativa: nenhuma posição muda).
- Encaixe inicial da planta no satélite e posições dos portões: `js/dados.js`.
- Funciona sem internet: `sw.js` guarda o app; o botão "Baixar mapa" guarda o
  satélite da área (com 200 m de margem).

Rodar local: `python3 -m http.server` na raiz do repositório e abrir
http://localhost:8000/fundac-vistoria/ (GPS e bússola exigem HTTPS fora do localhost).
