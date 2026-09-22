BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(condition boolean, message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF condition IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Assertion failed: %', message;
    END IF;
END;
$$;

INSERT INTO users (id, role_id, email, full_name, status) VALUES
    ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'coordinator@test.local', 'Test Coordinator', 'active'),
    ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'administrator@test.local', 'Test Administrator', 'active'),
    ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', 'mentor@test.local', 'Test Mentor', 'active'),
    ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004', 'monitor@test.local', 'Test Monitor', 'active');

INSERT INTO user_credentials (
    user_id, password_hash, is_temporary, must_change_password, temporary_password_expires_at
) VALUES
    ('10000000-0000-4000-8000-000000000001', 'test-hash-1', true, true, clock_timestamp() + interval '1 day'),
    ('10000000-0000-4000-8000-000000000002', 'test-hash-2', true, true, clock_timestamp() + interval '1 day'),
    ('10000000-0000-4000-8000-000000000003', 'test-hash-3', true, true, clock_timestamp() + interval '1 day'),
    ('10000000-0000-4000-8000-000000000004', 'test-hash-4', true, true, clock_timestamp() + interval '1 day');

SELECT pg_temp.assert_true(
    (SELECT must_change_password FROM user_credentials WHERE user_id = '10000000-0000-4000-8000-000000000003'),
    'temporary credentials must require a password change'
);

DO $$
BEGIN
    BEGIN
        INSERT INTO users (role_id, email, full_name, status)
        VALUES ('00000000-0000-4000-8000-000000000003', 'MENTOR@test.local', 'Duplicate Mentor', 'active');
        RAISE EXCEPTION 'Case-insensitive duplicate email was accepted';
    EXCEPTION WHEN unique_violation THEN
        NULL;
    END;

    BEGIN
        INSERT INTO user_credentials (user_id, password_hash, is_temporary, must_change_password)
        VALUES ('10000000-0000-4000-8000-000000000004', 'invalid', true, false);
        RAISE EXCEPTION 'Temporary password without mandatory change was accepted';
    EXCEPTION WHEN check_violation OR unique_violation THEN
        NULL;
    END;
END;
$$;

SELECT set_config('app.current_user_id', '10000000-0000-4000-8000-000000000003', true);
DO $$
DECLARE
    was_rejected boolean := false;
BEGIN
    BEGIN
        INSERT INTO users (role_id, email, full_name, status)
        VALUES ('00000000-0000-4000-8000-000000000004', 'forbidden@test.local', 'Forbidden User', 'active');
    EXCEPTION WHEN raise_exception THEN
        was_rejected := true;
    END;
    IF NOT was_rejected THEN
        RAISE EXCEPTION 'A mentor was allowed to create a user';
    END IF;
END;
$$;

SELECT set_config('app.current_user_id', '10000000-0000-4000-8000-000000000001', true);
INSERT INTO users (id, role_id, email, full_name, status, created_by_user_id)
VALUES (
    '10000000-0000-4000-8000-000000000005',
    '00000000-0000-4000-8000-000000000004',
    'created-by-coordinator@test.local',
    'Created by Coordinator',
    'active',
    '10000000-0000-4000-8000-000000000001'
);

INSERT INTO user_job_positions (
    user_id, job_position_id, starts_on, created_by_user_id
) VALUES (
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000103',
    CURRENT_DATE,
    '10000000-0000-4000-8000-000000000001'
);

DO $$
BEGIN
    BEGIN
        INSERT INTO user_job_positions (user_id, job_position_id, starts_on)
        VALUES (
            '10000000-0000-4000-8000-000000000003',
            '00000000-0000-4000-8000-000000000102',
            CURRENT_DATE
        );
        RAISE EXCEPTION 'Two current job positions were accepted';
    EXCEPTION WHEN unique_violation THEN
        NULL;
    END;
END;
$$;

INSERT INTO user_availability (user_id, weekday, starts_at, ends_at)
VALUES ('10000000-0000-4000-8000-000000000003', 1, '08:00', '12:00');

DO $$
DECLARE
    was_rejected boolean := false;
BEGIN
    BEGIN
        INSERT INTO user_availability (user_id, weekday, starts_at, ends_at)
        VALUES ('10000000-0000-4000-8000-000000000003', 1, '11:00', '13:00');
    EXCEPTION WHEN raise_exception THEN
        was_rejected := true;
    END;
    IF NOT was_rejected THEN
        RAISE EXCEPTION 'Overlapping user availability was accepted';
    END IF;
