-- Semestre letivo da trilha no formato AAAA/S (ex.: 2026/1, 2026/2), informado na criação.
-- Trilhas já existentes recebem o semestre da data de início planejada (ou da criação, se não houver).
ALTER TABLE tracks ADD COLUMN semester text;

UPDATE tracks
SET semester = to_char(d, 'YYYY') || '/' || CASE WHEN extract(month FROM d) <= 6 THEN '1' ELSE '2' END
FROM (
    SELECT id, COALESCE(planned_track_starts_on, created_at::date) AS d
    FROM tracks
) AS source
WHERE tracks.id = source.id;

ALTER TABLE tracks ALTER COLUMN semester SET NOT NULL;
ALTER TABLE tracks ADD CONSTRAINT tracks_semester_format CHECK (semester ~ '^[0-9]{4}/[12]$');
