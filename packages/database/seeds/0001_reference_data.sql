-- Dados de referência seguros para o primeiro carregamento.
-- Propostas e vínculos só devem ser inseridos após conferência do documento-fonte oficial.

BEGIN;

INSERT INTO document_types (name, description) VALUES
  ('Relatório de Conferência', 'Documento final com as deliberações de uma Conferência Municipal de Saúde.'),
  ('Plano Municipal de Saúde', 'Instrumento plurianual de planejamento em saúde.'),
  ('Programação Anual de Saúde', 'Instrumento anual de operacionalização do Plano Municipal de Saúde.'),
  ('Resolução', 'Ato deliberativo do Conselho Municipal de Saúde.'),
  ('Ata de Reunião', 'Registro de reunião, pauta e deliberações.')
ON CONFLICT (name) DO NOTHING;

COMMIT;
