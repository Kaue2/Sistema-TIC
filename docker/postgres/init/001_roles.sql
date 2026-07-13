CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(100) NOT NULL
);

INSERT INTO roles (code, name, description) VALUES ('001', 'administrativo', 'funcionários ligados a administração das trilhas');
