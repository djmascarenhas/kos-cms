-- 9ª Conferência Municipal de Saúde de Chapada dos Guimarães - MT
-- Fonte: Relatório Final revisado e assinado, páginas 15 a 19 do PDF.

BEGIN;

INSERT INTO documents (
  document_type_id, title, reference_year, issuing_body, document_date,
  status, visibility, source_type, description
)
SELECT
  document_types.id,
  'Relatório Final da 9ª Conferência Municipal de Saúde',
  2026,
  'Conselho Municipal de Saúde e Secretaria Municipal de Saúde de Chapada dos Guimarães - MT',
  DATE '2026-06-19',
  'published',
  'public',
  'manual',
  'Relatório final revisado e assinado; propostas aprovadas nas páginas 15 a 19.'
FROM document_types
WHERE document_types.name = 'Relatório de Conferência'
  AND NOT EXISTS (
    SELECT 1 FROM documents
    WHERE title = 'Relatório Final da 9ª Conferência Municipal de Saúde'
      AND reference_year = 2026
  );

INSERT INTO conferences (
  document_id, title, edition, starts_on, ends_on, municipality, state, status
)
VALUES (
  (SELECT id FROM documents WHERE title = 'Relatório Final da 9ª Conferência Municipal de Saúde' AND reference_year = 2026 LIMIT 1),
  '9ª Conferência Municipal de Saúde',
  9,
  DATE '2026-06-19',
  DATE '2026-06-19',
  'Chapada dos Guimarães',
  'MT',
  'published'
)
ON CONFLICT (edition, municipality, state) DO UPDATE SET
  document_id = EXCLUDED.document_id,
  status = EXCLUDED.status,
  updated_at = now();

INSERT INTO conference_axes (conference_id, ordinal, title, description)
SELECT c.id, v.ordinal, v.title, v.description
FROM conferences c
CROSS JOIN (VALUES
  (1::smallint, 'Democracia, saúde como direito e soberania nacional', 'Fortalecer a Atenção Primária à Saúde e a participação social, garantindo o acesso universal, equitativo e de qualidade aos serviços de saúde, por meio da ampliação da infraestrutura, da valorização dos trabalhadores e do fortalecimento do controle social.'),
  (2::smallint, 'Financiamento adequado e suficiente para o SUS', 'Assegurar financiamento adequado e gestão eficiente dos recursos públicos, ampliando a oferta dos serviços de saúde, promovendo transparência na aplicação dos recursos e fortalecendo o acesso da população às ações e serviços do SUS.'),
  (3::smallint, 'Emergências climáticas e justiça socioambiental', 'Desenvolver políticas públicas integradas voltadas à promoção da saúde ambiental, prevenção de agravos, fortalecimento da vigilância em saúde e enfrentamento das emergências climáticas, garantindo qualidade de vida e sustentabilidade para toda a população.'),
  (4::smallint, 'Modelo de atenção e gestão, territórios integrados e cuidado integral', 'Fortalecer a Rede de Atenção à Saúde por meio da integração entre os níveis de assistência, qualificação dos profissionais, ampliação dos serviços especializados e promoção do cuidado integral, humanizado e centrado nas necessidades da população.')
) AS v(ordinal, title, description)
WHERE c.edition = 9 AND c.municipality = 'Chapada dos Guimarães' AND c.state = 'MT'
ON CONFLICT (conference_id, ordinal) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

