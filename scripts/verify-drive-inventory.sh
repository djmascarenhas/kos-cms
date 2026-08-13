#!/bin/sh
set -eu

DATABASE_CONTAINER="${DATABASE_CONTAINER:-kos-cms-postgres}"
DATABASE_USER="${DATABASE_USER:-kos_cms}"
DATABASE_NAME="${DATABASE_NAME:-kos_cms}"

docker exec -i "$DATABASE_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DATABASE_USER" -d "$DATABASE_NAME" -At -c "
WITH latest AS (
  SELECT id, folder_count, file_count, total_size_bytes
  FROM drive_inventory_scans ORDER BY scanned_at DESC LIMIT 1
), totals AS (
  SELECT
    COUNT(*) AS registered,
    COUNT(*) FILTER (WHERE integrity_hash_status = 'verified') AS verified,
    COUNT(*) FILTER (WHERE integrity_hash_status = 'pending') AS pending,
    COUNT(*) FILTER (WHERE integrity_hash_status = 'unavailable') AS unavailable,
    COUNT(*) FILTER (WHERE duplicate_review_status = 'confirmed_duplicate') AS confirmed_duplicates,
    COUNT(*) FILTER (WHERE duplicate_review_status = 'candidate_by_metadata') AS metadata_candidates
  FROM documents WHERE source_type = 'google_drive'
), comparison AS (
  SELECT
    COUNT(*) FILTER (WHERE document.id IS NULL) AS drive_only
  FROM latest
  JOIN drive_inventory_files inventory ON inventory.scan_id = latest.id
  LEFT JOIN documents document ON document.drive_file_id = inventory.drive_file_id
)
SELECT json_build_object(
  'pastas', latest.folder_count,
  'arquivos_drive', latest.file_count,
  'bytes', latest.total_size_bytes,
  'registrados_portal', totals.registered,
  'somente_drive', comparison.drive_only,
  'hashes_verificados', totals.verified,
  'hashes_pendentes', totals.pending,
  'hashes_indisponiveis', totals.unavailable,
  'duplicidades_confirmadas', totals.confirmed_duplicates,
  'candidatos_por_metadados', totals.metadata_candidates
)
FROM latest, totals, comparison;
"
