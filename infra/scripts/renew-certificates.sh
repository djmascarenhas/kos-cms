#!/bin/sh
set -eu

docker run --rm \
  -v /opt/kos-cms/letsencrypt:/etc/letsencrypt \
  -v /opt/kos-cms/certbot-www:/var/www/certbot \
  certbot/certbot renew --webroot -w /var/www/certbot --quiet

cd /opt/kos-cms/app
docker compose -f docker-compose.production.yml exec -T proxy nginx -s reload
