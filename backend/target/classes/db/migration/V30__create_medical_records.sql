CREATE TABLE medical_record (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    provider_name   VARCHAR(255),
    doctor_name     VARCHAR(255),
    record_date     DATE,
    drive_file_id   VARCHAR(100),
    mime_type       VARCHAR(100),
    file_size       BIGINT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_record_user_id ON medical_record(user_id);
