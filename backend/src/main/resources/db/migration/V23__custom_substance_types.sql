CREATE TABLE custom_substance_type (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES app_user(id),
    key         VARCHAR(50)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    color       VARCHAR(7)   NOT NULL DEFAULT '#64748b',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(user_id, key)
);

CREATE INDEX idx_custom_substance_type_user ON custom_substance_type(user_id);
