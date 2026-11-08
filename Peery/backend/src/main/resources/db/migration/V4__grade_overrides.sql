CREATE TABLE grade_overrides (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id       BIGINT        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    student_id       BIGINT        NOT NULL REFERENCES users (id),
    instructor_id    BIGINT        NOT NULL REFERENCES users (id),
    action           VARCHAR(10)   NOT NULL,
    override_percent NUMERIC(5, 2),
    computed_percent NUMERIC(5, 2),
    reason           VARCHAR(1000) NOT NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_override_action CHECK (
        (action = 'SET' AND override_percent IS NOT NULL AND override_percent BETWEEN 0 AND 100)
        OR (action = 'REVOKE' AND override_percent IS NULL)
    ),
    CONSTRAINT chk_override_reason CHECK (char_length(btrim(reason)) >= 10)
);

CREATE INDEX idx_grade_overrides_lookup ON grade_overrides (project_id, student_id, id DESC);

-- Append-only: history can be added to but never edited. (Deletes only happen via project cascade.)
CREATE FUNCTION prevent_grade_override_update() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'grade_overrides is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_grade_overrides_no_update
    BEFORE UPDATE ON grade_overrides
    FOR EACH ROW EXECUTE FUNCTION prevent_grade_override_update();

ALTER TABLE grade_overrides ENABLE ROW LEVEL SECURITY;