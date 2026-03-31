-- Substance/activity tracking table for sober day counting
CREATE TABLE substance_log (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES app_user(id),
    substance_type  VARCHAR(30)  NOT NULL,
    occurred_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    amount          VARCHAR(100),
    notes           TEXT,
    context         TEXT,
    mood_before     INT          CHECK (mood_before BETWEEN 1 AND 5),
    mood_after      INT          CHECK (mood_after BETWEEN 1 AND 5),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_substance_log_user ON substance_log(user_id, substance_type, occurred_at DESC);
