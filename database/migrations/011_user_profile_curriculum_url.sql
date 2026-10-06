-- 011: adiciona curriculum_url ao perfil do usuário (Mini Currículo).
ALTER TABLE user_profiles
    ADD COLUMN curriculum_url text;