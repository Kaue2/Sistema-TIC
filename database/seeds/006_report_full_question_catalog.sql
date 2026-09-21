-- Catálogo completo das perguntas que aparecem nos relatórios Softex fornecidos.
-- O texto que vai ao DOCX é preservado no modelo oficial; aqui ficam os códigos,
-- a ordem e a ligação com o campo de origem para persistir as respostas.
WITH catalog (stage_code, first_question, last_question, source_offset) AS (
    VALUES
        ('M1.13', 1, 15, 1),
        ('M1.14', 1, 13, 0),
        ('M1.15', 1, 16, 1),
        ('M2.1',  1, 13, 0),
        ('M2.2',  1, 19, 1),
        ('M2.3',  1, 17, 1),
        ('M2.4',  1, 19, 1),
        ('M2.6',  1, 18, 0)
), questions AS (
    SELECT rs.id AS stage_id,
           c.stage_code || '_Q' || lpad(question_number::text, 2, '0') AS code,
           format('Pergunta %s', lpad(question_number::text, 2, '0')) AS label,
           format('%s -%s', substr(c.stage_code, 2), lpad((question_number + c.source_offset)::text, 2, '0')) AS softex_field_id,
           question_number AS display_order
      FROM catalog c
      JOIN report_stages rs ON rs.code = c.stage_code
      CROSS JOIN LATERAL generate_series(c.first_question, c.last_question) AS question_number
)
INSERT INTO report_questions (
    report_stage_id, code, label, softex_field_id, display_order
)
SELECT stage_id, code, label, softex_field_id, display_order
  FROM questions
ON CONFLICT (code) DO UPDATE SET
    report_stage_id = EXCLUDED.report_stage_id,
    label = EXCLUDED.label,
    softex_field_id = EXCLUDED.softex_field_id,
    display_order = EXCLUDED.display_order,
    is_active = true;

UPDATE report_questions rq
   SET label = source.label
  FROM (VALUES
      ('M2.1_Q01', 'Explicação sobre o propósito do relatório, que é documentar e comprovar a execução do processo seletivo para as capacitações ofertadas.'),
      ('M2.1_Q02', 'Detalhamento das fases do processo seletivo, como inscrição, triagem, testes, entrevistas, entre outros.'),
      ('M2.1_Q03', 'Apresentação dos critérios usados para avaliar e selecionar os candidatos, conforme definido no relatório de critérios de seleção.'),
      ('M2.1_Q04', 'Quantidade total de candidatos que se inscreveram para as capacitações.'),
      ('M2.1_Q05', 'Análise do perfil dos inscritos, incluindo informações como formação acadêmica, experiências profissionais, e áreas de interesse.'),
      ('M2.1_Q06', 'Relação dos candidatos aprovados, com destaque para aqueles que foram selecionados em primeira chamada e os que estão em lista de espera.'),
      ('M2.1_Q07', 'Percentual de aprovação, taxa de desistência, e outros dados relevantes.'),
      ('M2.1_Q08', 'Descrição das ferramentas e métodos utilizados para avaliar os candidatos.'),
      ('M2.1_Q09', 'Critérios específicos de avaliação e notas médias dos candidatos aprovados.'),
      ('M2.1_Q10', 'Descrição de quaisquer desafios ou problemas enfrentados durante o processo seletivo.'),
      ('M2.1_Q11', 'Soluções aplicadas para resolver os problemas identificados.'),
      ('M2.1_Q12', 'Detalhamento das decisões tomadas em cada fase do processo e a documentação correspondente.'),
      ('M2.1_Q13', 'Resumo final destacando o sucesso do processo seletivo e a conformidade com os critérios estabelecidos, garantindo a transparência e a eficácia na seleção dos candidatos.')
  ) AS source(code, label)
 WHERE rq.code = source.code;

-- A matriz abaixo é a fonte de verdade da operação. Remove os dois vínculos
-- herdados do rascunho inicial que não pertencem à lista fornecida.
DELETE FROM question_attachment_types qat
 USING report_questions rq, attachment_types at
 WHERE qat.report_question_id = rq.id
   AND qat.attachment_type_id = at.id
   AND (
        (rq.code = 'M1.13_Q02' AND at.code = 'MATERIAL_INSTRUCIONAL_AMOSTRA')
     OR (rq.code = 'M1.13_Q15' AND at.code = 'ATIVIDADE_AVALIATIVA')
   );
