-- PMS 2026-2029, PAS 2026 e primeira análise de rastreabilidade.
-- A classificação "partial" ou "not_identified" não implica inviabilidade: indica apenas
-- que não foi localizada previsão específica suficiente no documento analisado.

BEGIN;

INSERT INTO documents (
  document_type_id, title, reference_year, issuing_body, document_date, status,
  visibility, source_type, storage_path, sha256, description
)
SELECT document_types.id, v.title, v.reference_year,
  'Secretaria Municipal de Saúde de Chapada dos Guimarães - MT',
  v.document_date, 'published', 'public', 'upload', v.storage_path, v.sha256, v.description
FROM document_types
CROSS JOIN (VALUES
  ('Plano Municipal de Saúde 2026-2029', 2026, DATE '2026-03-07', '/opt/kos-cms/documents/pms-2026-2029.pdf', '4205f1747e915cdf4ddaafcdf7a5a2cef4e11e988cca973ce70412e84986a20', 'PMS 2026-2029, documento-fonte para a análise plurianual.'),
  ('Programação Anual de Saúde 2026', 2026, NULL::date, '/opt/kos-cms/documents/pas-2026.pdf', 'ec0f32ec4e764a34c6b424b51af8af2fb48dda78d1595f4d97ac7f3634f371c5', 'PAS 2026, documento-fonte para a análise anual.')
) AS v(title, reference_year, document_date, storage_path, sha256, description)
WHERE document_types.name = CASE WHEN v.title LIKE 'Plano%' THEN 'Plano Municipal de Saúde' ELSE 'Programação Anual de Saúde' END
ON CONFLICT (sha256) DO UPDATE SET
  storage_path = EXCLUDED.storage_path,
  status = EXCLUDED.status,
  updated_at = now();

INSERT INTO health_plans (document_id, title, starts_year, ends_year, status)
VALUES (
  (SELECT id FROM documents WHERE sha256 = '4205f1747e915cdf4ddaafcdf7a5a2cef4e11e988cca973ce70412e84986a20'),
  'Plano Municipal de Saúde 2026-2029', 2026, 2029, 'published'
)
ON CONFLICT (starts_year, ends_year) DO UPDATE SET document_id = EXCLUDED.document_id, status = EXCLUDED.status, updated_at = now();

INSERT INTO annual_programs (health_plan_id, document_id, title, reference_year, status)
VALUES (
  (SELECT id FROM health_plans WHERE starts_year = 2026 AND ends_year = 2029),
  (SELECT id FROM documents WHERE sha256 = 'ec0f32ec4e764a34c6b424b51af8af2fb48dda78d1595f4d97ac7f3634f371c5'),
  'Programação Anual de Saúde 2026', 2026, 'published'
)
ON CONFLICT (reference_year) DO UPDATE SET health_plan_id = EXCLUDED.health_plan_id, document_id = EXCLUDED.document_id, status = EXCLUDED.status, updated_at = now();

DELETE FROM traceability_links
WHERE health_plan_id = (SELECT id FROM health_plans WHERE starts_year = 2026 AND ends_year = 2029)
   OR annual_program_id = (SELECT id FROM annual_programs WHERE reference_year = 2026);

