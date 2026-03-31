CREATE TABLE sleep_entry (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES app_user(id),
    date            DATE         NOT NULL,
    bedtime         TIMESTAMPTZ  NOT NULL,
    wake_time       TIMESTAMPTZ  NOT NULL,
    total_minutes   INT,
    sleep_quality   INT          CHECK (sleep_quality BETWEEN 1 AND 10),
    feel_rested     INT          CHECK (feel_rested BETWEEN 1 AND 5),
    sleep_latency_min INT,
    notes           TEXT,
    survey_responses JSONB,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(user_id, date)
);

CREATE TABLE sleep_interruption (
    id              BIGSERIAL PRIMARY KEY,
    sleep_entry_id  BIGINT       NOT NULL REFERENCES sleep_entry(id) ON DELETE CASCADE,
    woke_at         TIMESTAMPTZ  NOT NULL,
    fell_back_at    TIMESTAMPTZ,
    duration_min    INT,
    reason          TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_sleep_entry_user ON sleep_entry(user_id, date DESC);
CREATE INDEX idx_sleep_interruption_entry ON sleep_interruption(sleep_entry_id);
