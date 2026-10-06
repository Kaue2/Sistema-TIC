-- Refresh tokens da autenticação: o access token (JWT) passa a ter vida curta e o cliente o renova
-- com um refresh token de uso único (rotação a cada renovação). Só o hash SHA-256 do token é
-- guardado, nunca o valor que o cliente recebe.
CREATE TABLE refresh_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash char(64) NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    CONSTRAINT refresh_tokens_expiry_after_creation CHECK (expires_at > created_at)
);

CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id);