END;
$$;

INSERT INTO tracks (
    id, knowledge_area_id, category_id, title, modality, status,
    online_workload_minutes, in_person_workload_minutes, created_by_user_id
) VALUES (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000203',
    '00000000-0000-4000-8000-000000000301',
    'Online Test Track',
    'online',
    'planning',
    600,
    0,
    '10000000-0000-4000-8000-000000000003'
), (
    '20000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000203',
    '00000000-0000-4000-8000-000000000301',
    'Hybrid Test Track',
    'hybrid',
    'planning',
    480,
    120,
    '10000000-0000-4000-8000-000000000003'
);

-- A criação automática de documentos pertence ao TrackService. Como este teste exercita
-- o PostgreSQL diretamente, reproduzimos aqui a seleção dos templates publicados.
INSERT INTO track_documents (
    track_id, document_template_id, template_version_id,
    created_by_user_id, updated_by_user_id
)
SELECT t.id,
       selected.document_template_id,
       selected.id,
       t.created_by_user_id,
       t.created_by_user_id
  FROM tracks t
 CROSS JOIN LATERAL (
       SELECT DISTINCT ON (dtv.document_template_id)
              dtv.id, dtv.document_template_id
         FROM document_template_versions dtv
         JOIN document_templates dt ON dt.id = dtv.document_template_id
        WHERE dt.is_active
          AND dtv.is_published
        ORDER BY dtv.document_template_id, dtv.version DESC
 ) selected
 WHERE t.id IN (
     '20000000-0000-4000-8000-000000000001',
     '20000000-0000-4000-8000-000000000002'
 );

SELECT pg_temp.assert_true(
    (SELECT count(DISTINCT phase) = 5 FROM track_tasks WHERE track_id = '20000000-0000-4000-8000-000000000001'),
    'the default workflow must instantiate independent tasks in all five phases'
);
SELECT pg_temp.assert_true(
    (SELECT count(*) = 3 FROM track_documents WHERE track_id = '20000000-0000-4000-8000-000000000001'),
    'new tracks must receive all three initial document templates'
);

DO $$
DECLARE
    was_rejected boolean := false;
BEGIN
    BEGIN
        INSERT INTO track_events (
            track_id, event_type, title, starts_at, ends_at,
            room_name, room_capacity, created_by_user_id
        ) VALUES (
            '20000000-0000-4000-8000-000000000001',
            'hybrid_class',
            'Invalid synchronous online class',
            clock_timestamp() + interval '1 day',
            clock_timestamp() + interval '1 day 2 hours',
            'Room X',
            20,
            '10000000-0000-4000-8000-000000000002'
        );
    EXCEPTION WHEN raise_exception THEN
        was_rejected := true;
    END;
    IF NOT was_rejected THEN
        RAISE EXCEPTION 'An online track accepted a synchronous class';
    END IF;
END;
$$;

INSERT INTO track_events (
    id, track_id, event_type, title, starts_at, ends_at,
    location_name, room_name, room_capacity, created_by_user_id
) VALUES (
    '20000000-0000-4000-8000-000000000101',
    '20000000-0000-4000-8000-000000000002',
    'hybrid_class',
    'Valid in-person class',
    clock_timestamp() + interval '2 days',
    clock_timestamp() + interval '2 days 2 hours',
    'Faculty campus',
    'Room 101',
    30,
    '10000000-0000-4000-8000-000000000002'
);

INSERT INTO track_modules (id, track_id, title, display_order)
VALUES (
    '20000000-0000-4000-8000-000000000201',
    '20000000-0000-4000-8000-000000000002',
    'Test module',
    1
);
INSERT INTO track_learning_units (
    module_id, title, delivery_mode, workload_minutes, scheduled_event_id, display_order
) VALUES (
    '20000000-0000-4000-8000-000000000201',
    'In-person unit',
    'in_person',
    120,
    '20000000-0000-4000-8000-000000000101',
    1
);

DO $$
DECLARE
    was_rejected boolean := false;
BEGIN
    BEGIN
        UPDATE tracks
           SET modality = 'online',
               in_person_workload_minutes = 0
         WHERE id = '20000000-0000-4000-8000-000000000002';
    EXCEPTION WHEN raise_exception THEN
        was_rejected := true;
    END;
    IF NOT was_rejected THEN
        RAISE EXCEPTION 'A hybrid track with in-person content was converted to online';
    END IF;
