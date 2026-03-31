CREATE TABLE progress_photo (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT       NOT NULL REFERENCES app_user(id),
    workout_session_id  BIGINT       REFERENCES workout_session(id),
    file_path           VARCHAR(500) NOT NULL,
    file_name           VARCHAR(255) NOT NULL,
    taken_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    weight_kg           DECIMAL(5,1),
    notes               TEXT,
    metrics_snapshot    JSONB,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_progress_photo_user ON progress_photo(user_id, taken_at DESC);
CREATE INDEX idx_progress_photo_workout ON progress_photo(workout_session_id);
