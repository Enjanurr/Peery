CREATE TABLE users (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('STUDENT', 'INSTRUCTOR')),
    CONSTRAINT chk_users_email_lower CHECK (email = LOWER(email))
);

-- Supabase exposes public tables via its REST API. RLS with no policies blocks that route;
-- the backend connects as the postgres role, which bypasses RLS.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;