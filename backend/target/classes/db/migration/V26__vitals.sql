CREATE TABLE vital_reading (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES app_user(id),
    vital_type      VARCHAR(50)  NOT NULL,
    custom_name     VARCHAR(100),
    value           DECIMAL(10,2) NOT NULL,
    value2          DECIMAL(10,2),
    unit            VARCHAR(20),
    measured_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    notes           TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_vital_reading_user ON vital_reading(user_id, vital_type, measured_at DESC);
