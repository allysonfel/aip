# Vistoria de câmeras da Fundac: servidor Node (app + API) com Postgres.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=80
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server.js ./
COPY index.html entrar.html manifest.webmanifest sw.js ./public/
COPY css ./public/css
COPY js ./public/js
COPY vendor ./public/vendor
COPY fonts ./public/fonts
COPY img ./public/img
EXPOSE 80
CMD ["node", "server.js"]
