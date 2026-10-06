-- Capture the readable track code before migration 007 replaces it with an identity.
-- On databases where 007 has already run, add the column for a consistent schema;
-- the original values can only be recovered from a pre-007 backup.
DO $$
DECLARE
    track_code_type text;
BEGIN
    ALTER TABLE tracks
        ADD COLUMN IF NOT EXISTS legacy_code citext;

    SELECT udt_name
      INTO track_code_type
      FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'tracks'
       AND column_name = 'code';

    IF track_code_type = 'citext' THEN
        UPDATE tracks
           SET legacy_code = code
         WHERE legacy_code IS NULL;
    END IF;
END;
$$;
