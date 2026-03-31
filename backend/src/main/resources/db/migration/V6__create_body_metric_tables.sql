CREATE TABLE body_metric (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES app_user(id),
    metric_type     VARCHAR(30) NOT NULL,
    custom_name     VARCHAR(100),
    value           DECIMAL(10,2) NOT NULL,
    unit            VARCHAR(20) NOT NULL,
    measured_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_body_metric_user_type ON body_metric(user_id, metric_type, measured_at DESC);
