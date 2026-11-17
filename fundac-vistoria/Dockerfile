# App web estático (PWA) da vistoria de câmeras da Fundac, servido por nginx
# em /fundac-vistoria, com senha simples (FV_USUARIO / FV_SENHA).
FROM nginx:1.27-alpine
RUN apk add --no-cache openssl
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY senha.sh /docker-entrypoint.d/40-senha.sh
RUN chmod +x /docker-entrypoint.d/40-senha.sh
COPY index.html manifest.webmanifest sw.js /usr/share/nginx/html/fundac-vistoria/
COPY css /usr/share/nginx/html/fundac-vistoria/css
COPY js /usr/share/nginx/html/fundac-vistoria/js
COPY vendor /usr/share/nginx/html/fundac-vistoria/vendor
COPY fonts /usr/share/nginx/html/fundac-vistoria/fonts
COPY img /usr/share/nginx/html/fundac-vistoria/img
EXPOSE 80
