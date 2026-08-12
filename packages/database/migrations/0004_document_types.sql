BEGIN;

INSERT INTO document_types (name, description) VALUES
  ('Relatório de Gestão', 'Relatórios de gestão, prestação de contas e acompanhamento do SUS.'),
  ('Legislação', 'Leis, decretos, portarias e outras normas relacionadas à saúde.'),
  ('Outro documento', 'Documento institucional que não se enquadra nos demais tipos.')
ON CONFLICT (name) DO NOTHING;

COMMIT;
