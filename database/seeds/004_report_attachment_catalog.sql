INSERT INTO document_templates (id, code, name, description) VALUES
    (
        '00000000-0000-4000-8000-000000000503',
        'softex_accountability_report',
        'Relatório de prestação de contas Softex',
        'Relatório por metas com referências fixas para anexos.'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;

INSERT INTO document_template_versions (
    id, document_template_id, version, schema_definition,
    change_notes, is_published, published_at
) VALUES (
    '00000000-0000-4000-8000-000000000513',
    '00000000-0000-4000-8000-000000000503',
    1,
    '{"schema_version": 1, "sections": [], "attachment_catalog": "report_attachment_catalog_v1"}'::jsonb,
    'Versão inicial do relatório Softex com anexos por meta.',
    true,
    clock_timestamp()
)
ON CONFLICT (id) DO NOTHING;

-- Disponibiliza o novo documento também para trilhas criadas antes deste catálogo.
INSERT INTO track_documents (
    track_id, document_template_id, template_version_id,
    created_by_user_id, updated_by_user_id
)
SELECT t.id,
       '00000000-0000-4000-8000-000000000503',
       '00000000-0000-4000-8000-000000000513',
       t.created_by_user_id,
       t.created_by_user_id
  FROM tracks t
ON CONFLICT (track_id, document_template_id) DO NOTHING;

INSERT INTO report_stages (id, code, name, display_order) VALUES
    ('40000000-0000-4000-8000-000000000113', 'M1.13', 'Criação e curadoria de materiais instrucionais', 1),
    ('40000000-0000-4000-8000-000000000114', 'M1.14', 'Objetos de aprendizagem e recursos didáticos', 2),
    ('40000000-0000-4000-8000-000000000115', 'M1.15', 'LMS e recursos técnicos', 3),
    ('40000000-0000-4000-8000-000000000201', 'M2.1', 'Processo seletivo', 4),
    ('40000000-0000-4000-8000-000000000202', 'M2.2', 'Oferta das capacitações', 5),
    ('40000000-0000-4000-8000-000000000204', 'M2.4', 'Indicadores pedagógicos', 6),
    ('40000000-0000-4000-8000-000000000206', 'M2.6', 'Emissão de microcredenciais', 7)
ON CONFLICT (id) DO NOTHING;

INSERT INTO attachment_types (id, code, name, description) VALUES
    ('41000000-0000-4000-8000-000000000001', 'MATERIAL_INSTRUCIONAL_AMOSTRA', 'Amostra de material instrucional', 'Espaço amostral dos materiais apresentados.'),
    ('41000000-0000-4000-8000-000000000002', 'ATIVIDADE_AVALIATIVA', 'Atividade avaliativa', 'Amostra ou exemplo de atividade avaliativa.'),
    ('41000000-0000-4000-8000-000000000003', 'PLANO_ENSINO', 'Plano de ensino', 'Plano de ensino da trilha ou oferta.'),
    ('41000000-0000-4000-8000-000000000004', 'PESQUISA_SATISFACAO_OPINA_AI', 'Pesquisa de satisfação Opina Aí', 'Formulário ou resultado da pesquisa Opina Aí.'),
    ('41000000-0000-4000-8000-000000000005', 'EVIDENCIA_AMBIENTE_VIRTUAL', 'Evidência de ambiente virtual', 'Telas do ambiente virtual de aprendizagem.'),
    ('41000000-0000-4000-8000-000000000006', 'RESUMO_INSCRICOES', 'Resumo das inscrições', 'Resumo do processo e do perfil das inscrições.'),
    ('41000000-0000-4000-8000-000000000007', 'LISTA_PRESENCA', 'Lista de presença', 'Lista de presença da oferta.'),
    ('41000000-0000-4000-8000-000000000008', 'MODELO_DECLARACAO_PARTICIPACAO', 'Modelo de declaração de participação', 'Modelo utilizado para comprovar a participação com sucesso.'),
    ('41000000-0000-4000-8000-000000000009', 'EMAIL_DECLARACAO_PARTICIPACAO', 'E-mail da declaração de participação', 'Exemplo de envio da declaração de participação por e-mail.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO report_questions (id, report_stage_id, code, label, display_order) VALUES
    ('42000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000113', 'M1.13_Q01', 'Pergunta 01', 1),
    ('42000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000113', 'M1.13_Q02', 'Pergunta 02', 2),
    ('42000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000113', 'M1.13_Q05', 'Pergunta 05', 5),
    ('42000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000113', 'M1.13_Q15', 'Pergunta 15', 15),
    ('42000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000114', 'M1.14_Q06', 'Pergunta 06', 6),
    ('42000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000114', 'M1.14_Q07', 'Pergunta 07', 7),
    ('42000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000114', 'M1.14_Q13', 'Pergunta 13', 13),
    ('42000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000115', 'M1.15_Q11', 'Pergunta 11', 11),
    ('42000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000115', 'M1.15_Q16', 'Pergunta 16', 16),
    ('42000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000201', 'M2.1_Q05', 'Pergunta 05', 5),
    ('42000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000202', 'M2.2_Q01', 'Pergunta 01', 1),
    ('42000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000202', 'M2.2_Q02', 'Pergunta 02', 2),
    ('42000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000202', 'M2.2_Q05', 'Pergunta 05', 5),
    ('42000000-0000-4000-8000-000000000014', '40000000-0000-4000-8000-000000000202', 'M2.2_Q19', 'Pergunta 19', 19),
    ('42000000-0000-4000-8000-000000000015', '40000000-0000-4000-8000-000000000204', 'M2.4_Q01', 'Pergunta 01', 1),
    ('42000000-0000-4000-8000-000000000016', '40000000-0000-4000-8000-000000000204', 'M2.4_Q07', 'Pergunta 07', 7),
    ('42000000-0000-4000-8000-000000000017', '40000000-0000-4000-8000-000000000206', 'M2.6_Q03', 'Pergunta 03', 3),
    ('42000000-0000-4000-8000-000000000018', '40000000-0000-4000-8000-000000000206', 'M2.6_Q12', 'Pergunta 12', 12),
    ('42000000-0000-4000-8000-000000000019', '40000000-0000-4000-8000-000000000206', 'M2.6_Q17', 'Pergunta 17', 17)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_attachment_types (
    report_question_id, attachment_type_id, notes
) VALUES
    ('42000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', NULL),
    ('42000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000001', NULL),
    ('42000000-0000-4000-8000-000000000003', '41000000-0000-4000-8000-000000000002', NULL),
    ('42000000-0000-4000-8000-000000000004', '41000000-0000-4000-8000-000000000001', 'O corpo do relatório descreve material instrucional.'),
    ('42000000-0000-4000-8000-000000000004', '41000000-0000-4000-8000-000000000002', 'A seção de anexos descreve atividade avaliativa; preservar a divergência para auditoria.'),
    ('42000000-0000-4000-8000-000000000005', '41000000-0000-4000-8000-000000000003', NULL),
    ('42000000-0000-4000-8000-000000000006', '41000000-0000-4000-8000-000000000002', NULL),
    ('42000000-0000-4000-8000-000000000007', '41000000-0000-4000-8000-000000000002', NULL),
    ('42000000-0000-4000-8000-000000000008', '41000000-0000-4000-8000-000000000004', NULL),
    ('42000000-0000-4000-8000-000000000009', '41000000-0000-4000-8000-000000000005', NULL),
    ('42000000-0000-4000-8000-000000000010', '41000000-0000-4000-8000-000000000006', NULL),
    ('42000000-0000-4000-8000-000000000011', '41000000-0000-4000-8000-000000000003', NULL),
    ('42000000-0000-4000-8000-000000000012', '41000000-0000-4000-8000-000000000007', NULL),
    ('42000000-0000-4000-8000-000000000013', '41000000-0000-4000-8000-000000000005', NULL),
    ('42000000-0000-4000-8000-000000000014', '41000000-0000-4000-8000-000000000005', NULL),
    ('42000000-0000-4000-8000-000000000015', '41000000-0000-4000-8000-000000000002', NULL),
    ('42000000-0000-4000-8000-000000000016', '41000000-0000-4000-8000-000000000004', NULL),
    ('42000000-0000-4000-8000-000000000017', '41000000-0000-4000-8000-000000000008', NULL),
    ('42000000-0000-4000-8000-000000000018', '41000000-0000-4000-8000-000000000009', NULL),
    ('42000000-0000-4000-8000-000000000019', '41000000-0000-4000-8000-000000000008', NULL)
ON CONFLICT (report_question_id, attachment_type_id) DO NOTHING;