END;
$$;

UPDATE track_tasks
   SET status = 'done',
       completed_at = clock_timestamp(),
       completed_by_user_id = '10000000-0000-4000-8000-000000000002'
 WHERE track_id = '20000000-0000-4000-8000-000000000001'
   AND code = 'send_production_kickoff_email';

SELECT pg_temp.assert_true(
    (SELECT bool_and(status = 'todo') FROM track_tasks
      WHERE track_id = '20000000-0000-4000-8000-000000000001' AND phase = 'production'),
    'completing a planning task must not advance production tasks'
);

INSERT INTO track_task_assignees (track_task_id, user_id, assigned_by_user_id)
SELECT id, '10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002'
  FROM track_tasks
 WHERE track_id = '20000000-0000-4000-8000-000000000001'
   AND code = 'produce_track_material';

SELECT pg_temp.assert_true(
    EXISTS (
        SELECT 1
          FROM notification_recipients nr
          JOIN notifications n ON n.id = nr.notification_id
         WHERE nr.user_id = '10000000-0000-4000-8000-000000000004'
           AND n.notification_type = 'task_assigned'
           AND nr.read_at IS NULL
    ),
    'assigning a task must create an unread individual notification'
);

DO $$
DECLARE
    proposal_document_id uuid;
    submitted_revision_id uuid;
    reconstructed jsonb;
    was_rejected boolean := false;
BEGIN
    SELECT td.id
      INTO proposal_document_id
      FROM track_documents td
      JOIN document_templates dt ON dt.id = td.document_template_id
     WHERE td.track_id = '20000000-0000-4000-8000-000000000001'
       AND dt.code = 'proposal_scope';

    PERFORM apply_document_change(
        proposal_document_id,
        'identification.presentation',
        'add',
        to_jsonb('A test proposal'::text),
        '10000000-0000-4000-8000-000000000003'
    );
    PERFORM apply_document_change(
        proposal_document_id,
        'execution.modality',
        'add',
        to_jsonb('online'::text),
        '10000000-0000-4000-8000-000000000003'
    );

    submitted_revision_id := submit_document_revision(
        proposal_document_id,
        '10000000-0000-4000-8000-000000000003',
        'Initial proposal'
    );
    reconstructed := reconstruct_document_revision(proposal_document_id, 1);

    IF reconstructed #>> '{identification,presentation}' <> 'A test proposal' THEN
        RAISE EXCEPTION 'Document revision replay did not reconstruct nested content';
    END IF;
    IF NOT EXISTS (
        SELECT 1
          FROM document_revision_changes
         WHERE document_revision_id = submitted_revision_id
           AND changed_by_user_id = '10000000-0000-4000-8000-000000000003'
    ) THEN
        RAISE EXCEPTION 'Document changes lost their author';
    END IF;

    BEGIN
        INSERT INTO document_revision_changes (
            document_revision_id, change_order, field_path, operation,
            old_value, new_value, changed_by_user_id
        ) VALUES (
            submitted_revision_id, 99, 'forbidden', 'add',
            NULL, 'true'::jsonb, '10000000-0000-4000-8000-000000000003'
        );
    EXCEPTION WHEN raise_exception THEN
        was_rejected := true;
    END;
    IF NOT was_rejected THEN
        RAISE EXCEPTION 'A submitted revision accepted a new change';
    END IF;

    INSERT INTO document_reviews (
        document_revision_id, reviewer_user_id, decision, comments
    ) VALUES (
        submitted_revision_id,
        '10000000-0000-4000-8000-000000000002',
        'approved',
        'Approved in schema test'
    );

    IF (SELECT status FROM track_documents WHERE id = proposal_document_id) <> 'approved' THEN
        RAISE EXCEPTION 'Administrative review did not update document status';
    END IF;
END;
$$;

INSERT INTO document_template_versions (
    id, document_template_id, version, schema_definition,
    change_notes, is_published, published_at
) VALUES (
    '30000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000501',
    2,
    '{"schema_version": 2, "sections": []}'::jsonb,
    'Schema test version',
    true,
    clock_timestamp()
);

DO $$
DECLARE
    proposal_document_id uuid;
    was_rejected boolean := false;
