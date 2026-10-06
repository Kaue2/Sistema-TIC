-- Alinha o guard de papéis (criado na 002) com a regra de negócio da API.
-- Até aqui o backend quase nunca informava o ator (app.current_user_id) ao banco, e o guard
-- libera a operação quando não há ator, então ele nunca barrava ninguém na prática. Com o
-- backend passando a informar o ator nos caminhos de usuário e trilha, o guard passa a valer.
-- Para não bloquear o que a API já permite (change-role é liberado a coordenador e
-- administrador), a regra fica assim:
--   * criar usuário (INSERT): apenas coordenador ativo;
--   * alterar o papel de um usuário (UPDATE de role_id): coordenador ou administrador ativo.
-- Sem ator (migrations, seeds, scripts de manutenção), continua liberado.
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

    IF TG_OP = 'INSERT' THEN
        IF actor_role IS DISTINCT FROM 'coordinator' THEN
            RAISE EXCEPTION 'Only an active coordinator may create users';
        END IF;
    ELSIF actor_role IS NULL OR actor_role NOT IN ('coordinator', 'administrator') THEN
        RAISE EXCEPTION 'Only an active coordinator or administrator may change roles';
    END IF;

    RETURN NEW;
END;
$$;

-- A auditoria identificava a linha alterada só pela coluna "id". user_profiles tem como chave
-- primária user_id (não possui "id"), então suas linhas de auditoria ficavam com entity_id
-- vazio e não dava para saber qual perfil foi alterado. Agora, sem "id", usa-se user_id.
-- Linhas de auditoria antigas não são reescritas.
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
        row_id := COALESCE(new_row ->> 'id', new_row ->> 'user_id');
        change_set := new_row;
    ELSIF TG_OP = 'UPDATE' THEN
        old_row := to_jsonb(OLD);
        new_row := to_jsonb(NEW);
        row_id := COALESCE(new_row ->> 'id', old_row ->> 'id', new_row ->> 'user_id', old_row ->> 'user_id');
        change_set := jsonb_object_diff(old_row, new_row);
        IF change_set = '{}'::jsonb THEN
            RETURN NEW;
        END IF;
    ELSE
        old_row := to_jsonb(OLD);
        row_id := COALESCE(old_row ->> 'id', old_row ->> 'user_id');
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
