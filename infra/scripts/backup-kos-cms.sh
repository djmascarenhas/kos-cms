#!/bin/sh
set -eu

umask 077

BACKUP_ROOT="/opt/kos-cms/backups"
DOCUMENT_ROOT="/opt/kos-cms/documents"
DATABASE_CONTAINER="kos-cms-postgres"
DATABASE_NAME="kos_cms"
DATABASE_USER="kos_cms"
RETENTION_DAYS=30
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TEMPORARY_DIRECTORY="${BACKUP_ROOT}/.${STAMP}.tmp"
FINAL_DIRECTORY="${BACKUP_ROOT}/${STAMP}"

case "$BACKUP_ROOT" in
  /opt/kos-cms/backups) ;;
  *) echo "Diretorio de backup nao autorizado: $BACKUP_ROOT" >&2; exit 1 ;;
esac

cleanup() {
  if [ -d "$TEMPORARY_DIRECTORY" ]; then
    rm -rf -- "$TEMPORARY_DIRECTORY"
  fi
}
trap cleanup EXIT INT TERM

mkdir -p "$BACKUP_ROOT" "$TEMPORARY_DIRECTORY"
test -d "$DOCUMENT_ROOT"
docker inspect "$DATABASE_CONTAINER" >/dev/null

docker exec "$DATABASE_CONTAINER" pg_dump \
  --username="$DATABASE_USER" \
  --dbname="$DATABASE_NAME" \
  --format=custom \
  --compress=6 \
  --no-owner \
  --no-privileges > "$TEMPORARY_DIRECTORY/database.dump"

test -s "$TEMPORARY_DIRECTORY/database.dump"
docker exec -i "$DATABASE_CONTAINER" pg_restore --list < "$TEMPORARY_DIRECTORY/database.dump" >/dev/null

tar -C "$DOCUMENT_ROOT" -czf "$TEMPORARY_DIRECTORY/documents.tar.gz" .
tar -tzf "$TEMPORARY_DIRECTORY/documents.tar.gz" >/dev/null

cat > "$TEMPORARY_DIRECTORY/metadata.txt" <<EOF
created_at_utc=$STAMP
database=$DATABASE_NAME
database_container=$DATABASE_CONTAINER
documents_path=$DOCUMENT_ROOT
retention_days=$RETENTION_DAYS
EOF

(
  cd "$TEMPORARY_DIRECTORY"
  sha256sum database.dump documents.tar.gz metadata.txt > checksums.sha256
  sha256sum --check checksums.sha256 >/dev/null
)

mv "$TEMPORARY_DIRECTORY" "$FINAL_DIRECTORY"
ln -sfn "$STAMP" "$BACKUP_ROOT/latest"
trap - EXIT INT TERM

find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -name '20??????T??????Z' -mtime "+$RETENTION_DAYS" -exec rm -rf -- {} +

echo "Backup concluido e validado: $FINAL_DIRECTORY"