BEGIN
    SELECT td.id
      INTO proposal_document_id
      FROM track_documents td
      JOIN document_templates dt ON dt.id = td.document_template_id
     WHERE td.track_id = '20000000-0000-4000-8000-000000000001'
       AND dt.code = 'proposal_scope';
    BEGIN
        UPDATE track_documents
           SET template_version_id = '30000000-0000-4000-8000-000000000001'
         WHERE id = proposal_document_id;
    EXCEPTION WHEN raise_exception THEN
        was_rejected := true;
    END;
    IF NOT was_rejected THEN
        RAISE EXCEPTION 'An existing document accepted a newer template version';
    END IF;
END;
$$;

INSERT INTO tracks (
    id, knowledge_area_id, category_id, title, modality, status,
    online_workload_minutes, in_person_workload_minutes, created_by_user_id
) VALUES (
    '20000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000203',
    '00000000-0000-4000-8000-000000000301',
    'Template V2 Test Track',
    'online',
    'planning',
    300,
    0,
    '10000000-0000-4000-8000-000000000003'
);

INSERT INTO track_documents (
    track_id, document_template_id, template_version_id,
    created_by_user_id, updated_by_user_id
)
SELECT t.id,
       selected.document_template_id,
       selected.id,
       t.created_by_user_id,
       t.created_by_user_id
  FROM tracks t
 CROSS JOIN LATERAL (
       SELECT DISTINCT ON (dtv.document_template_id)
              dtv.id, dtv.document_template_id
         FROM document_template_versions dtv
         JOIN document_templates dt ON dt.id = dtv.document_template_id
        WHERE dt.is_active
          AND dtv.is_published
        ORDER BY dtv.document_template_id, dtv.version DESC
 ) selected
 WHERE t.id = '20000000-0000-4000-8000-000000000003';

SELECT pg_temp.assert_true(
    (
        SELECT dtv.version = 1
          FROM track_documents td
          JOIN document_templates dt ON dt.id = td.document_template_id
          JOIN document_template_versions dtv ON dtv.id = td.template_version_id
         WHERE td.track_id = '20000000-0000-4000-8000-000000000001'
           AND dt.code = 'proposal_scope'
    ),
    'a new template version must not alter existing track documents'
);
SELECT pg_temp.assert_true(
    (
        SELECT dtv.version = 2
          FROM track_documents td
          JOIN document_templates dt ON dt.id = td.document_template_id
          JOIN document_template_versions dtv ON dtv.id = td.template_version_id
         WHERE td.track_id = '20000000-0000-4000-8000-000000000003'
           AND dt.code = 'proposal_scope'
    ),
    'new tracks must receive the latest published template version'
);

UPDATE notification_recipients
   SET delivered_at = COALESCE(delivered_at, clock_timestamp()),
       read_at = clock_timestamp()
 WHERE user_id = '10000000-0000-4000-8000-000000000004'
   AND notification_id IN (
       SELECT id FROM notifications WHERE notification_type = 'task_assigned'
   );

SELECT pg_temp.assert_true(
    EXISTS (
        SELECT 1 FROM notification_recipients
         WHERE user_id = '10000000-0000-4000-8000-000000000004'
           AND read_at IS NOT NULL
    ),
    'notification read timestamps must be persisted'
);

