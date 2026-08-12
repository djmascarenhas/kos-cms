#!/bin/sh
set -eu

BACKUP_ROOT="/opt/kos-cms/backups"
DATABASE_CONTAINER="kos-cms-postgres"
BACKUP_DIRECTORY="${1:-${BACKUP_ROOT}/latest}"
RESOLVED_DIRECTORY="$(readlink -f "$BACKUP_DIRECTORY")"

case "$RESOLVED_DIRECTORY" in
  "$BACKUP_ROOT"/20??????T??????Z) ;;
  *) echo "Caminho de backup invalido: $RESOLVED_DIRECTORY" >&2; exit 1 ;;
esac

(
  cd "$RESOLVED_DIRECTORY"
  sha256sum --check checksums.sha256
)
docker exec -i "$DATABASE_CONTAINER" pg_restore --list < "$RESOLVED_DIRECTORY/database.dump" >/dev/null
tar -tzf "$RESOLVED_DIRECTORY/documents.tar.gz" >/dev/null

echo "Backup integro: $RESOLVED_DIRECTORY"
