-- Completa o catálogo usado pelo exportador com os vínculos fornecidos pela operação.
-- Os tipos e as perguntas já existentes no seed 004 são reutilizados.

UPDATE report_stages
   SET display_order = display_order + 100
 WHERE code IN ('M2.4', 'M2.6');

INSERT INTO report_stages (id, code, name, display_order) VALUES
    ('40000000-0000-4000-8000-000000000203', 'M2.3', 'Acompanhamento pedagógico', 6)
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    is_active = true;

UPDATE report_stages
   SET display_order = CASE code
       WHEN 'M2.4' THEN 7
       WHEN 'M2.6' THEN 8
       ELSE display_order
   END
 WHERE code IN ('M2.4', 'M2.6');

INSERT INTO attachment_types (id, code, name, description) VALUES
    ('41000000-0000-4000-8000-000000000010', 'LISTA_CHAMADA', 'Lista de chamada', 'Lista de chamada ou registro de presença utilizado no processo seletivo.'),
    ('41000000-0000-4000-8000-000000000011', 'EMISSAO_CERTIFICADOS', 'Emissão de certificados', 'Comprovante da emissão de certificados ou declarações.'),
    ('41000000-0000-4000-8000-000000000012', 'REGISTRO_NOTAS', 'Registro de notas', 'Registro de avaliações, notas ou resultados pedagógicos.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;

INSERT INTO report_questions (id, report_stage_id, code, label, display_order) VALUES
    ('42000000-0000-4000-8000-000000000020', '40000000-0000-4000-8000-000000000203', 'M2.3_Q01', 'Pergunta 01', 1),
    ('42000000-0000-4000-8000-000000000021', '40000000-0000-4000-8000-000000000203', 'M2.3_Q03', 'Pergunta 03', 3),
    ('42000000-0000-4000-8000-000000000022', '40000000-0000-4000-8000-000000000203', 'M2.3_Q11', 'Pergunta 11', 11),
    ('42000000-0000-4000-8000-000000000023', '40000000-0000-4000-8000-000000000203', 'M2.3_Q13', 'Pergunta 13', 13)
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    display_order = EXCLUDED.display_order,
    is_active = true;

INSERT INTO question_attachment_types (
    report_question_id, attachment_type_id
) VALUES
    -- M2.1_Q05 aceita os dois comprovantes usados pelas trilhas informadas.
    ('42000000-0000-4000-8000-000000000010', '41000000-0000-4000-8000-000000000010'),
    -- M2.3: certificados, registros de avaliação e pesquisa de satisfação.
    ('42000000-0000-4000-8000-000000000020', '41000000-0000-4000-8000-000000000011'),
    ('42000000-0000-4000-8000-000000000021', '41000000-0000-4000-8000-000000000012'),
    ('42000000-0000-4000-8000-000000000022', '41000000-0000-4000-8000-000000000012'),
    ('42000000-0000-4000-8000-000000000023', '41000000-0000-4000-8000-000000000004'),
    -- M2.4_Q07 usa a pesquisa Opina Aí.
    ('42000000-0000-4000-8000-000000000016', '41000000-0000-4000-8000-000000000004')
ON CONFLICT (report_question_id, attachment_type_id) DO NOTHING;
