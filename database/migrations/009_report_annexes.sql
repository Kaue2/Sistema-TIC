CREATE TABLE report_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    display_order integer NOT NULL CHECK (display_order > 0),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT report_stages_code_format CHECK (code ~ '^M[0-9]+\.[0-9]+$'),
    CONSTRAINT report_stages_name_not_blank CHECK (btrim(name) <> '')
);

CREATE UNIQUE INDEX report_stages_display_order_idx
    ON report_stages (display_order);

CREATE TABLE report_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_stage_id uuid NOT NULL REFERENCES report_stages (id),
    code text NOT NULL UNIQUE,
    label text NOT NULL,
    softex_field_id text,
    display_order integer NOT NULL CHECK (display_order > 0),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT report_questions_code_format CHECK (code ~ '^M[0-9]+\.[0-9]+_Q[0-9]{2}$'),
    CONSTRAINT report_questions_label_not_blank CHECK (btrim(label) <> ''),
    UNIQUE (report_stage_id, display_order)
);

CREATE TABLE attachment_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT attachment_types_code_format CHECK (code ~ '^[A-Z][A-Z0-9_]*$'),
    CONSTRAINT attachment_types_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE question_attachment_types (
    report_question_id uuid NOT NULL REFERENCES report_questions (id) ON DELETE CASCADE,
    attachment_type_id uuid NOT NULL REFERENCES attachment_types (id),
    is_required boolean NOT NULL DEFAULT false,
    minimum_annexes integer NOT NULL DEFAULT 0 CHECK (minimum_annexes >= 0),
    maximum_annexes integer CHECK (maximum_annexes IS NULL OR maximum_annexes > 0),
    display_order integer NOT NULL DEFAULT 1 CHECK (display_order > 0),
    notes text,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (report_question_id, attachment_type_id),
    CONSTRAINT question_attachment_types_limits_valid CHECK (
        maximum_annexes IS NULL OR minimum_annexes <= maximum_annexes
    )
);

CREATE TABLE report_annexes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_document_id uuid NOT NULL REFERENCES track_documents (id) ON DELETE CASCADE,
    report_stage_id uuid NOT NULL REFERENCES report_stages (id),
    attachment_type_id uuid NOT NULL REFERENCES attachment_types (id),
    title text NOT NULL,
    source_reference text,
    validation_status text NOT NULL DEFAULT 'pending'
        CHECK (validation_status IN ('pending', 'valid', 'inconsistent', 'rejected')),
    validation_notes text,
    version integer NOT NULL DEFAULT 1 CHECK (version > 0),
    created_by_user_id uuid NOT NULL REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    deleted_at timestamptz,
    CONSTRAINT report_annexes_title_not_blank CHECK (btrim(title) <> '')
);

CREATE INDEX report_annexes_document_stage_idx
    ON report_annexes (track_document_id, report_stage_id, created_at)
    WHERE deleted_at IS NULL;

CREATE TABLE report_annex_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_annex_id uuid NOT NULL REFERENCES report_annexes (id) ON DELETE CASCADE,
    file_asset_id uuid NOT NULL UNIQUE REFERENCES file_assets (id),
    display_order integer NOT NULL CHECK (display_order > 0),
    caption text,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    deleted_at timestamptz
);

CREATE UNIQUE INDEX report_annex_images_active_order_idx
    ON report_annex_images (report_annex_id, display_order)
    WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION enforce_report_annex_image_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF (
        SELECT count(*)
          FROM report_annex_images
         WHERE report_annex_id = NEW.report_annex_id
           AND deleted_at IS NULL
           AND id IS DISTINCT FROM NEW.id
    ) >= 20 THEN
        RAISE EXCEPTION 'A report annex may contain at most 20 active images';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER report_annex_images_limit_guard
BEFORE INSERT OR UPDATE OF report_annex_id, deleted_at ON report_annex_images
FOR EACH ROW EXECUTE FUNCTION enforce_report_annex_image_limit();

CREATE TABLE question_annexes (
    report_question_id uuid NOT NULL REFERENCES report_questions (id) ON DELETE CASCADE,
    report_annex_id uuid NOT NULL REFERENCES report_annexes (id) ON DELETE CASCADE,
    linked_by_user_id uuid NOT NULL REFERENCES users (id),
    linked_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (report_question_id, report_annex_id)
);

CREATE OR REPLACE FUNCTION validate_question_annex_link()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    question_stage_id uuid;
    annex_stage_id uuid;
    annex_type_id uuid;
BEGIN
    SELECT report_stage_id
      INTO question_stage_id
      FROM report_questions
     WHERE id = NEW.report_question_id
       AND is_active;

    SELECT report_stage_id, attachment_type_id
      INTO annex_stage_id, annex_type_id
      FROM report_annexes
     WHERE id = NEW.report_annex_id
       AND deleted_at IS NULL;

    IF question_stage_id IS NULL OR annex_stage_id IS NULL THEN
        RAISE EXCEPTION 'Question and annex must be active';
    END IF;

    IF question_stage_id <> annex_stage_id THEN
        RAISE EXCEPTION 'Question and annex must belong to the same report stage';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM question_attachment_types
         WHERE report_question_id = NEW.report_question_id
           AND attachment_type_id = annex_type_id
    ) THEN
        RAISE EXCEPTION 'Attachment type is not allowed for this question';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER question_annexes_validation_guard
BEFORE INSERT OR UPDATE ON question_annexes
FOR EACH ROW EXECUTE FUNCTION validate_question_annex_link();

CREATE TRIGGER report_stages_set_updated_at
BEFORE UPDATE ON report_stages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER report_questions_set_updated_at
BEFORE UPDATE ON report_questions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER attachment_types_set_updated_at
BEFORE UPDATE ON attachment_types
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER report_annexes_set_updated_at
BEFORE UPDATE ON report_annexes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER report_stages_audit
AFTER INSERT OR UPDATE OR DELETE ON report_stages
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER report_questions_audit
AFTER INSERT OR UPDATE OR DELETE ON report_questions
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER attachment_types_audit
AFTER INSERT OR UPDATE OR DELETE ON attachment_types
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER report_annexes_audit
AFTER INSERT OR UPDATE OR DELETE ON report_annexes
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER report_annex_images_audit
AFTER INSERT OR UPDATE OR DELETE ON report_annex_images
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
