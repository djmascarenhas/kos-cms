#!/bin/sh
set -eu

DATABASE_CONTAINER="${DATABASE_CONTAINER:-kos-cms-postgres}"
DATABASE_USER="${DATABASE_USER:-kos_cms}"
DATABASE_NAME="${DATABASE_NAME:-kos_cms}"
TEMPORARY_FILE="$(mktemp)"
INVENTORY_LIST="$(mktemp)"
trap 'rm -f "$TEMPORARY_FILE" "$INVENTORY_LIST"' EXIT INT TERM

psql_query() {
  # Sem -i: chamadas dentro do laço não podem consumir as linhas restantes do inventário.
  docker exec "$DATABASE_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DATABASE_USER" -d "$DATABASE_NAME" "$@"
}

psql_query -At -F '|' -c "
  SELECT drive_file_id, COALESCE(mime_type, ''), COALESCE(file_size_bytes, 0)
  FROM drive_inventory_files
  WHERE integrity_hash_status = 'pending'
  ORDER BY drive_path
" | sed '/^[[:space:]]*$/d' > "$INVENTORY_LIST"

while IFS='|' read -r drive_file_id mime_type expected_size; do
  [ -n "$drive_file_id" ] || continue
  target="$TEMPORARY_FILE"

  case "$mime_type" in
    application/vnd.google-apps.document)
      download_url="https://docs.google.com/document/d/$drive_file_id/export?format=docx"
      verify_size=0
      ;;
    application/vnd.google-apps.spreadsheet)
      download_url="https://docs.google.com/spreadsheets/d/$drive_file_id/export?format=xlsx"
      verify_size=0
      ;;
    application/vnd.google-apps.presentation)
      download_url="https://docs.google.com/presentation/d/$drive_file_id/export?format=pptx"
      verify_size=0
      ;;
    application/vnd.google-apps.form)
      psql_query -c "UPDATE drive_inventory_files SET integrity_hash_status = 'unavailable' WHERE drive_file_id = '$drive_file_id'; UPDATE documents SET integrity_hash_status = 'unavailable' WHERE drive_file_id = '$drive_file_id';" >/dev/null
      continue
      ;;
    *)
      download_url="https://drive.usercontent.google.com/download?id=$drive_file_id&export=download&confirm=t"
      verify_size=1
      ;;
  esac

  if ! curl --location --fail --silent --show-error --retry 3 --output "$target" "$download_url"; then
    printf 'Falha ao baixar %s\n' "$drive_file_id" >&2
    continue
  fi

  actual_size="$(wc -c < "$target" | tr -d ' ')"
  if [ "$verify_size" -eq 1 ] && [ "$expected_size" -gt 0 ] && [ "$actual_size" -ne "$expected_size" ]; then
    printf 'Tamanho divergente em %s: esperado=%s obtido=%s\n' "$drive_file_id" "$expected_size" "$actual_size" >&2
    rm -f "$target"
    continue
  fi

  sha256="$(sha256sum "$target" | awk '{print $1}')"
  psql_query -c "
    UPDATE drive_inventory_files
       SET sha256 = '$sha256', integrity_hash_status = 'verified'
     WHERE drive_file_id = '$drive_file_id';
    UPDATE documents
       SET sha256 = '$sha256', integrity_hash_status = 'verified', updated_at = now()
     WHERE drive_file_id = '$drive_file_id';
  " >/dev/null
  rm -f "$target"
done < "$INVENTORY_LIST"

psql_query -c "
  UPDATE drive_inventory_files SET duplicate_review_status = 'unique_hash'
   WHERE sha256 IS NOT NULL;
  UPDATE documents SET duplicate_review_status = 'unique_hash'
   WHERE source_type = 'google_drive' AND sha256 IS NOT NULL;

  WITH duplicates AS (
    SELECT sha256 FROM drive_inventory_files
    WHERE sha256 IS NOT NULL GROUP BY sha256 HAVING COUNT(*) > 1
  )
  UPDATE drive_inventory_files inventory
     SET duplicate_review_status = 'confirmed_duplicate'
    FROM duplicates
   WHERE inventory.sha256 = duplicates.sha256;

  WITH duplicates AS (
    SELECT sha256 FROM drive_inventory_files
    WHERE sha256 IS NOT NULL GROUP BY sha256 HAVING COUNT(*) > 1
  )
  UPDATE documents document
     SET duplicate_review_status = 'confirmed_duplicate'
    FROM duplicates
   WHERE document.sha256 = duplicates.sha256;

  INSERT INTO document_versions (
    document_id, version_number, storage_path, original_filename, mime_type,
    file_size_bytes, sha256, change_type, change_notes, created_at
  )
  SELECT document.id, 1, document.source_url, document.original_filename,
         document.mime_type, document.file_size_bytes, document.sha256,
         'importado', 'Referência do arquivo legado importado do Google Drive.',
         COALESCE(document.drive_created_at, document.imported_at, now())
  FROM documents document
  WHERE document.source_type = 'google_drive' AND document.sha256 IS NOT NULL
  ON CONFLICT DO NOTHING;
" >/dev/null

psql_query -At -c "
  SELECT json_build_object(
    'total', COUNT(*),
    'verificados', COUNT(*) FILTER (WHERE integrity_hash_status = 'verified'),
    'indisponiveis', COUNT(*) FILTER (WHERE integrity_hash_status = 'unavailable'),
    'pendentes', COUNT(*) FILTER (WHERE integrity_hash_status = 'pending'),
    'duplicidades_confirmadas', COUNT(*) FILTER (WHERE duplicate_review_status = 'confirmed_duplicate')
  ) FROM drive_inventory_files;
"
