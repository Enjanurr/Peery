CREATE TABLE criteria (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id    BIGINT       NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    description   VARCHAR(500),
    min_score     INT          NOT NULL DEFAULT 1,
    max_score     INT          NOT NULL DEFAULT 5,
    display_order INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_criteria_project_name UNIQUE (project_id, name),
    CONSTRAINT chk_criteria_range CHECK (max_score > min_score)
);

CREATE TABLE evaluations (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id   BIGINT        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    evaluator_id BIGINT        NOT NULL REFERENCES users (id),
    evaluatee_id BIGINT        NOT NULL REFERENCES users (id),
    comment      VARCHAR(1000),
    submitted_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ,
    version      BIGINT        NOT NULL DEFAULT 0,
    -- one evaluation per (project, evaluator, evaluatee)
    CONSTRAINT uq_evaluation_pairing UNIQUE (project_id, evaluator_id, evaluatee_id),
    CONSTRAINT chk_evaluation_not_self CHECK (evaluator_id <> evaluatee_id)
);

CREATE INDEX idx_evaluations_evaluator ON evaluations (project_id, evaluator_id);
CREATE INDEX idx_evaluations_evaluatee ON evaluations (project_id, evaluatee_id);

CREATE TABLE evaluation_scores (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    evaluation_id BIGINT NOT NULL REFERENCES evaluations (id) ON DELETE CASCADE,
    criterion_id  BIGINT NOT NULL REFERENCES criteria (id),
    score         INT    NOT NULL,
    CONSTRAINT uq_score_evaluation_criterion UNIQUE (evaluation_id, criterion_id)
);

-- Block Supabase's public REST API; the backend connects as the postgres role (bypasses RLS)
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_scores ENABLE ROW LEVEL SECURITY;