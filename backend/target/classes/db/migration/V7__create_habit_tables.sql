CREATE TABLE habit (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES app_user(id),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    frequency       VARCHAR(20)  NOT NULL,
    target_count    INT          NOT NULL DEFAULT 1,
    days_of_week    INT[],
    color           VARCHAR(20),
    icon            VARCHAR(50),
    active          BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_habit_user ON habit(user_id, active);

CREATE TABLE habit_log (
    id              BIGSERIAL PRIMARY KEY,
    habit_id        BIGINT  NOT NULL REFERENCES habit(id) ON DELETE CASCADE,
    date            DATE    NOT NULL,
    completed       BOOLEAN NOT NULL DEFAULT true,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(habit_id, date)
);

CREATE INDEX idx_habit_log_habit_date ON habit_log(habit_id, date DESC);
