CREATE TABLE track_ideas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    suggested_knowledge_area_id uuid REFERENCES knowledge_areas (id),
    proposed_by_user_id uuid REFERENCES users (id),
    proposer_name text,
    proposer_contact text,
    status text NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'under_review', 'accepted', 'rejected', 'archived')),
    reviewed_by_user_id uuid REFERENCES users (id),
    reviewed_at timestamptz,
    review_notes text,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT track_ideas_title_not_blank CHECK (btrim(title) <> ''),
    CONSTRAINT track_ideas_proposer_present CHECK (
        proposed_by_user_id IS NOT NULL OR btrim(COALESCE(proposer_name, '')) <> ''
    ),
    CONSTRAINT track_ideas_review_consistent CHECK (
        (reviewed_at IS NULL AND reviewed_by_user_id IS NULL)
        OR (reviewed_at IS NOT NULL AND reviewed_by_user_id IS NOT NULL)
    )
);

CREATE TABLE tracks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code citext UNIQUE,
    idea_id uuid UNIQUE REFERENCES track_ideas (id),
    source_track_id uuid REFERENCES tracks (id),
    knowledge_area_id uuid NOT NULL REFERENCES knowledge_areas (id),
    category_id uuid NOT NULL REFERENCES track_categories (id),
    title text NOT NULL,
    short_description text,
    modality text NOT NULL CHECK (modality IN ('online', 'hybrid')),
    learning_level text CHECK (learning_level IN ('introductory', 'intermediate', 'advanced')),
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN (
            'draft', 'planning', 'production', 'pre_track', 'running',
            'post_track', 'completed', 'cancelled'
        )),
    planned_production_starts_on date,
    planned_production_ends_on date,
    planned_track_starts_on date,
    planned_track_ends_on date,
    registration_starts_at timestamptz,
    registration_ends_at timestamptz,
    online_workload_minutes integer NOT NULL DEFAULT 0 CHECK (online_workload_minutes >= 0),
    in_person_workload_minutes integer NOT NULL DEFAULT 0 CHECK (in_person_workload_minutes >= 0),
    total_workload_minutes integer GENERATED ALWAYS AS (
        online_workload_minutes + in_person_workload_minutes
    ) STORED,
    planned_capacity integer CHECK (planned_capacity IS NULL OR planned_capacity > 0),
    target_audience text,
    prerequisites text,
    attendance_requirement_percent numeric(5,2)
        CHECK (attendance_requirement_percent IS NULL OR attendance_requirement_percent BETWEEN 0 AND 100),
    created_by_user_id uuid NOT NULL REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    cancelled_at timestamptz,
    CONSTRAINT tracks_title_not_blank CHECK (btrim(title) <> ''),
    CONSTRAINT tracks_short_description_length CHECK (
        short_description IS NULL OR char_length(short_description) <= 300
    ),
    CONSTRAINT tracks_source_is_different CHECK (source_track_id IS NULL OR source_track_id <> id),
    CONSTRAINT tracks_production_date_order CHECK (
        planned_production_ends_on IS NULL OR planned_production_starts_on IS NULL
        OR planned_production_starts_on <= planned_production_ends_on
    ),
    CONSTRAINT tracks_execution_date_order CHECK (
        planned_track_ends_on IS NULL OR planned_track_starts_on IS NULL
        OR planned_track_starts_on <= planned_track_ends_on
    ),
    CONSTRAINT tracks_registration_date_order CHECK (
        registration_ends_at IS NULL OR registration_starts_at IS NULL
        OR registration_starts_at <= registration_ends_at
    ),
    CONSTRAINT tracks_modality_workload CHECK (
        (status = 'draft')
        OR (modality = 'online' AND online_workload_minutes > 0 AND in_person_workload_minutes = 0)
        OR (modality = 'hybrid' AND online_workload_minutes > 0 AND in_person_workload_minutes > 0)
    ),
    CONSTRAINT tracks_cancelled_state_consistent CHECK (
        (status = 'cancelled' AND cancelled_at IS NOT NULL)
        OR (status <> 'cancelled' AND cancelled_at IS NULL)
    )
);

CREATE INDEX tracks_status_idx ON tracks (status);
CREATE INDEX tracks_knowledge_area_idx ON tracks (knowledge_area_id);
CREATE INDEX tracks_period_idx ON tracks (planned_track_starts_on, planned_track_ends_on);

