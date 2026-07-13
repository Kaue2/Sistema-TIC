CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    active BOOLEAN NOT NULL,
    change_password BOOLEAN NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(role_id),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

INSERT INTO users (name, email, hashed_password, active, change_password, role_id, created_at)
VALUES ('John Doe', 'johndoe@email.com', 'stronghash', true, false, 1, '2026-07-08 14:30:00');
