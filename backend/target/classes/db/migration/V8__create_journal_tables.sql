CREATE TABLE journal_entry (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES app_user(id),
    date            DATE        NOT NULL,
    reflection      TEXT,
    gratitude       TEXT,
    overall_rating  INT         CHECK (overall_rating BETWEEN 1 AND 10),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_journal_entry_user_date ON journal_entry(user_id, date DESC);

CREATE TABLE realm_rating (
    id                  BIGSERIAL PRIMARY KEY,
    journal_entry_id    BIGINT      NOT NULL REFERENCES journal_entry(id) ON DELETE CASCADE,
    realm               VARCHAR(30) NOT NULL,
    rating              INT         NOT NULL CHECK (rating BETWEEN 1 AND 10),
    likert_responses    JSONB,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(journal_entry_id, realm)
);

CREATE INDEX idx_realm_rating_entry ON realm_rating(journal_entry_id);
