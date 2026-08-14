-- Inventário do acervo legado do Google Drive e conciliação Portal x Drive.

BEGIN;

ALTER TABLE documents ADD COLUMN IF NOT EXISTS drive_file_id text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS drive_parent_id text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS drive_path text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS drive_created_at timestamptz;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS drive_modified_at timestamptz;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS drive_owner_name text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS drive_owner_email text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS historical_uploader_name text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS historical_uploader_email text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_access_level text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS integrity_hash_status text NOT NULL DEFAULT 'pending'
  CHECK (integrity_hash_status IN ('pending', 'verified', 'unavailable'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS duplicate_review_status text NOT NULL DEFAULT 'pending_hash'
  CHECK (duplicate_review_status IN ('pending_hash', 'candidate_by_metadata', 'unique_hash', 'confirmed_duplicate', 'not_duplicate'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS imported_at timestamptz;

-- Duplicidades devem ser preservadas durante a conferência; por isso o hash
-- passa a ser indexado, mas não exclusivo entre documentos distintos.
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_sha256_key;
CREATE INDEX IF NOT EXISTS documents_sha256_idx ON documents (sha256) WHERE sha256 IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS documents_drive_file_id_unique_idx
  ON documents (drive_file_id) WHERE drive_file_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS documents_drive_path_idx ON documents (drive_path);
CREATE INDEX IF NOT EXISTS documents_integrity_status_idx
  ON documents (integrity_hash_status, duplicate_review_status);

CREATE TABLE IF NOT EXISTS drive_inventory_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  root_folder_id text NOT NULL,
  root_folder_name text NOT NULL,
  root_folder_url text NOT NULL,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  folder_count integer NOT NULL CHECK (folder_count >= 0),
  file_count integer NOT NULL CHECK (file_count >= 0),
  total_size_bytes bigint NOT NULL CHECK (total_size_bytes >= 0),
  notes text,
  UNIQUE (root_folder_id, scanned_at)
);

CREATE TABLE IF NOT EXISTS drive_inventory_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES drive_inventory_scans(id) ON DELETE CASCADE,
  drive_folder_id text NOT NULL,
  parent_drive_folder_id text,
  folder_name text NOT NULL,
  drive_path text NOT NULL,
  drive_url text NOT NULL,
  drive_created_at timestamptz,
  drive_modified_at timestamptz,
  child_count integer NOT NULL DEFAULT 0 CHECK (child_count >= 0),
  UNIQUE (scan_id, drive_folder_id)
);

CREATE INDEX IF NOT EXISTS drive_inventory_folders_scan_idx
  ON drive_inventory_folders(scan_id, drive_path);

CREATE TABLE IF NOT EXISTS drive_inventory_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES drive_inventory_scans(id) ON DELETE CASCADE,
  drive_file_id text NOT NULL,
  parent_drive_folder_id text,
  original_filename text NOT NULL,
  drive_path text NOT NULL,
  source_url text NOT NULL,
  mime_type text,
  file_size_bytes bigint CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  drive_created_at timestamptz,
  drive_modified_at timestamptz,
  drive_owner_name text,
  drive_owner_email text,
  source_access_level text,
  sha256 char(64),
  integrity_hash_status text NOT NULL DEFAULT 'pending'
    CHECK (integrity_hash_status IN ('pending', 'verified', 'unavailable')),
  duplicate_review_status text NOT NULL DEFAULT 'pending_hash'
    CHECK (duplicate_review_status IN ('pending_hash', 'candidate_by_metadata', 'unique_hash', 'confirmed_duplicate', 'not_duplicate')),
  UNIQUE (scan_id, drive_file_id)
);

CREATE INDEX IF NOT EXISTS drive_inventory_files_scan_idx
  ON drive_inventory_files(scan_id, drive_path);
CREATE INDEX IF NOT EXISTS drive_inventory_files_hash_idx
  ON drive_inventory_files(sha256) WHERE sha256 IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kos_reader') THEN
    GRANT SELECT ON drive_inventory_scans, drive_inventory_folders, drive_inventory_files TO kos_reader;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kos_editor') THEN
    GRANT SELECT, INSERT, UPDATE ON drive_inventory_scans, drive_inventory_folders, drive_inventory_files TO kos_editor;
  END IF;
END $$;

COMMIT;
