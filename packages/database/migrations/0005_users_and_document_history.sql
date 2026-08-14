-- Gestão de usuários, aprovação institucional e histórico completo dos documentos.

BEGIN;

DO $$ BEGIN
  CREATE TYPE cms_user_role AS ENUM (
    'publico',
    'membro_conselho',
    'gestao',
    'diretoria_cms',
    'master'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cms_user_status AS ENUM ('pendente', 'ativo', 'suspenso', 'rejeitado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE password_request_status AS ENUM ('pendente', 'aprovado', 'rejeitado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS cms_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 3 AND 160),
  email text NOT NULL,
  password_hash text NOT NULL,
  role cms_user_role NOT NULL DEFAULT 'membro_conselho',
  status cms_user_status NOT NULL DEFAULT 'pendente',
  council_position text,
  council_segment text,
  is_cms_president boolean NOT NULL DEFAULT false,
  approved_by uuid REFERENCES cms_users(id),
  approved_at timestamptz,
  last_login_at timestamptz,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email = lower(email)),
  CHECK (NOT is_cms_president OR role IN ('diretoria_cms', 'master'))
);

CREATE UNIQUE INDEX IF NOT EXISTS cms_users_email_unique_idx ON cms_users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS cms_users_single_president_idx ON cms_users (is_cms_president)
  WHERE is_cms_president = true AND status = 'ativo';
CREATE INDEX IF NOT EXISTS cms_users_status_idx ON cms_users(status, created_at);

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES cms_users(id) ON DELETE CASCADE,
  requested_password_hash text NOT NULL,
  status password_request_status NOT NULL DEFAULT 'pendente',
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES cms_users(id),
  reviewed_at timestamptz,
  request_ip inet,
  user_agent text
);

CREATE INDEX IF NOT EXISTS password_reset_requests_pending_idx
  ON password_reset_requests(status, requested_at);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES cms_users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by_user_id uuid REFERENCES cms_users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_filename text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size_bytes bigint CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0);

CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  storage_path text NOT NULL,
  original_filename text,
  mime_type text,
  file_size_bytes bigint CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  sha256 char(64) NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('upload_inicial', 'substituicao', 'gerado', 'importado')),
  change_notes text,
  created_by_user_id uuid REFERENCES cms_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, version_number),
  UNIQUE (document_id, sha256)
);

CREATE INDEX IF NOT EXISTS document_versions_document_idx
  ON document_versions(document_id, version_number DESC);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_user_id uuid REFERENCES cms_users(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_name text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_email text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_role cms_user_role;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS source_ip inet;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent text;

INSERT INTO document_versions (
  document_id, version_number, storage_path, original_filename, mime_type,
  file_size_bytes, sha256, change_type, change_notes, created_by_user_id, created_at
)
SELECT id, 1, storage_path, original_filename, COALESCE(mime_type, 'application/pdf'),
       file_size_bytes, sha256, 'importado', 'Versão existente incorporada ao histórico na implantação.',
       uploaded_by_user_id, created_at
FROM documents
WHERE storage_path IS NOT NULL AND sha256 IS NOT NULL
ON CONFLICT DO NOTHING;

-- Mantém o princípio do menor privilégio usado no restante do CMS.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kos_reader') THEN
    GRANT SELECT ON cms_users, password_reset_requests, document_versions TO kos_reader;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kos_editor') THEN
    GRANT SELECT, INSERT, UPDATE ON cms_users, password_reset_requests, document_versions TO kos_editor;
  END IF;
END $$;

COMMIT;