CREATE TABLE track_reuse_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id uuid NOT NULL REFERENCES tracks (id) ON DELETE CASCADE,
    source_track_id uuid NOT NULL REFERENCES tracks (id),
    item_type text NOT NULL
        CHECK (item_type IN ('workflow', 'curriculum', 'document', 'requirement', 'competency')),
    source_entity_id uuid,
    copied_entity_id uuid,
    notes text,
    copied_by_user_id uuid NOT NULL REFERENCES users (id),
    copied_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT track_reuse_source_is_different CHECK (track_id <> source_track_id)
);

CREATE TABLE track_team_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id uuid NOT NULL REFERENCES tracks (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users (id),
    responsibility text NOT NULL
        CHECK (responsibility IN ('coordinator', 'administrator', 'mentor', 'monitor')),
    is_lead boolean NOT NULL DEFAULT false,
    starts_on date NOT NULL DEFAULT CURRENT_DATE,
    ends_on date,
    assigned_by_user_id uuid NOT NULL REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT track_team_member_date_order CHECK (ends_on IS NULL OR starts_on <= ends_on)
);

CREATE UNIQUE INDEX track_team_members_one_active_responsibility_idx
    ON track_team_members (track_id, user_id, responsibility)
    WHERE ends_on IS NULL;
CREATE INDEX track_team_members_track_idx ON track_team_members (track_id, ends_on);

CREATE TABLE workflow_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL,
    name text NOT NULL,
    version integer NOT NULL CHECK (version > 0),
    description text,
    is_default boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_by_user_id uuid REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (code, version),
    CONSTRAINT workflow_templates_code_format CHECK (code ~ '^[a-z][a-z0-9_]*$')
);

CREATE UNIQUE INDEX workflow_templates_one_default_idx
    ON workflow_templates ((is_default))
    WHERE is_default AND is_active;

CREATE TABLE workflow_template_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_template_id uuid NOT NULL REFERENCES workflow_templates (id) ON DELETE CASCADE,
    code text NOT NULL,
    phase text NOT NULL
        CHECK (phase IN ('planning', 'production', 'pre_track', 'track', 'post_track')),
    title text NOT NULL,
    description text,
    default_responsibility text
        CHECK (default_responsibility IS NULL OR default_responsibility IN (
            'coordinator', 'administrator', 'mentor', 'monitor'
        )),
    default_due_offset_days integer,
    display_order integer NOT NULL CHECK (display_order >= 0),
    is_required boolean NOT NULL DEFAULT true,
    UNIQUE (workflow_template_id, code),
    UNIQUE (workflow_template_id, display_order),
    CONSTRAINT workflow_template_tasks_code_format CHECK (code ~ '^[a-z][a-z0-9_]*$')
);

CREATE TABLE track_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id uuid NOT NULL REFERENCES tracks (id) ON DELETE CASCADE,
    source_template_task_id uuid REFERENCES workflow_template_tasks (id),
    phase text NOT NULL
        CHECK (phase IN ('planning', 'production', 'pre_track', 'track', 'post_track')),
    code text,
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
    due_at timestamptz,
    display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    is_required boolean NOT NULL DEFAULT true,
    completed_at timestamptz,
    completed_by_user_id uuid REFERENCES users (id),
    created_by_user_id uuid REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT track_tasks_completion_consistent CHECK (
        (status = 'done' AND completed_at IS NOT NULL AND completed_by_user_id IS NOT NULL)
        OR (status <> 'done' AND completed_at IS NULL AND completed_by_user_id IS NULL)
    )
);

CREATE UNIQUE INDEX track_tasks_code_idx
    ON track_tasks (track_id, code)
    WHERE code IS NOT NULL;
CREATE INDEX track_tasks_board_idx
    ON track_tasks (track_id, phase, status, display_order);
CREATE INDEX track_tasks_due_idx
    ON track_tasks (due_at)
    WHERE status NOT IN ('done', 'cancelled');

