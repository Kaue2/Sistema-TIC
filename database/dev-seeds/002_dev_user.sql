-- Usuário FAKE de desenvolvimento local. NUNCA aplicar em um banco de produção.
--
-- Role 'coordinator': maior nível de acesso do sistema hoje.
--
-- Idempotente por construção, igual ao 001_fake_members.sql. Aplicado automaticamente
-- pela Api em ambiente Development (ver Program.cs), então normalmente você não precisa
-- rodar isso à mão. Se quiser aplicar manualmente mesmo assim:
--   docker exec -i sistematic-postgres psql -U <POSTGRES_USER> -d <POSTGRES_DB> -f /database/dev-seeds/002_dev_user.sql
--
-- Login: dev@fake.dev / senha: Senha@123

INSERT INTO users (id, role_id, email, full_name, status)
SELECT 'f0000000-0000-4000-8000-000000000099', r.id, 'dev@fake.dev', 'Dev Local', 'active'
FROM roles r
WHERE r.code = 'coordinator'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'dev@fake.dev');

INSERT INTO user_credentials (user_id, password_hash, is_temporary, must_change_password)
SELECT id, crypt('Senha@123', gen_salt('bf')), false, false
FROM users
WHERE id = 'f0000000-0000-4000-8000-000000000099'
AND NOT EXISTS (SELECT 1 FROM user_credentials WHERE user_credentials.user_id = users.id);

INSERT INTO user_contacts (user_id, contact_type, contact_value, label, is_primary)
SELECT 'f0000000-0000-4000-8000-000000000099', 'email', 'dev.admin@fake.dev', 'Email Administrativo', true
WHERE NOT EXISTS (SELECT 1 FROM user_contacts WHERE user_id = 'f0000000-0000-4000-8000-000000000099' AND contact_value = 'dev.admin@fake.dev');
