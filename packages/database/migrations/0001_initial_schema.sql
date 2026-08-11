-- KOS CMS — esquema institucional inicial
-- Requer PostgreSQL 16+ e a extensão pgcrypto.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE document_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE visibility_scope AS ENUM ('public', 'restricted', 'internal');
CREATE TYPE source_kind AS ENUM ('upload', 'google_drive', 'external_url', 'manual');
CREATE TYPE traceability_status AS ENUM ('identified', 'partial', 'not_identified', 'not_applicable');

CREATE TABLE document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type_id uuid REFERENCES document_types(id),
  title text NOT NULL,
  document_number text,
  reference_year integer CHECK (reference_year BETWEEN 1900 AND 2200),
  subject text,
  description text,
  issuing_body text,
  document_date date,
  effective_from date,
  effective_to date,
  status document_status NOT NULL DEFAULT 'draft',
  visibility visibility_scope NOT NULL DEFAULT 'public',
  source_type source_kind NOT NULL DEFAULT 'manual',
  source_url text,
  storage_path text,
  sha256 char(64),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sha256)
);

CREATE TABLE conferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id),
  title text NOT NULL,
  edition integer,
  starts_on date,
  ends_on date,
  municipality text NOT NULL DEFAULT 'Chapada dos Guimarães',
  state char(2) NOT NULL DEFAULT 'MT',
  status document_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (edition, municipality, state)
);

CREATE TABLE conference_axes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  ordinal smallint NOT NULL CHECK (ordinal > 0),
  title text NOT NULL,
  description text,
  UNIQUE (conference_id, axis_id, ordinal)
);

CREATE TABLE conference_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  axis_id uuid REFERENCES conference_axes(id) ON DELETE SET NULL,
  ordinal smallint NOT NULL CHECK (ordinal > 0),
  title text NOT NULL,
  proposal_text text NOT NULL,
  responsible_sphere text,
  deadline_text text,
  approval_notes text,
  source_page integer CHECK (source_page > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conference_id, ordinal)
);

CREATE TABLE health_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id),
  title text NOT NULL,
  starts_year integer NOT NULL CHECK (starts_year BETWEEN 1900 AND 2200),
  ends_year integer NOT NULL CHECK (ends_year >= starts_year AND ends_year <= starts_year + 10),
  status document_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (starts_year, ends_year)
);

CREATE TABLE annual_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_plan_id uuid REFERENCES health_plans(id) ON DELETE SET NULL,
  document_id uuid REFERENCES documents(id),
  title text NOT NULL,
  reference_year integer NOT NULL CHECK (reference_year BETWEEN 1900 AND 2200),
  status document_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reference_year)
);

CREATE TABLE traceability_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_proposal_id uuid NOT NULL REFERENCES conference_proposals(id) ON DELETE CASCADE,
  health_plan_id uuid REFERENCES health_plans(id) ON DELETE CASCADE,
  annual_program_id uuid REFERENCES annual_programs(id) ON DELETE CASCADE,
  status traceability_status NOT NULL,
  rationale text NOT NULL,
  source_reference text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (health_plan_id IS NOT NULL OR annual_program_id IS NOT NULL)
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX documents_reference_year_idx ON documents(reference_year);
CREATE INDEX conference_proposals_conference_idx ON conference_proposals(conference_id);
CREATE INDEX conference_proposals_axis_idx ON conference_proposals(axis_id);
CREATE INDEX traceability_links_proposal_idx ON traceability_links(conference_proposal_id);
CREATE INDEX audit_logs_entity_idx ON audit_logs(entity_type, entity_id);

COMMIT;
