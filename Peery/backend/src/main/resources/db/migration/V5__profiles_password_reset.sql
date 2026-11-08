CREATE TABLE user_profiles (
    user_id        BIGINT       PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    student_number VARCHAR(50),
    program        VARCHAR(100),
    employee_code  VARCHAR(50),
    department     VARCHAR(100),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,   -- SHA-256 hex of the emailed token; the raw token is never stored
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens (user_id, created_at DESC);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;