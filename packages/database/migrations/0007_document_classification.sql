-- Classificação documental proposta e aprovação humana pela Diretoria.

BEGIN;

INSERT INTO document_types (name, description) VALUES
  ('Identidade Visual', 'Logomarcas, brasões e elementos oficiais de identidade visual.'),
  ('Modelo Oficial', 'Modelo em branco para produção de documento oficial.'),
  ('Convocação ou Pauta', 'Convocações e pautas de reuniões ordinárias e extraordinárias.'),
  ('Ofício Expedido', 'Ofício produzido e expedido pelo CMS.'),
  ('Parecer Técnico ou Jurídico', 'Parecer emitido por comissão, relatoria ou assessoria jurídica.'),
  ('Legislação, Norma ou Referência Técnica', 'Lei, norma, regimento, orientação ou referência técnica institucional.'),
  ('Documento Recebido', 'Documento protocolado no CMS e originado por terceiro.'),
  ('Documento de Conferência', 'Documento preparatório, operacional ou final de Conferência de Saúde.'),
  ('Governança e Cadastro Institucional', 'Composição, cadastro e instrumentos internos de governança do CMS.'),
  ('Instrumento de Planejamento e Gestão', 'PMS, PAS, relatórios e propostas de planejamento e investimento no SUS.')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS document_classification_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES drive_inventory_scans(id),
  policy_drive_file_id text NOT NULL,
  policy_title text NOT NULL,
  policy_edition_year integer CHECK (policy_edition_year BETWEEN 1900 AND 2200),
  status text NOT NULL DEFAULT 'pending_directorate'
    CHECK (status IN ('pending_directorate', 'approved', 'revision_requested', 'rejected')),
  document_count integer NOT NULL CHECK (document_count >= 0),
  misplaced_count integer NOT NULL CHECK (misplaced_count >= 0),
  restricted_count integer NOT NULL CHECK (restricted_count >= 0),
  requires_policy_amendment_count integer NOT NULL CHECK (requires_policy_amendment_count >= 0),
  duplicate_file_count integer NOT NULL CHECK (duplicate_file_count >= 0),
  movement_authorized boolean NOT NULL DEFAULT false,
  notes text,
  prepared_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES cms_users(id),
  approved_at timestamptz,
  decision_notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_classification_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES document_classification_batches(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  drive_file_id text NOT NULL,
  current_path text NOT NULL,
  original_filename text NOT NULL,
  classification_type text NOT NULL,
  folder_code text NOT NULL,
  recommended_folder text NOT NULL,
  recommended_path text NOT NULL,
  proposed_filename text NOT NULL,
  subject text NOT NULL,
  origin text NOT NULL,
  recommended_visibility visibility_scope NOT NULL,
  classification_rationale text NOT NULL,
  retention_rule text NOT NULL,
  final_destination text NOT NULL,
  requires_policy_amendment boolean NOT NULL DEFAULT false,
  duplicate_group text,
  duplicate_disposition text NOT NULL
    CHECK (duplicate_disposition IN ('not_applicable', 'official_exemplar', 'secondary_copy')),
  status text NOT NULL DEFAULT 'pending_directorate'
    CHECK (status IN ('pending_directorate', 'approved', 'revision_requested', 'rejected')),
  movement_status text NOT NULL DEFAULT 'not_authorized'
    CHECK (movement_status IN ('not_authorized', 'authorized', 'moved', 'kept_in_place')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, document_id),
  UNIQUE (batch_id, drive_file_id)
);

CREATE INDEX IF NOT EXISTS document_classification_batch_status_idx
  ON document_classification_batches(status, prepared_at DESC);
CREATE INDEX IF NOT EXISTS document_classification_proposal_folder_idx
  ON document_classification_proposals(batch_id, folder_code, current_path);
CREATE INDEX IF NOT EXISTS document_classification_proposal_review_idx
  ON document_classification_proposals(batch_id, status, requires_policy_amendment);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kos_reader') THEN
    GRANT SELECT ON document_classification_batches, document_classification_proposals TO kos_reader;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kos_editor') THEN
    GRANT SELECT, INSERT, UPDATE ON document_classification_batches, document_classification_proposals TO kos_editor;
  END IF;
END $$;

COMMIT;