WITH refs AS (
  SELECT
    (SELECT id FROM health_plans WHERE starts_year = 2026 AND ends_year = 2029) AS plan_id,
    (SELECT id FROM annual_programs WHERE reference_year = 2026) AS program_id
), analysis(axis_ordinal, proposal_ordinal, plan_status, plan_rationale, plan_reference, program_status, program_rationale, program_reference) AS (
  VALUES
    (1::smallint, 1::smallint, 'partial'::traceability_status, 'O PMS prevê concurso público conforme necessidades levantadas, mas não individualiza ACS e ACE nem o prazo de 6 meses.', 'PMS p. 95, meta 6.1.', 'partial'::traceability_status, 'A PAS prevê ampliação de equipes de Saúde da Família e territorialização; não registra concurso específico para ACS e ACE.', 'PAS p. 6, objetivo 1.'),
    (1, 2, 'partial', 'O PMS possui objetivo de expandir e qualificar Saúde Bucal na APS, sem prever a implantação de CEO.', 'PMS pp. 81-83, objetivo 1.3.', 'partial', 'A PAS prevê qualificação dos serviços de Saúde Bucal, sem ação específica para CEO.', 'PAS p. 8, objetivo 1.3.'),
    (1, 3, 'partial', 'O PMS prevê horário estendido em duas UBS, mas não Pontos de Atendimento nos bairros Pôr do Sol e Altos da Chapada.', 'PMS p. 79, meta 1.8.', 'not_identified', 'Não foi localizada ação anual que identifique os dois pontos de atendimento.', 'PAS pp. 6-9.'),
    (1, 4, 'partial', 'O PMS prevê reforma e/ou ampliação de unidades, porém não cita a UBS Olho D’Água.', 'PMS p. 78, meta 1.5.', 'not_identified', 'Não foi localizada ação anual específica para a UBS Olho D’Água.', 'PAS pp. 6-9.'),
    (1, 5, 'partial', 'O PMS prevê fortalecimento da participação social e realização de conferências, sem agenda de reuniões comunitárias periódicas.', 'PMS p. 96, diretriz 7.', 'partial', 'A PAS reforça diálogo contínuo e controle social, sem cronograma de reuniões em bairros e comunidades rurais.', 'PAS p. 14, diretriz 7.'),
    (2, 1, 'not_identified', 'O PMS descreve transporte sanitário/TFD, mas não prevê transporte coletivo municipal.', 'PMS p. 38.', 'not_identified', 'Não foi localizada ação anual de transporte coletivo municipal.', 'PAS pp. 13-16.'),
    (2, 2, 'partial', 'O PMS descreve oferta laboratorial e apoio diagnóstico; não prevê atendimento laboratorial contínuo 24 horas.', 'PMS pp. 28-29.', 'partial', 'A PAS prevê manutenção e ampliação diagnóstica, sem laboratório 24 horas.', 'PAS p. 13, diretriz 5.'),
    (2, 3, 'partial', 'O PMS prevê qualificação da assistência farmacêutica, sem dispensação em plantão 24 horas vinculada à UPA.', 'PMS pp. 92-93, diretriz 4.', 'partial', 'A PAS prevê acesso e uso racional de medicamentos, sem plantão farmacêutico 24 horas.', 'PAS pp. 12-13, diretriz 4.'),
    (2, 4, 'not_identified', 'A UBS Aldeia Velha é citada na caracterização territorial, mas não foi localizada meta de credenciamento federal.', 'PMS p. 10.', 'not_identified', 'Não foi localizada ação anual de credenciamento da UBS Aldeia Velha.', 'PAS pp. 6-14.'),
    (2, 5, 'partial', 'O PMS prevê transparência e informatização, mas não individualiza a divulgação de serviços especializados e exames.', 'PMS pp. 62-63 e 95.', 'partial', 'A PAS prevê gestão transparente, sem detalhar a divulgação solicitada.', 'PAS p. 14, diretriz 6.'),
    (3, 1, 'partial', 'O PMS prevê vigilância e controle vetorial; não foi localizada legislação municipal específica para notificações de ACE.', 'PMS pp. 51-58 e 91-92.', 'partial', 'A PAS prevê qualificação de registros e fiscalização, sem ação legislativa específica.', 'PAS pp. 11-12.'),
    (3, 2, 'partial', 'O PMS reconhece a necessidade de plano de contingência para zoonoses, sem implantação de Centro de Zoonoses.', 'PMS p. 52.', 'partial', 'A PAS prevê vigilância ambiental e sanitária, sem Centro de Zoonoses.', 'PAS p. 12, objetivo 3.2.'),
    (3, 3, 'not_identified', 'O PMS prevê monitoramento da qualidade da água, não a implantação de ETA e expansão de saneamento.', 'PMS pp. 59 e 92.', 'partial', 'A PAS prevê análises e inspeções de água, sem ETA ou expansão de saneamento.', 'PAS p. 12, meta 3.2.1.'),
    (3, 4, 'not_identified', 'Não foi localizada meta específica sobre coleta seletiva ou destinação de resíduos sólidos.', 'PMS pp. 51-59.', 'not_identified', 'Não foi localizada ação anual específica de coleta seletiva ou resíduos sólidos.', 'PAS pp. 10-12.'),
    (3, 5, 'partial', 'O PMS prevê adesão ao Programa Saúde na Escola, sem explicitar capacitação anual em educação ambiental.', 'PMS p. 78, meta 1.4.', 'partial', 'A PAS contempla ações integradas de promoção e prevenção, mas não detalha a capacitação ambiental anual solicitada.', 'PAS pp. 6-12.'),
    (4, 1, 'partial', 'O PMS prevê implantação de atenção especializada em saúde mental (AMENT), não CAPS.', 'PMS p. 94, meta 5.6.', 'partial', 'A PAS prevê reorganização da média e alta complexidade, sem implantação de CAPS.', 'PAS p. 13, diretriz 5.'),
    (4, 2, 'partial', 'O PMS prevê acompanhamento longitudinal de pessoas idosas, sem criar ou estruturar ILPI.', 'PMS p. 81, meta 1.2.7.', 'not_identified', 'Não foi localizada ação anual de ILPI.', 'PAS pp. 6-14.'),
    (4, 3, 'partial', 'O PMS reconhece a necessidade de fortalecer o núcleo e o plano municipal de educação permanente, sem meta específica de acolhimento.', 'PMS pp. 60-61.', 'partial', 'A PAS prevê capacitações e qualificação das equipes, sem programa específico com foco no acolhimento.', 'PAS pp. 7-12.'),
    (4, 4, 'partial', 'O PMS prevê atuação multiprofissional territorializada pela eMulti, mas não individualiza toda a articulação indicada.', 'PMS p. 83, objetivo 1.4.', 'partial', 'A PAS prevê eMulti e fluxos de encaminhamento, sem explicitar Academia da Saúde e todos os níveis citados.', 'PAS p. 9, objetivo 1.4.'),
    (4, 5, 'identified', 'O PMS traz meta explícita de implantação do Programa Melhor em Casa no município.', 'PMS p. 94, meta 5.7.', 'identified', 'A PAS anualiza a diretriz de média e alta complexidade que inclui a implantação do Melhor em Casa.', 'PAS p. 13, diretriz 5.')
)
INSERT INTO traceability_links (conference_proposal_id, health_plan_id, status, rationale, source_reference)
SELECT proposal.id, refs.plan_id, analysis.plan_status, analysis.plan_rationale, analysis.plan_reference
FROM analysis
CROSS JOIN refs
JOIN conferences conference ON conference.edition = 9 AND conference.municipality = 'Chapada dos Guimarães' AND conference.state = 'MT'
JOIN conference_axes axis ON axis.conference_id = conference.id AND axis.ordinal = analysis.axis_ordinal
JOIN conference_proposals proposal ON proposal.conference_id = conference.id AND proposal.axis_id = axis.id AND proposal.ordinal = analysis.proposal_ordinal;