CREATE TABLE track_task_assignees (
    track_task_id uuid NOT NULL REFERENCES track_tasks (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users (id),
    assigned_by_user_id uuid REFERENCES users (id),
    assigned_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (track_task_id, user_id)
);

CREATE TABLE track_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id uuid NOT NULL REFERENCES tracks (id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (event_type IN ('milestone', 'meeting', 'hybrid_class', 'other')),
    title text NOT NULL,
    description text,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
    location_name text,
    room_name text,
    room_capacity integer CHECK (room_capacity IS NULL OR room_capacity > 0),
    external_reference text,
    created_by_user_id uuid NOT NULL REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT track_events_time_order CHECK (starts_at < ends_at),
    CONSTRAINT hybrid_class_room_required CHECK (
        event_type <> 'hybrid_class'
        OR (btrim(COALESCE(room_name, '')) <> '' AND room_capacity IS NOT NULL)
    )
);

CREATE INDEX track_events_calendar_idx ON track_events (starts_at, ends_at);
CREATE INDEX track_events_track_idx ON track_events (track_id, starts_at);

CREATE TABLE track_modules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id uuid NOT NULL REFERENCES tracks (id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    general_objective text,
    display_order integer NOT NULL CHECK (display_order > 0),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (track_id, display_order)
);

CREATE TABLE track_learning_units (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id uuid NOT NULL REFERENCES track_modules (id) ON DELETE CASCADE,
    title text NOT NULL,
    learning_objectives text,
    topic text,
    content text,
    assessment_strategy text,
    resources text,
    delivery_mode text NOT NULL CHECK (delivery_mode IN ('online_async', 'in_person')),
    workload_minutes integer NOT NULL CHECK (workload_minutes > 0),
    scheduled_event_id uuid REFERENCES track_events (id),
    display_order integer NOT NULL CHECK (display_order > 0),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (module_id, display_order),
    CONSTRAINT in_person_unit_event_required CHECK (
        (delivery_mode = 'in_person' AND scheduled_event_id IS NOT NULL)
        OR (delivery_mode = 'online_async' AND scheduled_event_id IS NULL)
    )
);

CREATE TABLE track_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id uuid NOT NULL REFERENCES tracks (id) ON DELETE CASCADE,
    requirement_type text NOT NULL
        CHECK (requirement_type IN ('software', 'equipment', 'infrastructure', 'other')),
    description text NOT NULL,
    is_mandatory boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE track_competencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id uuid NOT NULL REFERENCES tracks (id) ON DELETE CASCADE,
    competency_type text NOT NULL CHECK (competency_type IN ('technical', 'nontechnical')),
    description text NOT NULL,
    display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE track_external_resources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id uuid NOT NULL REFERENCES tracks (id) ON DELETE CASCADE,
    resource_type text NOT NULL
        CHECK (resource_type IN ('sharepoint', 'teams', 'registration_form', 'other')),
    name text NOT NULL,
    external_url text NOT NULL,
    external_id text,
    created_by_user_id uuid NOT NULL REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (track_id, resource_type, external_url)
);

CREATE OR REPLACE FUNCTION validate_track_event_modality()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    parent_modality text;
BEGIN
    SELECT modality INTO parent_modality FROM tracks WHERE id = NEW.track_id;
    IF NEW.event_type = 'hybrid_class' AND parent_modality <> 'hybrid' THEN
        RAISE EXCEPTION 'Only hybrid tracks may contain hybrid_class events';
    END IF;
    IF EXISTS (
        SELECT 1
          FROM track_learning_units tlu
          JOIN track_modules tm ON tm.id = tlu.module_id
         WHERE tlu.scheduled_event_id = NEW.id
           AND (NEW.event_type <> 'hybrid_class' OR tm.track_id <> NEW.track_id)
    ) THEN
        RAISE EXCEPTION 'An event linked to a learning unit must remain a hybrid class in the same track';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_track_modality_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.modality = 'online' AND NEW.modality IS DISTINCT FROM OLD.modality THEN
        IF EXISTS (
            SELECT 1 FROM track_events
             WHERE track_id = NEW.id AND event_type = 'hybrid_class'
        ) OR EXISTS (
            SELECT 1
              FROM track_modules tm
              JOIN track_learning_units tlu ON tlu.module_id = tm.id
             WHERE tm.track_id = NEW.id AND tlu.delivery_mode = 'in_person'
        ) THEN
            RAISE EXCEPTION 'A track with in-person classes or units cannot become online';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_track_module_move()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    destination_modality text;
BEGIN
    IF NEW.track_id IS NOT DISTINCT FROM OLD.track_id THEN
        RETURN NEW;
    END IF;
    SELECT modality INTO destination_modality FROM tracks WHERE id = NEW.track_id;
    IF EXISTS (
        SELECT 1
          FROM track_learning_units tlu
          LEFT JOIN track_events te ON te.id = tlu.scheduled_event_id
         WHERE tlu.module_id = NEW.id
           AND (
               (destination_modality = 'online' AND tlu.delivery_mode = 'in_person')
               OR (tlu.scheduled_event_id IS NOT NULL AND te.track_id <> NEW.track_id)
           )
    ) THEN
        RAISE EXCEPTION 'The module contains learning units incompatible with the destination track';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_learning_unit_modality()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    unit_track_id uuid;
    track_modality text;
    event_track_id uuid;
    linked_event_type text;
