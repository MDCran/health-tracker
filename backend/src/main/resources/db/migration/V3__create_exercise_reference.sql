CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE exercise (
    id                  BIGSERIAL PRIMARY KEY,
    external_id         VARCHAR(200) UNIQUE,
    name                VARCHAR(200) NOT NULL,
    force_type          VARCHAR(20),
    level               VARCHAR(20),
    mechanic            VARCHAR(20),
    equipment           VARCHAR(50),
    category            VARCHAR(30),
    primary_muscles     VARCHAR(50)[] NOT NULL DEFAULT '{}',
    secondary_muscles   VARCHAR(50)[] DEFAULT '{}',
    instructions        TEXT[] DEFAULT '{}',
    image_paths         TEXT[] DEFAULT '{}',
    is_custom           BOOLEAN NOT NULL DEFAULT false,
    user_id             BIGINT REFERENCES app_user(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercise_name_trgm ON exercise USING gin (name gin_trgm_ops);
CREATE INDEX idx_exercise_category ON exercise(category);
CREATE INDEX idx_exercise_primary_muscles ON exercise USING gin (primary_muscles);