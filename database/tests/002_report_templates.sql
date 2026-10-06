-- Run after all seeds, in the isolated test database. No persistent changes.
BEGIN;
CREATE TEMP TABLE question_snapshot AS
SELECT id, code, softex_field_id FROM report_questions;
CREATE TEMP TABLE evidence_snapshot AS SELECT * FROM question_attachment_types;
\i /database/seeds/008_report_question_labels.sql
DO $$
BEGIN
    IF EXISTS ((SELECT * FROM question_snapshot EXCEPT SELECT id, code, softex_field_id FROM report_questions)
        UNION ALL (SELECT id, code, softex_field_id FROM report_questions EXCEPT SELECT * FROM question_snapshot)) THEN
        RAISE EXCEPTION 'The report text seed changed identifiers or Softex bindings';
    END IF;
    IF EXISTS ((SELECT * FROM evidence_snapshot EXCEPT SELECT * FROM question_attachment_types)
        UNION ALL (SELECT * FROM question_attachment_types EXCEPT SELECT * FROM evidence_snapshot)) THEN
        RAISE EXCEPTION 'The report text seed changed the evidence matrix';
    END IF;
    IF (SELECT count(*) FROM report_questions q JOIN report_stages s ON s.id = q.report_stage_id
        WHERE s.code IN ('M1.13','M1.14','M1.15','M2.1','M2.2','M2.4','M2.6') AND q.is_active) <> 113 THEN
        RAISE EXCEPTION 'Expected 113 questions across the seven templates';
    END IF;
    IF EXISTS (SELECT 1 FROM report_questions q JOIN report_stages s ON s.id = q.report_stage_id
        WHERE s.code IN ('M1.13','M1.14','M1.15','M2.1','M2.2','M2.4','M2.6') AND q.is_active
        AND (q.label ~ '^Pergunta [0-9]+' OR q.label = 'g' OR btrim(q.label) = '')) THEN
        RAISE EXCEPTION 'The report question catalog still contains generic/corrupt labels';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM report_questions WHERE softex_field_id = '1.14 -12'
        AND label = 'Sumário dos resultados observados e planejamento das ações futuras para a criação, atualização e curadoria dos objetos de aprendizagem.') THEN
        RAISE EXCEPTION 'Incorrect label for 1.14 -12';
    END IF;
END;
$$;
ROLLBACK;
