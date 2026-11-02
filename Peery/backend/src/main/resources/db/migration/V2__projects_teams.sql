CREATE TABLE projects (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    instructor_id   BIGINT        NOT NULL REFERENCES users (id),
    title           VARCHAR(150)  NOT NULL,
    description     VARCHAR(2000),
    eval_start_date TIMESTAMPTZ   NOT NULL,
    eval_end_date   TIMESTAMPTZ   NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_projects_eval_window CHECK (eval_end_date > eval_start_date)
);

CREATE INDEX idx_projects_instructor ON projects (instructor_id);

CREATE TABLE teams (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id BIGINT       NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_teams_id_project UNIQUE (id, project_id)
);

-- Team names are unique per project, ignoring case
CREATE UNIQUE INDEX uq_teams_project_name ON teams (project_id, LOWER(name));

CREATE TABLE team_members (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    team_id    BIGINT      NOT NULL,
    project_id BIGINT      NOT NULL,
    student_id BIGINT      NOT NULL REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- the composite FK guarantees the member's project_id matches the team's project
    CONSTRAINT fk_team_members_team FOREIGN KEY (team_id, project_id)
        REFERENCES teams (id, project_id) ON DELETE CASCADE,
    -- one team per student per project
    CONSTRAINT uq_team_members_project_student UNIQUE (project_id, student_id)
);

CREATE INDEX idx_team_members_team ON team_members (team_id);
CREATE INDEX idx_team_members_student ON team_members (student_id);

-- Block Supabase's public REST API; the backend connects as the postgres role (bypasses RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;