CREATE TABLE notification (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES app_user(id),
    title           VARCHAR(200) NOT NULL,
    message         TEXT,
    notification_type VARCHAR(30) NOT NULL,
    reference_type  VARCHAR(30),
    reference_id    BIGINT,
    link_url        VARCHAR(500),
    read            BOOLEAN      NOT NULL DEFAULT false,
    dismissed       BOOLEAN      NOT NULL DEFAULT false,
    scheduled_for   TIMESTAMPTZ  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_user ON notification(user_id, read, dismissed, scheduled_for DESC);