BEGIN
    SELECT tm.track_id, t.modality
      INTO unit_track_id, track_modality
      FROM track_modules tm
      JOIN tracks t ON t.id = tm.track_id
     WHERE tm.id = NEW.module_id;

    IF NEW.delivery_mode = 'in_person' AND track_modality <> 'hybrid' THEN
        RAISE EXCEPTION 'Only hybrid tracks may contain in-person learning units';
    END IF;

    IF NEW.scheduled_event_id IS NOT NULL THEN
        SELECT track_id, event_type
          INTO event_track_id, linked_event_type
          FROM track_events
         WHERE id = NEW.scheduled_event_id;
        IF event_track_id IS DISTINCT FROM unit_track_id OR linked_event_type <> 'hybrid_class' THEN
            RAISE EXCEPTION 'The learning unit event must be a hybrid class from the same track';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION instantiate_track_workflow()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    selected_template_id uuid;
BEGIN
    SELECT id
      INTO selected_template_id
      FROM workflow_templates
     WHERE is_default AND is_active
     ORDER BY version DESC
     LIMIT 1;

    IF selected_template_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO track_tasks (
        track_id,
        source_template_task_id,
        phase,
        code,
        title,
        description,
        due_at,
        display_order,
        is_required,
        created_by_user_id
    )
    SELECT NEW.id,
           wtt.id,
           wtt.phase,
           wtt.code,
           wtt.title,
           wtt.description,
           CASE
               WHEN wtt.default_due_offset_days IS NULL THEN NULL
               ELSE COALESCE(NEW.planned_production_starts_on, NEW.created_at::date)
                    + wtt.default_due_offset_days
           END,
           wtt.display_order,
           wtt.is_required,
           NEW.created_by_user_id
      FROM workflow_template_tasks wtt
     WHERE wtt.workflow_template_id = selected_template_id
     ORDER BY wtt.display_order;

    RETURN NEW;
END;
$$;

CREATE TRIGGER track_event_modality_guard
BEFORE INSERT OR UPDATE ON track_events
FOR EACH ROW EXECUTE FUNCTION validate_track_event_modality();

CREATE TRIGGER tracks_modality_transition_guard
BEFORE UPDATE OF modality ON tracks
FOR EACH ROW EXECUTE FUNCTION validate_track_modality_transition();

CREATE TRIGGER track_modules_move_guard
BEFORE UPDATE OF track_id ON track_modules
FOR EACH ROW EXECUTE FUNCTION validate_track_module_move();

CREATE TRIGGER learning_unit_modality_guard
BEFORE INSERT OR UPDATE ON track_learning_units
FOR EACH ROW EXECUTE FUNCTION validate_learning_unit_modality();

CREATE TRIGGER tracks_instantiate_workflow
AFTER INSERT ON tracks
FOR EACH ROW EXECUTE FUNCTION instantiate_track_workflow();

CREATE TRIGGER track_ideas_set_updated_at BEFORE UPDATE ON track_ideas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tracks_set_updated_at BEFORE UPDATE ON tracks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER track_team_members_set_updated_at BEFORE UPDATE ON track_team_members
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER track_tasks_set_updated_at BEFORE UPDATE ON track_tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER track_events_set_updated_at BEFORE UPDATE ON track_events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER track_modules_set_updated_at BEFORE UPDATE ON track_modules
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER track_learning_units_set_updated_at BEFORE UPDATE ON track_learning_units
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER track_requirements_set_updated_at BEFORE UPDATE ON track_requirements
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER track_competencies_set_updated_at BEFORE UPDATE ON track_competencies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER track_external_resources_set_updated_at BEFORE UPDATE ON track_external_resources
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER track_ideas_audit AFTER INSERT OR UPDATE OR DELETE ON track_ideas
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER tracks_audit AFTER INSERT OR UPDATE OR DELETE ON tracks
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER track_reuse_items_audit AFTER INSERT OR UPDATE OR DELETE ON track_reuse_items
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER track_team_members_audit AFTER INSERT OR UPDATE OR DELETE ON track_team_members
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER track_tasks_audit AFTER INSERT OR UPDATE OR DELETE ON track_tasks
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER track_events_audit AFTER INSERT OR UPDATE OR DELETE ON track_events
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER track_modules_audit AFTER INSERT OR UPDATE OR DELETE ON track_modules
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER track_learning_units_audit AFTER INSERT OR UPDATE OR DELETE ON track_learning_units
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER track_requirements_audit AFTER INSERT OR UPDATE OR DELETE ON track_requirements
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER track_competencies_audit AFTER INSERT OR UPDATE OR DELETE ON track_competencies
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER track_external_resources_audit AFTER INSERT OR UPDATE OR DELETE ON track_external_resources
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
