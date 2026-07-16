CREATE TABLE document_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT document_templates_code_format CHECK (code ~ '^[a-z][a-z0-9_]*$')
);

CREATE TABLE document_template_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_template_id uuid NOT NULL REFERENCES document_templates (id),
    version integer NOT NULL CHECK (version > 0),
    schema_definition jsonb NOT NULL,
    change_notes text,
    is_published boolean NOT NULL DEFAULT false,
    published_at timestamptz,
    created_by_user_id uuid REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (document_template_id, version),
    CONSTRAINT document_template_schema_is_object CHECK (jsonb_typeof(schema_definition) = 'object'),
    CONSTRAINT document_template_publish_consistent CHECK (
        (is_published AND published_at IS NOT NULL)
        OR (NOT is_published AND published_at IS NULL)
    )
);

CREATE TABLE track_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id uuid NOT NULL REFERENCES tracks (id) ON DELETE CASCADE,
    document_template_id uuid NOT NULL REFERENCES document_templates (id),
    template_version_id uuid NOT NULL REFERENCES document_template_versions (id),
    current_content jsonb NOT NULL DEFAULT '{}'::jsonb,
    current_revision_number integer NOT NULL DEFAULT 0 CHECK (current_revision_number >= 0),
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'changes_requested', 'approved', 'rejected')),
    sharepoint_url text,
    sharepoint_item_id text,
    created_by_user_id uuid NOT NULL REFERENCES users (id),
    updated_by_user_id uuid NOT NULL REFERENCES users (id),
    submitted_at timestamptz,
    approved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (track_id, document_template_id),
    CONSTRAINT track_documents_content_is_object CHECK (jsonb_typeof(current_content) = 'object')
);

CREATE INDEX track_documents_status_idx ON track_documents (status, updated_at);

CREATE TABLE document_revisions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_document_id uuid NOT NULL REFERENCES track_documents (id) ON DELETE CASCADE,
    revision_number integer NOT NULL CHECK (revision_number > 0),
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
    summary text,
    created_by_user_id uuid NOT NULL REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    submitted_at timestamptz,
    UNIQUE (track_document_id, revision_number),
    CONSTRAINT document_revision_submission_consistent CHECK (
        (status = 'submitted' AND submitted_at IS NOT NULL)
        OR (status = 'draft' AND submitted_at IS NULL)
    )
);

CREATE UNIQUE INDEX document_revisions_one_draft_idx
    ON document_revisions (track_document_id)
    WHERE status = 'draft';

CREATE TABLE document_revision_changes (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_revision_id uuid NOT NULL REFERENCES document_revisions (id) ON DELETE CASCADE,
    change_order integer NOT NULL CHECK (change_order > 0),
    field_path text NOT NULL,
    operation text NOT NULL CHECK (operation IN ('add', 'replace', 'remove')),
    old_value jsonb,
    new_value jsonb,
    changed_by_user_id uuid NOT NULL REFERENCES users (id),
    changed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (document_revision_id, change_order),
    CONSTRAINT document_change_path_not_blank CHECK (btrim(field_path) <> ''),
    CONSTRAINT document_change_value_consistent CHECK (
        (operation = 'add' AND new_value IS NOT NULL)
        OR (operation = 'replace' AND new_value IS NOT NULL)
        OR (operation = 'remove' AND new_value IS NULL)
    )
);

CREATE INDEX document_revision_changes_replay_idx
    ON document_revision_changes (document_revision_id, change_order);

CREATE TABLE document_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_revision_id uuid NOT NULL REFERENCES document_revisions (id),
    reviewer_user_id uuid NOT NULL REFERENCES users (id),
    decision text NOT NULL CHECK (decision IN ('approved', 'changes_requested', 'rejected')),
    comments text,
    reviewed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX document_reviews_revision_idx
    ON document_reviews (document_revision_id, reviewed_at DESC);

CREATE TABLE document_revision_files (
    document_revision_id uuid NOT NULL REFERENCES document_revisions (id) ON DELETE CASCADE,
    file_asset_id uuid NOT NULL REFERENCES file_assets (id),
    purpose text,
    attached_by_user_id uuid NOT NULL REFERENCES users (id),
    attached_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (document_revision_id, file_asset_id)
);

CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type text NOT NULL
        CHECK (notification_type IN (
            'manual', 'task_assigned', 'task_due', 'document_submitted',
            'document_reviewed', 'track_event'
        )),
    title text NOT NULL,
    message text NOT NULL,
    track_id uuid REFERENCES tracks (id) ON DELETE CASCADE,
    track_task_id uuid REFERENCES track_tasks (id) ON DELETE CASCADE,
    track_document_id uuid REFERENCES track_documents (id) ON DELETE CASCADE,
    action_url text,
    created_by_user_id uuid REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    expires_at timestamptz
);

