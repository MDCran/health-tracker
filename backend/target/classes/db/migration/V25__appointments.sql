CREATE TABLE appointment (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES app_user(id),
    title           VARCHAR(200) NOT NULL,
    doctor_name     VARCHAR(200),
    office_name     VARCHAR(200),
    specialty       VARCHAR(100),
    location        VARCHAR(500),
    appointment_date DATE        NOT NULL,
    appointment_time TIME,
    duration_minutes INT,
    notes           TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointment_user_date ON appointment(user_id, appointment_date);
