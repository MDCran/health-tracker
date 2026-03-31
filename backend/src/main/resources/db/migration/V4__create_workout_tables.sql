CREATE TABLE workout_template (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES app_user(id),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    color           VARCHAR(20),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE workout_template_exercise (
    id                  BIGSERIAL PRIMARY KEY,
    template_id         BIGINT   NOT NULL REFERENCES workout_template(id) ON DELETE CASCADE,
    exercise_id         BIGINT   NOT NULL REFERENCES exercise(id),
    exercise_order      INT      NOT NULL,
    target_sets         INT,
    target_reps         INT,
    target_weight_kg    DECIMAL(7,2),
    rest_seconds        INT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_template_exercise_template ON workout_template_exercise(template_id, exercise_order);

CREATE TABLE workout_schedule (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES app_user(id),
    template_id     BIGINT       NOT NULL REFERENCES workout_template(id) ON DELETE CASCADE,
    days_of_week    INT[],
    time_of_day     TIME,
    active          BOOLEAN      NOT NULL DEFAULT true,
    start_date      DATE         NOT NULL,
    end_date        DATE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_schedule_user ON workout_schedule(user_id, active);

CREATE TABLE workout_session (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT       NOT NULL REFERENCES app_user(id),
    template_id         BIGINT       REFERENCES workout_template(id),
    name                VARCHAR(200),
    date                DATE         NOT NULL,
    started_at          TIMESTAMPTZ,
    finished_at         TIMESTAMPTZ,
    duration_seconds    INT,
    notes               TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_session_user_date ON workout_session(user_id, date DESC);

CREATE TABLE workout_exercise (
    id                  BIGSERIAL PRIMARY KEY,
    session_id          BIGINT   NOT NULL REFERENCES workout_session(id) ON DELETE CASCADE,
    exercise_id         BIGINT   NOT NULL REFERENCES exercise(id),
    exercise_order      INT      NOT NULL,
    notes               TEXT,
    rest_seconds        INT,
    started_at          TIMESTAMPTZ,
    finished_at         TIMESTAMPTZ,
    duration_seconds    INT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_exercise_session ON workout_exercise(session_id, exercise_order);

CREATE TABLE exercise_set (
    id                  BIGSERIAL PRIMARY KEY,
    workout_exercise_id BIGINT   NOT NULL REFERENCES workout_exercise(id) ON DELETE CASCADE,
    set_number          INT      NOT NULL,
    set_type            VARCHAR(20) NOT NULL DEFAULT 'WORKING',
    reps                INT,
    weight_kg           DECIMAL(7,2),
    duration_seconds    INT,
    rest_seconds        INT,
    completed           BOOLEAN  NOT NULL DEFAULT false,
    rpe                 DECIMAL(3,1),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercise_set_workout_exercise ON exercise_set(workout_exercise_id, set_number);

CREATE TABLE personal_record (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT   NOT NULL REFERENCES app_user(id),
    exercise_id         BIGINT   NOT NULL REFERENCES exercise(id),
    record_type         VARCHAR(20) NOT NULL,
    value               DECIMAL(10,2) NOT NULL,
    unit                VARCHAR(20) NOT NULL,
    achieved_at         DATE     NOT NULL,
    workout_exercise_id BIGINT   REFERENCES workout_exercise(id),
    exercise_set_id     BIGINT   REFERENCES exercise_set(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pr_user_exercise ON personal_record(user_id, exercise_id, record_type);
