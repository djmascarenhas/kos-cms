-- Acompanhamento público das propostas aprovadas na Conferência.

BEGIN;

DO $$ BEGIN
  CREATE TYPE proposal_monitoring_status AS ENUM (
    'awaiting_information',
    'under_analysis',
    'in_progress',
    'completed',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS proposal_monitoring (
  proposal_id uuid PRIMARY KEY REFERENCES conference_proposals(id) ON DELETE CASCADE,
  status proposal_monitoring_status NOT NULL DEFAULT 'awaiting_information',
  responsible_name text,
  expected_completion date,
  progress_percent smallint NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  public_notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

INSERT INTO proposal_monitoring (proposal_id)
SELECT id FROM conference_proposals
ON CONFLICT (proposal_id) DO NOTHING;

COMMIT;