WITH refs AS (
  SELECT (SELECT id FROM annual_programs WHERE reference_year = 2026) AS program_id
), analysis(axis_ordinal, proposal_ordinal, status, rationale, source_reference) AS (
  VALUES
    (1::smallint,1::smallint,'partial'::traceability_status,'A PAS prevê ampliação de equipes de Saúde da Família e territorialização; não registra concurso específico para ACS e ACE.','PAS p. 6, objetivo 1.'),
    (1,2,'partial','A PAS prevê qualificação dos serviços de Saúde Bucal, sem ação específica para CEO.','PAS p. 8, objetivo 1.3.'),
    (1,3,'not_identified','Não foi localizada ação anual que identifique os dois pontos de atendimento.','PAS pp. 6-9.'),
    (1,4,'not_identified','Não foi localizada ação anual específica para a UBS Olho D’Água.','PAS pp. 6-9.'),
    (1,5,'partial','A PAS reforça diálogo contínuo e controle social, sem cronograma de reuniões em bairros e comunidades rurais.','PAS p. 14, diretriz 7.'),
    (2,1,'not_identified','Não foi localizada ação anual de transporte coletivo municipal.','PAS pp. 13-16.'),
    (2,2,'partial','A PAS prevê manutenção e ampliação diagnóstica, sem laboratório 24 horas.','PAS p. 13, diretriz 5.'),
    (2,3,'partial','A PAS prevê acesso e uso racional de medicamentos, sem plantão farmacêutico 24 horas.','PAS pp. 12-13, diretriz 4.'),
    (2,4,'not_identified','Não foi localizada ação anual de credenciamento da UBS Aldeia Velha.','PAS pp. 6-14.'),
    (2,5,'partial','A PAS prevê gestão transparente, sem detalhar a divulgação solicitada.','PAS p. 14, diretriz 6.'),
    (3,1,'partial','A PAS prevê qualificação de registros e fiscalização, sem ação legislativa específica.','PAS pp. 11-12.'),
    (3,2,'partial','A PAS prevê vigilância ambiental e sanitária, sem Centro de Zoonoses.','PAS p. 12, objetivo 3.2.'),
    (3,3,'partial','A PAS prevê análises e inspeções de água, sem ETA ou expansão de saneamento.','PAS p. 12, meta 3.2.1.'),
    (3,4,'not_identified','Não foi localizada ação anual específica de coleta seletiva ou resíduos sólidos.','PAS pp. 10-12.'),
    (3,5,'partial','A PAS contempla ações integradas de promoção e prevenção, mas não detalha a capacitação ambiental anual solicitada.','PAS pp. 6-12.'),
    (4,1,'partial','A PAS prevê reorganização da média e alta complexidade, sem implantação de CAPS.','PAS p. 13, diretriz 5.'),
    (4,2,'not_identified','Não foi localizada ação anual de ILPI.','PAS pp. 6-14.'),
    (4,3,'partial','A PAS prevê capacitações e qualificação das equipes, sem programa específico com foco no acolhimento.','PAS pp. 7-12.'),
    (4,4,'partial','A PAS prevê eMulti e fluxos de encaminhamento, sem explicitar Academia da Saúde e todos os níveis citados.','PAS p. 9, objetivo 1.4.'),
    (4,5,'identified','A PAS anualiza a diretriz de média e alta complexidade que inclui a implantação do Melhor em Casa.','PAS p. 13, diretriz 5.')
)
INSERT INTO traceability_links (conference_proposal_id, annual_program_id, status, rationale, source_reference)
SELECT proposal.id, refs.program_id, analysis.status, analysis.rationale, analysis.source_reference
FROM analysis
CROSS JOIN refs
JOIN conferences conference ON conference.edition = 9 AND conference.municipality = 'Chapada dos Guimarães' AND conference.state = 'MT'
JOIN conference_axes axis ON axis.conference_id = conference.id AND axis.ordinal = analysis.axis_ordinal
JOIN conference_proposals proposal ON proposal.conference_id = conference.id AND proposal.axis_id = axis.id AND proposal.ordinal = analysis.proposal_ordinal;

COMMIT;
