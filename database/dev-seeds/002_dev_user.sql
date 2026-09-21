-- Usuário FAKE de desenvolvimento local. NUNCA aplicar em um banco de produção.
--
-- Role 'coordinator': maior nível de acesso do sistema hoje.
--
-- Idempotente por construção, igual ao 001_fake_members.sql (usa ON CONFLICT em vez de
-- NOT EXISTS pra também corrigir um banco local que já tinha o usuário antigo dev@fake.dev
-- nesse mesmo id). Aplicado automaticamente pela Api em ambiente Development (ver
-- Program.cs), então normalmente você não precisa rodar isso à mão. Se quiser aplicar
-- manualmente mesmo assim:
--   docker exec -i sistematic-postgres psql -U <POSTGRES_USER> -d <POSTGRES_DB> -f /database/dev-seeds/002_dev_user.sql
--
-- Login: julio.cpaiva@senacsp.com / senha: senha123

INSERT INTO users (id, role_id, email, full_name, status)
SELECT 'f0000000-0000-4000-8000-000000000099', r.id, 'julio.cpaiva@senacsp.com', 'Julio', 'active'
FROM roles r
WHERE r.code = 'coordinator'
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

INSERT INTO user_credentials (user_id, password_hash, is_temporary, must_change_password)
SELECT 'f0000000-0000-4000-8000-000000000099', crypt('senha123', gen_salt('bf')), false, false
ON CONFLICT (user_id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    is_temporary = EXCLUDED.is_temporary,
    must_change_password = EXCLUDED.must_change_password;

DELETE FROM user_contacts
 WHERE user_id = 'f0000000-0000-4000-8000-000000000099'
   AND contact_type = 'email';

INSERT INTO user_contacts (user_id, contact_type, contact_value, label, is_primary)
VALUES ('f0000000-0000-4000-8000-000000000099', 'email', 'julio.cpaiva@senacsp.com', 'Email Administrativo', true);

-- sem isso o usuário fica sem linha em user_profiles, e qualquer feature que dependa dela
-- (ex: foto de perfil) quebra pra esse usuário fake.
INSERT INTO user_profiles (user_id)
VALUES ('f0000000-0000-4000-8000-000000000099')
ON CONFLICT (user_id) DO NOTHING;
