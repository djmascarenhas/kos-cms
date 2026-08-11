-- A numeração das propostas reinicia em cada eixo temático.

BEGIN;

ALTER TABLE conference_proposals
  DROP CONSTRAINT conference_proposals_conference_id_ordinal_key;

ALTER TABLE conference_proposals
  ADD CONSTRAINT conference_proposals_conference_axis_ordinal_key
  UNIQUE (conference_id, axis_id, ordinal);

COMMIT;
