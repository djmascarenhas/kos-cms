-- Etapa 4: caixa de entrada, protocolo e tramitação de documentos recebidos.

BEGIN;

DO $$ BEGIN
  CREATE TYPE received_protocol_status AS ENUM (
    'protocolado',
    'triagem',
    'analise_kos',
    'validacao_humana',
    'encaminhado',
    'respondido_deliberado',
    'arquivado'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE protocol_priority AS ENUM ('baixa', 'normal', 'alta', 'urgente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE protocol_origin_channel AS ENUM ('presencial', 'email', 'correios', 'sistema', 'outro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE protocol_link_relation AS ENUM ('resposta', 'parecer', 'oficio', 'deliberacao', 'outro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS received_protocol_counters (
  protocol_year integer PRIMARY KEY CHECK (protocol_year BETWEEN 1900 AND 2200),
  last_number integer NOT NULL DEFAULT 0 CHECK (last_number >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS received_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL UNIQUE REFERENCES documents(id),
  protocol_number text NOT NULL UNIQUE,
  protocol_year integer NOT NULL CHECK (protocol_year BETWEEN 1900 AND 2200),
  protocol_sequence integer NOT NULL CHECK (protocol_sequence > 0),
  receipt_code char(24) NOT NULL UNIQUE,
  received_at date NOT NULL,
  sender_name text NOT NULL CHECK (char_length(sender_name) BETWEEN 2 AND 200),
  sender_organization text,
  sender_email text,
  sender_phone text,
  origin_channel protocol_origin_channel NOT NULL,
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 3 AND 500),
  summary text,
  priority protocol_priority NOT NULL DEFAULT 'normal',
  response_due_date date,
  status received_protocol_status NOT NULL DEFAULT 'protocolado',
  visibility visibility_scope NOT NULL DEFAULT 'internal',
  assigned_area text,
  responsible_user_id uuid REFERENCES cms_users(id),
  created_by_user_id uuid NOT NULL REFERENCES cms_users(id),
  triaged_by_user_id uuid REFERENCES cms_users(id),
  triaged_at timestamptz,
  closed_by_user_id uuid REFERENCES cms_users(id),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (protocol_year, protocol_sequence),
  CHECK (sender_email IS NULL OR sender_email = lower(sender_email))
);

CREATE TABLE IF NOT EXISTS received_protocol_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES received_protocols(id) ON DELETE CASCADE,
  previous_status received_protocol_status,
  new_status received_protocol_status NOT NULL,
  notes text,
  assigned_area text,
  responsible_user_id uuid REFERENCES cms_users(id),
  created_by_user_id uuid NOT NULL REFERENCES cms_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS received_protocol_document_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES received_protocols(id) ON DELETE CASCADE,
  linked_document_id uuid NOT NULL REFERENCES documents(id),
  relation protocol_link_relation NOT NULL,
  notes text,
  created_by_user_id uuid NOT NULL REFERENCES cms_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (protocol_id, linked_document_id, relation)
);

CREATE INDEX IF NOT EXISTS received_protocols_status_due_idx
  ON received_protocols(status, response_due_date);
CREATE INDEX IF NOT EXISTS received_protocols_creator_idx
  ON received_protocols(created_by_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS received_protocols_responsible_idx
  ON received_protocols(responsible_user_id, status);
CREATE INDEX IF NOT EXISTS received_protocol_events_protocol_idx
  ON received_protocol_events(protocol_id, created_at DESC);
CREATE INDEX IF NOT EXISTS received_protocol_links_protocol_idx
  ON received_protocol_document_links(protocol_id, created_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kos_reader') THEN
    GRANT SELECT ON received_protocol_counters, received_protocols,
      received_protocol_events, received_protocol_document_links TO kos_reader;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kos_editor') THEN
    GRANT SELECT, INSERT, UPDATE ON received_protocol_counters, received_protocols,
      received_protocol_events, received_protocol_document_links TO kos_editor;
  END IF;
END $$;

COMMIT;
