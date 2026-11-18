# Vistoria de câmeras · Feira da Fundac (Caruaru-PE)

App web (PWA) para a vistoria presencial das câmeras da Feira da Sulanca, Setor
Fundac, organizada em vistorias por dia. Cada aparelho salva tudo na hora
(IndexedDB, funciona sem internet) e sincroniza com o sistema quando há conexão:
vistorias, pontos, fichas, fotos, trajeto, conferência nos portões e encaixe da
planta ficam no Postgres do projeto e aparecem em qualquer aparelho com login.

- Publicado em https://aipbrasil.com/fundac-vistoria (Coolify, projeto
  `fundac-vistoria`: app `vistoria` com `server.js` em Node e banco
  `vistoria-db`, Postgres 18 privado). Variáveis: `DATABASE_URL`, `FV_USUARIO`,
  `FV_SENHA` (usuário inicial, criado só se não houver nenhum).
- Login com sessão (cookie de 180 dias). Sem login, a página vira a tela de
  entrar; o app já guardado no aparelho continua abrindo sem internet.
- Sincronização (`js/sync.js`): vale a versão mais nova de cada registro;
  exclusão é um "túmulo" (`apagado: true`) para avisar os outros aparelhos;
  nada é apagado do aparelho se tiver alteração local ainda não enviada.
- Câmera marcada de novo em outro dia: a ficha sugere juntar (até 12 m); a
  antiga ganha `substituidoPor` e deixa de contar no "Ver tudo junto".
- Versão 1 (só no celular): na primeira abertura da versão nova, os pontos
  guardados viram a "Vistoria 1 – data" e são enviados sozinhos.
- Mapa: Leaflet + satélite Esri World Imagery (na Fundac só existe até o zoom
  18; acima disso a imagem é ampliada). Mapbox Satellite opcional, com a chave
  informada no próprio app.
- Planta: `img/planta-transparente.webp` (sobreposição) e
  `img/planta-restaurada.jpg`, geradas por `ferramentas/restaurar-planta.py`
  (OpenCV, sem IA generativa: nenhuma posição muda).
- Encaixe inicial da planta no satélite e posições dos portões: `js/dados.js`.
- Funciona sem internet: `sw.js` guarda o app; o botão "Baixar mapa" guarda o
  satélite da área (com 200 m de margem).

Rodar local: `npm install`, um Postgres e
`FV_LOCAL=1 FV_PUBLICO=<pasta com o app em fundac-vistoria/> DATABASE_URL=... FV_USUARIO=... FV_SENHA=... PORT=8766 node server.js`,
abrindo http://localhost:8766/fundac-vistoria/ (GPS e bússola exigem HTTPS fora do localhost).
