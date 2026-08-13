-- Etapa 5: análises documentais assistidas pelo KOS, cotas e validação humana.

BEGIN;

DO $$ BEGIN
  CREATE TYPE kos_analysis_status AS ENUM (
    'processing',
    'pending_review',
    'approved',
    'corrected',
    'rejected',
    'failed',
    'quota_blocked'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE kos_review_decision AS ENUM ('approved', 'corrected', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS kos_role_quotas (
  role cms_user_role PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  daily_request_limit integer NOT NULL CHECK (daily_request_limit >= 0),
  monthly_token_limit bigint NOT NULL CHECK (monthly_token_limit >= 0),
  max_input_tokens_per_request integer NOT NULL CHECK (max_input_tokens_per_request >= 0),
  max_output_tokens_per_request integer NOT NULL CHECK (max_output_tokens_per_request >= 0),
  updated_by uuid REFERENCES cms_users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO kos_role_quotas (
  role, enabled, daily_request_limit, monthly_token_limit,
  max_input_tokens_per_request, max_output_tokens_per_request
) VALUES
  ('publico', false, 0, 0, 0, 0),
  ('membro_conselho', true, 2, 250000, 40000, 3000),
  ('gestao', true, 10, 1500000, 100000, 4000),
  ('diretoria_cms', true, 20, 3000000, 200000, 6000),
  ('master', true, 30, 5000000, 250000, 8000)
ON CONFLICT (role) DO NOTHING;

CREATE TABLE IF NOT EXISTS kos_ai_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  enabled boolean NOT NULL DEFAULT true,
  model text NOT NULL DEFAULT 'gpt-5.4-mini-2026-03-17',
  prompt_version text NOT NULL DEFAULT 'kos-document-v1',
  input_cost_per_million_usd numeric(12,6) NOT NULL DEFAULT 0.75 CHECK (input_cost_per_million_usd >= 0),
  output_cost_per_million_usd numeric(12,6) NOT NULL DEFAULT 4.50 CHECK (output_cost_per_million_usd >= 0),
  monthly_cost_limit_microusd bigint NOT NULL DEFAULT 20000000 CHECK (monthly_cost_limit_microusd >= 0),
  updated_by uuid REFERENCES cms_users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO kos_ai_settings (singleton) VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS kos_document_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id),
  protocol_id uuid REFERENCES received_protocols(id),
  requested_by_user_id uuid NOT NULL REFERENCES cms_users(id),
  model text NOT NULL,
  prompt_version text NOT NULL,
  status kos_analysis_status NOT NULL DEFAULT 'processing',
  document_sha256 char(64) NOT NULL,
  sanitized_input_sha256 char(64) NOT NULL,
  sanitized_character_count integer NOT NULL CHECK (sanitized_character_count >= 0),
  estimated_input_tokens integer NOT NULL CHECK (estimated_input_tokens >= 0),
  reserved_output_tokens integer NOT NULL CHECK (reserved_output_tokens >= 0),
  estimated_cost_microusd bigint NOT NULL CHECK (estimated_cost_microusd >= 0),
  actual_input_tokens integer CHECK (actual_input_tokens IS NULL OR actual_input_tokens >= 0),
  actual_output_tokens integer CHECK (actual_output_tokens IS NULL OR actual_output_tokens >= 0),
  actual_total_tokens integer CHECK (actual_total_tokens IS NULL OR actual_total_tokens >= 0),
  actual_cost_microusd bigint CHECK (actual_cost_microusd IS NULL OR actual_cost_microusd >= 0),
  openai_response_id text,
  result jsonb,
  error_code text,
  error_message text,
  review_decision kos_review_decision,
  review_notes text,
  reviewed_by_user_id uuid REFERENCES cms_users(id),
  reviewed_at timestamptz,
  source_ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (protocol_id IS NOT NULL),
  CHECK (review_decision IS NULL OR reviewed_by_user_id IS NOT NULL),
  CHECK (review_decision IS NULL OR reviewed_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS kos_analyses_protocol_idx
  ON kos_document_analyses(protocol_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kos_analyses_requester_month_idx
  ON kos_document_analyses(requested_by_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kos_analyses_status_idx
  ON kos_document_analyses(status, created_at DESC);
CREATE INDEX IF NOT EXISTS kos_analyses_monthly_cost_idx
  ON kos_document_analyses(created_at DESC, actual_cost_microusd, estimated_cost_microusd);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kos_reader') THEN
    GRANT SELECT ON kos_role_quotas, kos_ai_settings, kos_document_analyses TO kos_reader;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kos_editor') THEN
    GRANT SELECT, INSERT, UPDATE ON kos_role_quotas, kos_ai_settings, kos_document_analyses TO kos_editor;
  END IF;
END $$;

COMMIT;
