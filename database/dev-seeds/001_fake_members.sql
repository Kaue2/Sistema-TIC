-- Dados FAKE para desenvolvimento local. NUNCA aplicar em um banco de produção.
--
-- Diferente de database/seeds/ (dados de referência reais: roles, catálogos, templates),
-- isto aqui é gente e agenda inventadas só pra ter o que listar nas telas de Membros/Perfil
-- enquanto o front ainda usa mock em outras partes.
--
-- Idempotente por construção: cada INSERT é condicionado a "ainda não existe" pela chave de
-- negócio (email do usuário, etc.), então rodar este arquivo de novo não duplica nada.
-- Não está integrado ao apply-migrations.ps1 de propósito — aplique manualmente quando quiser:
--   docker exec -i sistematic-postgres psql -U <POSTGRES_USER> -d <POSTGRES_DB> -f /database/dev-seeds/001_fake_members.sql
--
-- Todos os usuários fake nascem com a senha: Senha@123

INSERT INTO users (id, role_id, email, full_name, status)
SELECT 'f0000000-0000-4000-8000-000000000001', r.id, 'ana.coordenadora@fake.dev', 'Ana Coordenadora', 'active'
FROM roles r
WHERE r.code = 'coordinator'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'ana.coordenadora@fake.dev');

INSERT INTO users (id, role_id, email, full_name, status)
SELECT 'f0000000-0000-4000-8000-000000000002', r.id, 'bruno.administrador@fake.dev', 'Bruno Administrador', 'active'
FROM roles r
WHERE r.code = 'administrator'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'bruno.administrador@fake.dev');

INSERT INTO users (id, role_id, email, full_name, status)
SELECT 'f0000000-0000-4000-8000-000000000003', r.id, 'carla.mentora@fake.dev', 'Carla Mentora', 'active'
FROM roles r
WHERE r.code = 'mentor'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'carla.mentora@fake.dev');

INSERT INTO users (id, role_id, email, full_name, status)
SELECT 'f0000000-0000-4000-8000-000000000004', r.id, 'diego.monitor@fake.dev', 'Diego Monitor', 'active'
FROM roles r
WHERE r.code = 'monitor'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'diego.monitor@fake.dev');

-- credenciais (todos com a mesma senha fake, hash gerado direto no banco via pgcrypto)
INSERT INTO user_credentials (user_id, password_hash, is_temporary, must_change_password)
SELECT id, crypt('Senha@123', gen_salt('bf')), false, false
FROM users
WHERE id IN (
    'f0000000-0000-4000-8000-000000000001',
    'f0000000-0000-4000-8000-000000000002',
    'f0000000-0000-4000-8000-000000000003',
    'f0000000-0000-4000-8000-000000000004'
)
AND NOT EXISTS (SELECT 1 FROM user_credentials WHERE user_credentials.user_id = users.id);

-- contato administrativo (o que a tela de Membros mostra como e-mail principal)
INSERT INTO user_contacts (user_id, contact_type, contact_value, label, is_primary)
SELECT 'f0000000-0000-4000-8000-000000000001', 'email', 'ana.admin@fake.dev', 'Email Administrativo', true
WHERE NOT EXISTS (SELECT 1 FROM user_contacts WHERE user_id = 'f0000000-0000-4000-8000-000000000001' AND contact_value = 'ana.admin@fake.dev');

INSERT INTO user_contacts (user_id, contact_type, contact_value, label, is_primary)
SELECT 'f0000000-0000-4000-8000-000000000002', 'email', 'bruno.admin@fake.dev', 'Email Administrativo', true
WHERE NOT EXISTS (SELECT 1 FROM user_contacts WHERE user_id = 'f0000000-0000-4000-8000-000000000002' AND contact_value = 'bruno.admin@fake.dev');

INSERT INTO user_contacts (user_id, contact_type, contact_value, label, is_primary)
SELECT 'f0000000-0000-4000-8000-000000000003', 'email', 'carla.admin@fake.dev', 'Email Administrativo', true
WHERE NOT EXISTS (SELECT 1 FROM user_contacts WHERE user_id = 'f0000000-0000-4000-8000-000000000003' AND contact_value = 'carla.admin@fake.dev');

INSERT INTO user_contacts (user_id, contact_type, contact_value, label, is_primary)
SELECT 'f0000000-0000-4000-8000-000000000004', 'email', 'diego.admin@fake.dev', 'Email Administrativo', true
WHERE NOT EXISTS (SELECT 1 FROM user_contacts WHERE user_id = 'f0000000-0000-4000-8000-000000000004' AND contact_value = 'diego.admin@fake.dev');

-- perfil (local de trabalho, carga horária semanal)
INSERT INTO user_profiles (user_id, work_location, weekly_workload_minutes, lattes_url)
SELECT 'f0000000-0000-4000-8000-000000000001', 'E101', 2400, 'https://lattes.cnpq.br/fake-ana'
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = 'f0000000-0000-4000-8000-000000000001');

INSERT INTO user_profiles (user_id, work_location, weekly_workload_minutes, lattes_url)
SELECT 'f0000000-0000-4000-8000-000000000002', 'E102', 2400, NULL
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = 'f0000000-0000-4000-8000-000000000002');

INSERT INTO user_profiles (user_id, work_location, weekly_workload_minutes, lattes_url)
SELECT 'f0000000-0000-4000-8000-000000000003', 'E103', 1200, 'https://lattes.cnpq.br/fake-carla'
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = 'f0000000-0000-4000-8000-000000000003');

INSERT INTO user_profiles (user_id, work_location, weekly_workload_minutes, lattes_url)
SELECT 'f0000000-0000-4000-8000-000000000004', 'E104', 720, NULL
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = 'f0000000-0000-4000-8000-000000000004');

-- disponibilidade semanal (weekday: 0=domingo ... 6=sábado)
INSERT INTO user_availability (user_id, weekday, starts_at, ends_at)
SELECT 'f0000000-0000-4000-8000-000000000001', weekday, '08:00', '12:00'
FROM unnest(ARRAY[1, 2, 3, 4, 5]) AS weekday
WHERE NOT EXISTS (
    SELECT 1 FROM user_availability
    WHERE user_id = 'f0000000-0000-4000-8000-000000000001' AND user_availability.weekday = weekday
);

INSERT INTO user_availability (user_id, weekday, starts_at, ends_at)
SELECT 'f0000000-0000-4000-8000-000000000002', weekday, '09:00', '18:00'
FROM unnest(ARRAY[1, 2, 3, 4, 5]) AS weekday
WHERE NOT EXISTS (
    SELECT 1 FROM user_availability
    WHERE user_id = 'f0000000-0000-4000-8000-000000000002' AND user_availability.weekday = weekday
);

INSERT INTO user_availability (user_id, weekday, starts_at, ends_at)
SELECT 'f0000000-0000-4000-8000-000000000003', weekday, '13:00', '19:00'
FROM unnest(ARRAY[2, 4]) AS weekday
WHERE NOT EXISTS (
    SELECT 1 FROM user_availability
    WHERE user_id = 'f0000000-0000-4000-8000-000000000003' AND user_availability.weekday = weekday
);

INSERT INTO user_availability (user_id, weekday, starts_at, ends_at)
SELECT 'f0000000-0000-4000-8000-000000000004', weekday, '14:00', '18:00'
FROM unnest(ARRAY[1, 3, 5]) AS weekday
WHERE NOT EXISTS (
    SELECT 1 FROM user_availability
    WHERE user_id = 'f0000000-0000-4000-8000-000000000004' AND user_availability.weekday = weekday
);