WITH conference AS (
  SELECT id FROM conferences WHERE edition = 9 AND municipality = 'Chapada dos Guimarães' AND state = 'MT'
), proposals(axis_ordinal, ordinal, title, proposal_text, responsible_sphere, deadline_text, approval_notes, source_page) AS (
  VALUES
    (1::smallint, 1::smallint, 'Concurso para ACS e ACE', 'Ampliar a cobertura da Estratégia Saúde da Família mediante realização de concurso público para Agentes Comunitários de Saúde (ACS) e Agentes de Combate às Endemias (ACE), garantindo cobertura das áreas descobertas e fortalecimento das ações de promoção e prevenção à saúde.', 'Município', '6 meses', 'Aprovada com 75 votos.', 15),
    (1::smallint, 2::smallint, 'Centro de Especialidades Odontológicas', 'Implantar e estruturar um Centro de Especialidades Odontológicas (CEO) no município, oferecendo serviços especializados e ampliando o acesso da população à saúde bucal.', 'Município', '12 meses', 'Aprovada com 65 votos.', 15),
    (1::smallint, 3::smallint, 'Pontos de Atendimento à Saúde', 'Implantar Pontos de Atendimento à Saúde nos bairros Pôr do Sol e Altos da Chapada, vinculados à Atenção Primária à Saúde.', 'Município', NULL, 'Aprovada com 53 votos.', 15),
    (1::smallint, 4::smallint, 'Novo prédio para a UBS Olho D’Água', 'Construir novo prédio para a UBS Olho D’Água, promovendo a reorganização dos serviços e melhor distribuição dos recursos assistenciais.', 'Município', '12 meses', 'Aprovada com 77 votos.', 16),
    (1::smallint, 5::smallint, 'Reuniões comunitárias periódicas', 'Realizar reuniões comunitárias periódicas em bairros e comunidades rurais, fortalecendo o controle social e a participação popular nas decisões em saúde.', 'Município', '12 meses', 'Aprovada com 76 votos.', 16),
    (2::smallint, 1::smallint, 'Transporte coletivo municipal', 'Implantar transporte coletivo municipal para facilitar o acesso da população aos serviços públicos, especialmente aos serviços de saúde.', 'Município', '6 meses', 'Aprovada com 69 votos.', 16),
    (2::smallint, 2::smallint, 'Estrutura laboratorial 24 horas', 'Ampliar a estrutura laboratorial do município para garantir atendimento contínuo, inclusive em situações de urgência e emergência, durante 24 horas.', 'Município', NULL, 'Aprovada com 53 votos.', 17),
    (2::smallint, 3::smallint, 'Dispensação de medicamentos 24 horas', 'Implantar o serviço de dispensação de medicamentos em regime de plantão 24 horas, vinculado à UPA.', 'Município', NULL, 'Aprovada com 61 votos.', 17),
    (2::smallint, 4::smallint, 'Credenciamento da UBS Aldeia Velha', 'Viabilizar o credenciamento da Unidade Básica de Saúde Aldeia Velha junto ao Ministério da Saúde, garantindo financiamento federal para ampliação da oferta de serviços.', 'Município', NULL, 'Aprovada com 62 votos.', 17),
    (2::smallint, 5::smallint, 'Transparência de serviços e exames', 'Ampliar a transparência e a divulgação das informações sobre serviços especializados e exames ofertados pelo SUS.', 'Município', NULL, 'Aprovada com 77 votos.', 17),
    (3::smallint, 1::smallint, 'Legislação para notificações de ACE', 'Criar legislação municipal para respaldar as notificações realizadas pelos Agentes de Combate às Endemias junto aos órgãos de fiscalização e planejamento.', 'Município', '30 dias', 'Aprovada com 74 votos.', 18),
    (3::smallint, 2::smallint, 'Centro de Zoonoses', 'Implantar o Centro de Zoonoses, contemplando conscientização, cadastro, castração, controle de zoonoses e manejo de animais soltos.', 'Estado', NULL, 'Aprovada com 69 votos.', 18),
    (3::smallint, 3::smallint, 'Estação de Tratamento de Água e saneamento', 'Implantar uma Estação de Tratamento de Água (ETA) e ampliar o saneamento básico nas zonas urbana e rural.', 'Município', '120 dias', 'Aprovada com 67 votos.', 18),
    (3::smallint, 4::smallint, 'Resíduos sólidos e coleta seletiva', 'Aprimorar a coleta e destinação correta dos resíduos sólidos, com fortalecimento da educação ambiental e coleta seletiva.', 'Município', '6 meses', 'Aprovada com 65 votos.', 18),
    (3::smallint, 5::smallint, 'Programa Saúde na Escola', 'Ampliar o Programa Saúde na Escola (PSE), incluindo capacitações anuais em educação ambiental para profissionais da saúde e educação.', 'União', NULL, 'Aprovada com 61 votos.', 18),
    (4::smallint, 1::smallint, 'CAPS para saúde do trabalhador público', 'Fortalecer as ações voltadas à saúde do trabalhador público com a implantação de CAPS no município.', 'Município', '90 dias', 'Aprovada com 64 votos.', 19),
    (4::smallint, 2::smallint, 'Instituição de Longa Permanência para Idosos', 'Criar e estruturar uma Instituição de Longa Permanência para Idosos (ILPI), garantindo acolhimento e cuidado integral às pessoas idosas em situação de vulnerabilidade.', 'Município', NULL, 'Aprovada com 49 votos.', 19),
    (4::smallint, 3::smallint, 'Educação Permanente em Saúde', 'Fortalecer o Programa de Educação Permanente para os profissionais da saúde, com foco no acolhimento dos usuários.', 'Estado', NULL, 'Aprovada com 56 votos.', 19),
    (4::smallint, 4::smallint, 'Atendimento interdisciplinar na rede', 'Fortalecer o atendimento interdisciplinar entre Atenção Básica, Academia da Saúde e serviços de média e alta complexidade.', 'Município', NULL, 'Aprovada com 55 votos.', 19),
    (4::smallint, 5::smallint, 'Programa Melhor em Casa', 'Implantar o Programa Melhor em Casa, ampliando a atenção domiciliar multiprofissional aos usuários que necessitam de cuidados contínuos e contribuindo para a redução das internações hospitalares.', 'Município', NULL, 'Aprovada com 55 votos.', 19)
)
INSERT INTO conference_proposals (
  conference_id, axis_id, ordinal, title, proposal_text, responsible_sphere,
  deadline_text, approval_notes, source_page
)
SELECT
  conference.id,
  axes.id,
  proposals.ordinal,
  proposals.title,
  proposals.proposal_text,
  proposals.responsible_sphere,
  proposals.deadline_text,
  proposals.approval_notes,
  proposals.source_page
FROM proposals
CROSS JOIN conference
JOIN conference_axes axes ON axes.conference_id = conference.id AND axes.ordinal = proposals.axis_ordinal
ON CONFLICT (conference_id, ordinal) DO UPDATE SET
  axis_id = EXCLUDED.axis_id,
  title = EXCLUDED.title,
  proposal_text = EXCLUDED.proposal_text,
  responsible_sphere = EXCLUDED.responsible_sphere,
  deadline_text = EXCLUDED.deadline_text,
  approval_notes = EXCLUDED.approval_notes,
  source_page = EXCLUDED.source_page,
  updated_at = now();

COMMIT;