CREATE TABLE notification_recipients (
    notification_id uuid NOT NULL REFERENCES notifications (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    delivered_at timestamptz,
    read_at timestamptz,
    archived_at timestamptz,
    PRIMARY KEY (notification_id, user_id),
    CONSTRAINT notification_recipient_time_order CHECK (
        read_at IS NULL OR delivered_at IS NULL OR delivered_at <= read_at
    )
);

CREATE INDEX notification_recipients_unread_idx
    ON notification_recipients (user_id, notification_id)
    WHERE read_at IS NULL AND archived_at IS NULL;

CREATE OR REPLACE FUNCTION prevent_published_template_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.is_published THEN
        RAISE EXCEPTION 'Published document template versions are immutable; create a new version';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION validate_track_document_template_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    version_template_id uuid;
    version_is_published boolean;
BEGIN
    IF TG_OP = 'UPDATE' AND (
        NEW.document_template_id IS DISTINCT FROM OLD.document_template_id
        OR NEW.template_version_id IS DISTINCT FROM OLD.template_version_id
    ) THEN
        RAISE EXCEPTION 'A track document template version is immutable after creation';
    END IF;

    SELECT document_template_id, is_published
      INTO version_template_id, version_is_published
      FROM document_template_versions
     WHERE id = NEW.template_version_id;

    IF version_template_id IS DISTINCT FROM NEW.document_template_id OR NOT version_is_published THEN
        RAISE EXCEPTION 'Track document must reference a published version of the same template';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION initialize_track_documents()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO track_documents (
        track_id,
        document_template_id,
        template_version_id,
        created_by_user_id,
        updated_by_user_id
    )
    SELECT NEW.id,
           selected.document_template_id,
           selected.id,
           NEW.created_by_user_id,
           NEW.created_by_user_id
      FROM (
          SELECT DISTINCT ON (dtv.document_template_id)
                 dtv.id,
                 dtv.document_template_id
            FROM document_template_versions dtv
            JOIN document_templates dt ON dt.id = dtv.document_template_id
           WHERE dt.is_active
             AND dtv.is_published
           ORDER BY dtv.document_template_id, dtv.version DESC
      ) selected;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_submitted_revision_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    revision_id uuid;
    revision_status text;
BEGIN
    revision_id := COALESCE(NEW.document_revision_id, OLD.document_revision_id);
    SELECT status INTO revision_status FROM document_revisions WHERE id = revision_id;
    IF revision_status <> 'draft' THEN
        RAISE EXCEPTION 'Changes belonging to a submitted revision are immutable';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION jsonb_set_deep(
    p_target jsonb,
    p_path text[],
    p_value jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    result jsonb := COALESCE(p_target, '{}'::jsonb);
    path_index integer;
BEGIN
    IF COALESCE(array_length(p_path, 1), 0) = 0 THEN
        RAISE EXCEPTION 'JSON path cannot be empty';
    END IF;

    IF array_length(p_path, 1) > 1 THEN
        FOR path_index IN 1..array_length(p_path, 1) - 1 LOOP
            IF result #> p_path[1:path_index] IS NULL THEN
                result := jsonb_set(result, p_path[1:path_index], '{}'::jsonb, true);
            END IF;
        END LOOP;
    END IF;

    RETURN jsonb_set(result, p_path, p_value, true);
END;
$$;

CREATE OR REPLACE FUNCTION apply_document_change(
    p_track_document_id uuid,
    p_field_path text,
    p_operation text,
    p_new_value jsonb,
    p_changed_by_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    current_document track_documents%ROWTYPE;
    revision_id uuid;
    next_revision_number integer;
    next_change_order integer;
    path_parts text[];
    previous_value jsonb;
    changed_content jsonb;
BEGIN
    IF btrim(COALESCE(p_field_path, '')) = '' THEN
        RAISE EXCEPTION 'Document field path cannot be blank';
    END IF;
    IF p_operation NOT IN ('add', 'replace', 'remove') THEN
        RAISE EXCEPTION 'Unsupported document change operation: %', p_operation;
    END IF;
    IF p_operation <> 'remove' AND p_new_value IS NULL THEN
        RAISE EXCEPTION 'add and replace operations require a new value';
    END IF;

    SELECT *
      INTO current_document
      FROM track_documents
     WHERE id = p_track_document_id
     FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Track document not found';
    END IF;
    IF current_document.status IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Approved or rejected documents cannot be edited';
    END IF;

    SELECT id
      INTO revision_id
      FROM document_revisions
     WHERE track_document_id = p_track_document_id
       AND status = 'draft';

    IF revision_id IS NULL THEN
        SELECT COALESCE(max(revision_number), 0) + 1
          INTO next_revision_number
          FROM document_revisions
         WHERE track_document_id = p_track_document_id;
        INSERT INTO document_revisions (
            track_document_id,
            revision_number,
            created_by_user_id
        ) VALUES (
            p_track_document_id,
            next_revision_number,
            p_changed_by_user_id
        ) RETURNING id INTO revision_id;
    END IF;

    path_parts := string_to_array(p_field_path, '.');
    previous_value := current_document.current_content #> path_parts;

    IF p_operation = 'remove' THEN
        changed_content := current_document.current_content #- path_parts;
    ELSE
        changed_content := jsonb_set_deep(
            current_document.current_content,
            path_parts,
            p_new_value
        );
    END IF;

    SELECT COALESCE(max(change_order), 0) + 1
      INTO next_change_order
      FROM document_revision_changes
     WHERE document_revision_id = revision_id;

    INSERT INTO document_revision_changes (
        document_revision_id,
        change_order,
        field_path,
        operation,
        old_value,
        new_value,
        changed_by_user_id
    ) VALUES (
        revision_id,
        next_change_order,
        p_field_path,
        p_operation,
        previous_value,
        p_new_value,
        p_changed_by_user_id
    );

    UPDATE track_documents
       SET current_content = changed_content,
           status = 'draft',
           updated_by_user_id = p_changed_by_user_id,
           submitted_at = NULL,
           approved_at = NULL
     WHERE id = p_track_document_id;

    RETURN revision_id;
END;
$$;

CREATE OR REPLACE FUNCTION submit_document_revision(
    p_track_document_id uuid,
    p_submitted_by_user_id uuid,
    p_summary text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    selected_revision document_revisions%ROWTYPE;
    recipient_id uuid;
    created_notification_id uuid;
BEGIN
    SELECT *
      INTO selected_revision
      FROM document_revisions
     WHERE track_document_id = p_track_document_id
       AND status = 'draft'
     FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'There is no draft revision to submit';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM document_revision_changes
         WHERE document_revision_id = selected_revision.id
    ) THEN
        RAISE EXCEPTION 'An empty revision cannot be submitted';
    END IF;

    UPDATE document_revisions
       SET status = 'submitted',
           summary = p_summary,
           submitted_at = clock_timestamp()
     WHERE id = selected_revision.id;

    UPDATE track_documents
       SET status = 'submitted',
           current_revision_number = selected_revision.revision_number,
           updated_by_user_id = p_submitted_by_user_id,
           submitted_at = clock_timestamp(),
           approved_at = NULL
     WHERE id = p_track_document_id;

    INSERT INTO notifications (
        notification_type, title, message, track_id, track_document_id, created_by_user_id
    )
    SELECT 'document_submitted',
           'Documento enviado para validação',
           'Um documento da Trilha está aguardando validação administrativa.',
           td.track_id,
           td.id,
           p_submitted_by_user_id
      FROM track_documents td
     WHERE td.id = p_track_document_id
    RETURNING id INTO created_notification_id;

    FOR recipient_id IN
        SELECT u.id
          FROM users u
          JOIN roles r ON r.id = u.role_id
         WHERE u.status = 'active'
           AND r.code IN ('coordinator', 'administrator')
    LOOP
        INSERT INTO notification_recipients (notification_id, user_id)
        VALUES (created_notification_id, recipient_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    RETURN selected_revision.id;
END;
$$;

CREATE OR REPLACE FUNCTION reconstruct_document_revision(
    p_track_document_id uuid,
    p_revision_number integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    reconstructed jsonb := '{}'::jsonb;
    item record;
    path_parts text[];
BEGIN
    FOR item IN
        SELECT drc.field_path, drc.operation, drc.new_value
          FROM document_revisions dr
          JOIN document_revision_changes drc ON drc.document_revision_id = dr.id
         WHERE dr.track_document_id = p_track_document_id
           AND dr.revision_number <= p_revision_number
         ORDER BY dr.revision_number, drc.change_order
    LOOP
        path_parts := string_to_array(item.field_path, '.');
        IF item.operation = 'remove' THEN
            reconstructed := reconstructed #- path_parts;
        ELSE
            reconstructed := jsonb_set_deep(reconstructed, path_parts, item.new_value);
        END IF;
    END LOOP;
    RETURN reconstructed;
END;
$$;

CREATE OR REPLACE FUNCTION validate_document_reviewer()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    reviewer_role text;
    revision_status text;
BEGIN
    SELECT r.code
      INTO reviewer_role
      FROM users u
      JOIN roles r ON r.id = u.role_id
     WHERE u.id = NEW.reviewer_user_id
       AND u.status = 'active';
    IF reviewer_role NOT IN ('coordinator', 'administrator') THEN
        RAISE EXCEPTION 'Only an active coordinator or administrator may review documents';
    END IF;

    SELECT status INTO revision_status FROM document_revisions WHERE id = NEW.document_revision_id;
    IF revision_status <> 'submitted' THEN
        RAISE EXCEPTION 'Only submitted revisions may be reviewed';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION apply_document_review()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    reviewed_document_id uuid;
    author_id uuid;
    reviewed_track_id uuid;
    created_notification_id uuid;
BEGIN
    SELECT dr.track_document_id, dr.created_by_user_id, td.track_id
      INTO reviewed_document_id, author_id, reviewed_track_id
      FROM document_revisions dr
      JOIN track_documents td ON td.id = dr.track_document_id
     WHERE dr.id = NEW.document_revision_id;

    UPDATE track_documents
       SET status = NEW.decision,
           updated_by_user_id = NEW.reviewer_user_id,
           approved_at = CASE WHEN NEW.decision = 'approved' THEN NEW.reviewed_at ELSE NULL END
     WHERE id = reviewed_document_id;

    INSERT INTO notifications (
        notification_type, title, message, track_id, track_document_id, created_by_user_id
    ) VALUES (
        'document_reviewed',
        'Documento revisado',
        CASE NEW.decision
            WHEN 'approved' THEN 'O documento foi aprovado.'
            WHEN 'changes_requested' THEN 'O documento foi devolvido para ajustes.'
            ELSE 'O documento foi reprovado.'
        END,
        reviewed_track_id,
        reviewed_document_id,
        NEW.reviewer_user_id
    ) RETURNING id INTO created_notification_id;

    INSERT INTO notification_recipients (notification_id, user_id)
    VALUES (created_notification_id, author_id)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_task_assignee()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    task_title text;
    parent_track_id uuid;
    created_notification_id uuid;
BEGIN
    SELECT title, track_id INTO task_title, parent_track_id
      FROM track_tasks WHERE id = NEW.track_task_id;

    INSERT INTO notifications (
        notification_type, title, message, track_id, track_task_id, created_by_user_id
    ) VALUES (
        'task_assigned',
        'Nova tarefa atribuída',
        task_title,
        parent_track_id,
        NEW.track_task_id,
        NEW.assigned_by_user_id
    ) RETURNING id INTO created_notification_id;

    INSERT INTO notification_recipients (notification_id, user_id)
    VALUES (created_notification_id, NEW.user_id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER document_template_versions_immutable
BEFORE UPDATE OR DELETE ON document_template_versions
FOR EACH ROW EXECUTE FUNCTION prevent_published_template_version_mutation();

CREATE TRIGGER track_documents_template_version_guard
BEFORE INSERT OR UPDATE OF document_template_id, template_version_id ON track_documents
FOR EACH ROW EXECUTE FUNCTION validate_track_document_template_version();

CREATE TRIGGER document_revision_changes_draft_guard
BEFORE INSERT OR UPDATE OR DELETE ON document_revision_changes
FOR EACH ROW EXECUTE FUNCTION prevent_submitted_revision_mutation();

CREATE TRIGGER document_reviews_reviewer_guard
BEFORE INSERT OR UPDATE ON document_reviews
FOR EACH ROW EXECUTE FUNCTION validate_document_reviewer();

CREATE TRIGGER document_reviews_apply
AFTER INSERT ON document_reviews
FOR EACH ROW EXECUTE FUNCTION apply_document_review();

CREATE TRIGGER tracks_initialize_documents
AFTER INSERT ON tracks
FOR EACH ROW EXECUTE FUNCTION initialize_track_documents();

CREATE TRIGGER track_task_assignees_notify
AFTER INSERT ON track_task_assignees
FOR EACH ROW EXECUTE FUNCTION notify_task_assignee();

CREATE TRIGGER document_templates_set_updated_at BEFORE UPDATE ON document_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER track_documents_set_updated_at BEFORE UPDATE ON track_documents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER document_templates_audit AFTER INSERT OR UPDATE OR DELETE ON document_templates
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER document_template_versions_audit AFTER INSERT OR UPDATE OR DELETE ON document_template_versions
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER track_documents_audit AFTER INSERT OR UPDATE OR DELETE ON track_documents
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER document_revisions_audit AFTER INSERT OR UPDATE OR DELETE ON document_revisions
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER document_reviews_audit AFTER INSERT OR UPDATE OR DELETE ON document_reviews
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER notifications_audit AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