SELECT pg_temp.assert_true(
    (SELECT count(*) = 12 FROM report_stages WHERE is_active),
    'the report export catalog must contain twelve stages'
);
SELECT pg_temp.assert_true(
    (SELECT count(*) = 177 FROM report_questions WHERE is_active),
    'the report export catalog must contain all one hundred and seventy-seven report questions'
);
SELECT pg_temp.assert_true(
    (
        SELECT count(softex_field_id) = 137
           AND count(DISTINCT softex_field_id) = 137
          FROM report_questions
         WHERE is_active
    ),
    'every Softex form field must map to exactly one report question'
);
SELECT pg_temp.assert_true(
    (SELECT count(*) = 12 FROM attachment_types WHERE is_active),
    'the report export catalog must contain twelve attachment types'
);
SELECT pg_temp.assert_true(
    (SELECT count(*) = 23 FROM question_attachment_types),
    'the question/type map must include the twenty-three configured operational relationships'
);
SELECT pg_temp.assert_true(
    (SELECT count(*) = 12 FROM report_stages WHERE is_active),
    'the export catalog must include all selectable report stages'
);
SELECT pg_temp.assert_true(
    (SELECT count(*) = 12 FROM attachment_types WHERE is_active),
    'the export catalog must include all twelve attachment types'
);
SELECT pg_temp.assert_true(
    EXISTS (
        SELECT 1
          FROM question_attachment_types qat
          JOIN report_questions rq ON rq.id = qat.report_question_id
          JOIN attachment_types at ON at.id = qat.attachment_type_id
         WHERE rq.code = 'M2.3_Q13'
           AND at.code = 'PESQUISA_SATISFACAO_OPINA_AI'
    ),
    'M2.3_Q13 must accept the Opina Aí survey attachment'
);
SELECT pg_temp.assert_true(
    NOT EXISTS (
        SELECT 1
          FROM question_attachment_types qat
          JOIN report_questions rq ON rq.id = qat.report_question_id
          JOIN attachment_types at ON at.id = qat.attachment_type_id
         WHERE (rq.code = 'M1.13_Q02' AND at.code = 'MATERIAL_INSTRUCIONAL_AMOSTRA')
            OR (rq.code = 'M1.13_Q15' AND at.code = 'ATIVIDADE_AVALIATIVA')
    ),
    'the attachment map must not keep the two obsolete M1.13 links'
);

DO $$
DECLARE
    softex_document_id uuid;
    annex_id uuid := '43000000-0000-4000-8000-000000000001';
    was_rejected boolean := false;
BEGIN
    SELECT td.id
      INTO softex_document_id
      FROM track_documents td
      JOIN document_templates dt ON dt.id = td.document_template_id
     WHERE td.track_id = '20000000-0000-4000-8000-000000000001'
       AND dt.code = 'softex_accountability_report';

    INSERT INTO report_annexes (
        id, track_document_id, report_stage_id, attachment_type_id,
        title, created_by_user_id
    ) VALUES (
        annex_id,
        softex_document_id,
        '40000000-0000-4000-8000-000000000114',
        '41000000-0000-4000-8000-000000000003',
        'Plano de ensino de teste',
        '10000000-0000-4000-8000-000000000003'
    );

    INSERT INTO file_assets (
        id, provider, storage_key, original_file_name, media_type,
        size_bytes, sha256, uploaded_by_user_id
    ) VALUES (
        '44000000-0000-4000-8000-000000000001',
        'local',
        'report-annexes/test/image.png',
        'image.png',
        'image/png',
        8,
        repeat('a', 64),
        '10000000-0000-4000-8000-000000000003'
    );

    INSERT INTO report_annex_images (
        id, report_annex_id, file_asset_id, display_order
    ) VALUES (
        '45000000-0000-4000-8000-000000000001',
        annex_id,
        '44000000-0000-4000-8000-000000000001',
        1
    );

    INSERT INTO question_annexes (
        report_question_id, report_annex_id, linked_by_user_id
    ) VALUES (
        '42000000-0000-4000-8000-000000000005',
        annex_id,
        '10000000-0000-4000-8000-000000000003'
    );

    INSERT INTO report_answers (
        track_document_id, report_question_id, answer,
        created_by_user_id, updated_by_user_id
    ) VALUES (
        softex_document_id,
        '42000000-0000-4000-8000-000000000005',
        'A trilha utilizou o plano de ensino aprovado.',
        '10000000-0000-4000-8000-000000000003',
        '10000000-0000-4000-8000-000000000003'
    );

    IF NOT EXISTS (
        SELECT 1
          FROM report_export_questions
         WHERE track_document_id = softex_document_id
           AND question_code = 'M1.14_Q06'
           AND answer = 'A trilha utilizou o plano de ensino aprovado.'
           AND annexes @> '[{"attachment_type_code":"PLANO_ENSINO"}]'::jsonb
    ) THEN
        RAISE EXCEPTION 'The export view must combine each answer with its annexes';
    END IF;

    BEGIN
        INSERT INTO question_annexes (
            report_question_id, report_annex_id, linked_by_user_id
        ) VALUES (
            '42000000-0000-4000-8000-000000000006',
            annex_id,
            '10000000-0000-4000-8000-000000000003'
        );
    EXCEPTION WHEN raise_exception THEN
        was_rejected := true;
    END;

    IF NOT was_rejected THEN
        RAISE EXCEPTION 'An annex was linked to a question that does not allow its type';
    END IF;
END;
$$;

ROLLBACK;
