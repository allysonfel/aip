#!/bin/sh
# Gera o arquivo de senha do nginx a partir das variáveis do app.
set -e
U="${FV_USUARIO:-fundac}"
if [ -z "$FV_SENHA" ]; then
  echo "FV_SENHA vazia: acesso bloqueado com uma senha aleatória." >&2
  FV_SENHA="$(head -c 24 /dev/urandom | base64)"
fi
printf '%s:%s\n' "$U" "$(openssl passwd -apr1 "$FV_SENHA")" > /etc/nginx/.htpasswd
chmod 640 /etc/nginx/.htpasswd
chown root:nginx /etc/nginx/.htpasswd 2>/dev/null || true
