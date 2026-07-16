CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id uuid NOT NULL REFERENCES roles (id),
    email citext NOT NULL UNIQUE,
    full_name text NOT NULL,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'disabled')),
    created_by_user_id uuid REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    disabled_at timestamptz,
    CONSTRAINT users_email_not_blank CHECK (btrim(email::text) <> ''),
    CONSTRAINT users_full_name_not_blank CHECK (btrim(full_name) <> ''),
    CONSTRAINT users_disabled_state_consistent CHECK (
        (status = 'disabled' AND disabled_at IS NOT NULL)
        OR (status <> 'disabled' AND disabled_at IS NULL)
    )
);

CREATE TABLE user_credentials (
    user_id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    password_hash text NOT NULL,
    is_temporary boolean NOT NULL DEFAULT true,
    must_change_password boolean NOT NULL DEFAULT true,
    temporary_password_expires_at timestamptz,
    password_changed_at timestamptz,
    failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    locked_until timestamptz,
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT temporary_password_requires_change CHECK (
        NOT is_temporary OR must_change_password
    )
);

CREATE TABLE file_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL
        CHECK (provider IN ('local', 'object_storage', 'sharepoint', 'teams', 'external')),
    storage_key text,
    external_url text,
    original_file_name text NOT NULL,
    media_type text,
    size_bytes bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
    sha256 char(64),
    uploaded_by_user_id uuid REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    deleted_at timestamptz,
    CONSTRAINT file_assets_location_present CHECK (
        storage_key IS NOT NULL OR external_url IS NOT NULL
    ),
    CONSTRAINT file_assets_sha256_format CHECK (
        sha256 IS NULL OR sha256 ~ '^[0-9a-fA-F]{64}$'
    )
);

CREATE TABLE user_profiles (
    user_id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    preferred_name text,
    photo_file_id uuid REFERENCES file_assets (id),
    work_location text,
    weekly_workload_minutes integer
        CHECK (weekly_workload_minutes IS NULL OR weekly_workload_minutes BETWEEN 0 AND 10080),
    biography text,
    lattes_url text,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE user_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    contact_type text NOT NULL CHECK (contact_type IN ('email', 'phone', 'whatsapp', 'other')),
    contact_value text NOT NULL,
    label text,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT user_contacts_value_not_blank CHECK (btrim(contact_value) <> ''),
    UNIQUE (user_id, contact_type, contact_value)
);

CREATE UNIQUE INDEX user_contacts_one_primary_per_type_idx
    ON user_contacts (user_id, contact_type)
    WHERE is_primary;

CREATE TABLE user_availability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    starts_at time NOT NULL,
    ends_at time NOT NULL,
    timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
    valid_from date,
    valid_until date,
    notes text,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT user_availability_time_order CHECK (starts_at < ends_at),
    CONSTRAINT user_availability_date_order CHECK (
        valid_until IS NULL OR valid_from IS NULL OR valid_from <= valid_until
    )
);

CREATE INDEX user_availability_user_weekday_idx
    ON user_availability (user_id, weekday, starts_at);

CREATE TABLE user_job_positions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    job_position_id uuid NOT NULL REFERENCES job_positions (id),
    starts_on date NOT NULL,
    ends_on date,
    notes text,
    created_by_user_id uuid REFERENCES users (id),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT user_job_positions_date_order CHECK (ends_on IS NULL OR starts_on <= ends_on)
);

CREATE UNIQUE INDEX user_job_positions_one_current_idx
    ON user_job_positions (user_id)
    WHERE ends_on IS NULL;

CREATE TABLE user_import_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_file_id uuid REFERENCES file_assets (id),
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'completed_with_errors', 'failed')),
    total_rows integer NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
    successful_rows integer NOT NULL DEFAULT 0 CHECK (successful_rows >= 0),
    failed_rows integer NOT NULL DEFAULT 0 CHECK (failed_rows >= 0),
    imported_by_user_id uuid NOT NULL REFERENCES users (id),
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT user_import_batch_totals_valid CHECK (
        successful_rows + failed_rows <= total_rows
    )
);

CREATE TABLE user_import_rows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id uuid NOT NULL REFERENCES user_import_batches (id) ON DELETE CASCADE,
    row_number integer NOT NULL CHECK (row_number > 0),
    raw_data jsonb NOT NULL,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'imported', 'rejected')),
    imported_user_id uuid REFERENCES users (id),
    error_messages jsonb NOT NULL DEFAULT '[]'::jsonb,
    processed_at timestamptz,
    UNIQUE (batch_id, row_number),
    CONSTRAINT user_import_rows_errors_array CHECK (jsonb_typeof(error_messages) = 'array')
);

ALTER TABLE audit_events
    ADD CONSTRAINT audit_events_actor_user_fk
    FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION enforce_user_role_management()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    actor uuid;
    actor_role text;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.role_id IS NOT DISTINCT FROM OLD.role_id THEN
        RETURN NEW;
    END IF;

    actor := current_actor_id();
    IF actor IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT r.code
      INTO actor_role
      FROM users u
      JOIN roles r ON r.id = u.role_id
     WHERE u.id = actor
       AND u.status = 'active';

    IF actor_role IS DISTINCT FROM 'coordinator' THEN
        RAISE EXCEPTION 'Only an active coordinator may create users or change roles';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_overlapping_availability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM user_availability ua
         WHERE ua.user_id = NEW.user_id
           AND ua.weekday = NEW.weekday
           AND ua.id IS DISTINCT FROM NEW.id
           AND ua.starts_at < NEW.ends_at
           AND NEW.starts_at < ua.ends_at
           AND daterange(
                 COALESCE(ua.valid_from, '-infinity'::date),
                 COALESCE(ua.valid_until + 1, 'infinity'::date),
                 '[)'
               ) && daterange(
                 COALESCE(NEW.valid_from, '-infinity'::date),
                 COALESCE(NEW.valid_until + 1, 'infinity'::date),
                 '[)'
               )
    ) THEN
        RAISE EXCEPTION 'Availability intervals overlap for this user and weekday';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER users_role_management_guard
BEFORE INSERT OR UPDATE OF role_id ON users
FOR EACH ROW EXECUTE FUNCTION enforce_user_role_management();

CREATE TRIGGER user_availability_overlap_guard
BEFORE INSERT OR UPDATE ON user_availability
FOR EACH ROW EXECUTE FUNCTION prevent_overlapping_availability();

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER user_credentials_set_updated_at
BEFORE UPDATE ON user_credentials
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER user_profiles_set_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER user_contacts_set_updated_at
BEFORE UPDATE ON user_contacts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER user_availability_set_updated_at
BEFORE UPDATE ON user_availability
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER user_job_positions_set_updated_at
BEFORE UPDATE ON user_job_positions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER users_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER file_assets_audit
AFTER INSERT OR UPDATE OR DELETE ON file_assets
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER user_profiles_audit
AFTER INSERT OR UPDATE OR DELETE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER user_contacts_audit
AFTER INSERT OR UPDATE OR DELETE ON user_contacts
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER user_availability_audit
AFTER INSERT OR UPDATE OR DELETE ON user_availability
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER user_job_positions_audit
AFTER INSERT OR UPDATE OR DELETE ON user_job_positions
FOR EACH ROW EXECUTE FUNCTION audit_row_change();
