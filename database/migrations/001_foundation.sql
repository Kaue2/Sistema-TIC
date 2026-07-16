CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY,
    name text NOT NULL,
    checksum_sha256 char(64) NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS data_seeds (
    version text PRIMARY KEY,
    name text NOT NULL,
    checksum_sha256 char(64) NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    hierarchy_level smallint NOT NULL UNIQUE CHECK (hierarchy_level > 0),
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT roles_code_format CHECK (code ~ '^[a-z][a-z0-9_]*$')
);

CREATE TABLE job_positions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT job_positions_code_format CHECK (code ~ '^[a-z][a-z0-9_]*$')
);

CREATE TABLE knowledge_areas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT knowledge_areas_code_format CHECK (code ~ '^[a-z][a-z0-9_]*$')
);

CREATE TABLE track_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT track_categories_code_format CHECK (code ~ '^[a-z][a-z0-9_]*$')
);

CREATE TABLE audit_events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id uuid,
    entity_schema text NOT NULL DEFAULT 'public',
    entity_type text NOT NULL,
    entity_id text,
    action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
    changes jsonb NOT NULL DEFAULT '{}'::jsonb,
    correlation_id uuid,
    occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX audit_events_entity_idx
    ON audit_events (entity_type, entity_id, occurred_at DESC);
CREATE INDEX audit_events_actor_idx
    ON audit_events (actor_user_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := clock_timestamp();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION current_actor_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    configured_actor text;
BEGIN
    configured_actor := current_setting('app.current_user_id', true);
    IF configured_actor IS NULL OR btrim(configured_actor) = '' THEN
        RETURN NULL;
    END IF;
    RETURN configured_actor::uuid;
EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'app.current_user_id must be a valid UUID';
END;
$$;

CREATE OR REPLACE FUNCTION jsonb_object_diff(old_value jsonb, new_value jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT COALESCE(
        jsonb_object_agg(key, jsonb_build_object('old', old_item, 'new', new_item)),
        '{}'::jsonb
    )
    FROM (
        SELECT key,
               old_value -> key AS old_item,
               new_value -> key AS new_item
        FROM (
            SELECT jsonb_object_keys(COALESCE(old_value, '{}'::jsonb)) AS key
            UNION
            SELECT jsonb_object_keys(COALESCE(new_value, '{}'::jsonb)) AS key
        ) keys
        WHERE (old_value -> key) IS DISTINCT FROM (new_value -> key)
    ) changed;
$$;

CREATE OR REPLACE FUNCTION audit_row_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    old_row jsonb;
    new_row jsonb;
    row_id text;
    change_set jsonb;
BEGIN
    IF TG_OP = 'INSERT' THEN
        new_row := to_jsonb(NEW);
        row_id := new_row ->> 'id';
        change_set := new_row;
    ELSIF TG_OP = 'UPDATE' THEN
        old_row := to_jsonb(OLD);
        new_row := to_jsonb(NEW);
        row_id := COALESCE(new_row ->> 'id', old_row ->> 'id');
        change_set := jsonb_object_diff(old_row, new_row);
        IF change_set = '{}'::jsonb THEN
            RETURN NEW;
        END IF;
    ELSE
        old_row := to_jsonb(OLD);
        row_id := old_row ->> 'id';
        change_set := old_row;
    END IF;

    INSERT INTO audit_events (
        actor_user_id,
        entity_schema,
        entity_type,
        entity_id,
        action,
        changes,
        correlation_id
    ) VALUES (
        current_actor_id(),
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        row_id,
        lower(TG_OP),
        change_set,
        NULLIF(current_setting('app.correlation_id', true), '')::uuid
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER job_positions_set_updated_at
BEFORE UPDATE ON job_positions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER knowledge_areas_set_updated_at
BEFORE UPDATE ON knowledge_areas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER track_categories_set_updated_at
BEFORE UPDATE ON track_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER roles_audit
AFTER INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION audit_row_change();

CREATE TRIGGER job_positions_audit
AFTER INSERT OR UPDATE OR DELETE ON job_positions
FOR EACH ROW EXECUTE FUNCTION audit_row_change();

CREATE TRIGGER knowledge_areas_audit
AFTER INSERT OR UPDATE OR DELETE ON knowledge_areas
FOR EACH ROW EXECUTE FUNCTION audit_row_change();

CREATE TRIGGER track_categories_audit
AFTER INSERT OR UPDATE OR DELETE ON track_categories
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
