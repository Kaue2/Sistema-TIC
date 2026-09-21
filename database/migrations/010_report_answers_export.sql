CREATE TABLE report_answers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_document_id uuid NOT NULL REFERENCES track_documents (id) ON DELETE CASCADE,
    report_question_id uuid NOT NULL REFERENCES report_questions (id),
    answer text NOT NULL,
    created_by_user_id uuid NOT NULL REFERENCES users (id),
    updated_by_user_id uuid NOT NULL REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT report_answers_answer_not_blank CHECK (btrim(answer) <> ''),
    UNIQUE (track_document_id, report_question_id)
);

CREATE INDEX report_answers_document_idx
    ON report_answers (track_document_id, report_question_id);

CREATE OR REPLACE FUNCTION validate_report_answer_document()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM track_documents td
          JOIN document_templates dt ON dt.id = td.document_template_id
         WHERE td.id = NEW.track_document_id
           AND dt.code = 'softex_accountability_report'
    ) THEN
        RAISE EXCEPTION 'Answers may only be recorded for Softex accountability reports';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER report_answers_document_guard
BEFORE INSERT OR UPDATE OF track_document_id ON report_answers
FOR EACH ROW EXECUTE FUNCTION validate_report_answer_document();

CREATE TRIGGER report_answers_set_updated_at
BEFORE UPDATE ON report_answers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER report_answers_audit
AFTER INSERT OR UPDATE OR DELETE ON report_answers
FOR EACH ROW EXECUTE FUNCTION audit_row_change();

CREATE VIEW report_export_questions AS
SELECT
    td.id AS track_document_id,
    rs.code AS stage_code,
    rq.code AS question_code,
    rq.label AS question_label,
    rq.display_order AS question_display_order,
    answer.answer,
    COALESCE(annexes.items, '[]'::jsonb) AS annexes
  FROM track_documents td
  JOIN document_templates dt ON dt.id = td.document_template_id
  JOIN report_questions rq ON rq.is_active
  JOIN report_stages rs ON rs.id = rq.report_stage_id AND rs.is_active
  LEFT JOIN report_answers answer
    ON answer.track_document_id = td.id
   AND answer.report_question_id = rq.id
  LEFT JOIN LATERAL (
      SELECT jsonb_agg(
          jsonb_build_object(
              'annex_id', ra.id,
              'attachment_type_code', at.code,
              'attachment_type_name', at.name,
              'title', ra.title,
              'source_reference', ra.source_reference,
              'validation_status', ra.validation_status,
              'images', images.items
          )
          ORDER BY ra.created_at, ra.id
      ) AS items
        FROM question_annexes qa
        JOIN report_annexes ra
          ON ra.id = qa.report_annex_id
         AND ra.track_document_id = td.id
         AND ra.deleted_at IS NULL
        JOIN attachment_types at ON at.id = ra.attachment_type_id
        CROSS JOIN LATERAL (
            SELECT COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'image_id', rai.id,
                        'original_file_name', fa.original_file_name,
                        'media_type', fa.media_type,
                        'display_order', rai.display_order
                    )
                    ORDER BY rai.display_order, rai.id
                ),
                '[]'::jsonb
            ) AS items
              FROM report_annex_images rai
              JOIN file_assets fa
                ON fa.id = rai.file_asset_id
               AND fa.deleted_at IS NULL
             WHERE rai.report_annex_id = ra.id
               AND rai.deleted_at IS NULL
        ) images
       WHERE qa.report_question_id = rq.id
  ) annexes ON true
 WHERE dt.code = 'softex_accountability_report';
