CREATE TABLE peptide (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT       NOT NULL REFERENCES app_user(id),
    name                    VARCHAR(200) NOT NULL,
    total_amount_mg         DECIMAL(10,3) NOT NULL,
    bac_water_ml            DECIMAL(8,2),
    concentration_mg_per_ml DECIMAL(10,4),
    notes                   TEXT,
    active                  BOOLEAN      NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE peptide_compound (
    id              BIGSERIAL PRIMARY KEY,
    peptide_id      BIGINT       NOT NULL REFERENCES peptide(id) ON DELETE CASCADE,
    compound_name   VARCHAR(200) NOT NULL,
    amount_mg       DECIMAL(10,3) NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_peptide_compound_peptide ON peptide_compound(peptide_id);

CREATE TABLE medication (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES app_user(id),
    name            VARCHAR(200) NOT NULL,
    dosage_amount   DECIMAL(10,3),
    dosage_unit     VARCHAR(50),
    frequency       VARCHAR(100),
    notes           TEXT,
    active          BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE supplement (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES app_user(id),
    name            VARCHAR(200) NOT NULL,
    dosage_amount   DECIMAL(10,3),
    dosage_unit     VARCHAR(50),
    frequency       VARCHAR(100),
    notes           TEXT,
    active          BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE therapeutic_schedule (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT       NOT NULL REFERENCES app_user(id),
    therapeutic_type    VARCHAR(20)  NOT NULL,
    therapeutic_id      BIGINT       NOT NULL,
    schedule_type       VARCHAR(20)  NOT NULL,
    days_of_week        INT[],
    interval_days       INT,
    time_of_day         TIME,
    dosage_override     DECIMAL(10,3),
    dosage_unit         VARCHAR(50),
    notes               TEXT,
    active              BOOLEAN      NOT NULL DEFAULT true,
    start_date          DATE         NOT NULL,
    end_date            DATE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_therapeutic_schedule_lookup ON therapeutic_schedule(therapeutic_type, therapeutic_id);
CREATE INDEX idx_therapeutic_schedule_user ON therapeutic_schedule(user_id, active);

CREATE TABLE therapeutic_log (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT       NOT NULL REFERENCES app_user(id),
    therapeutic_type    VARCHAR(20)  NOT NULL,
    therapeutic_id      BIGINT       NOT NULL,
    schedule_id         BIGINT       REFERENCES therapeutic_schedule(id),
    taken_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    dosage_amount       DECIMAL(10,3),
    dosage_unit         VARCHAR(50),
    notes               TEXT,
    skipped             BOOLEAN      NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_therapeutic_log_user_date ON therapeutic_log(user_id, taken_at);
CREATE INDEX idx_therapeutic_log_lookup ON therapeutic_log(therapeutic_type, therapeutic_id);
