CREATE TABLE nutrition_day (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT   NOT NULL REFERENCES app_user(id),
    date            DATE     NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, date)
);

CREATE TABLE meal (
    id                  BIGSERIAL PRIMARY KEY,
    nutrition_day_id    BIGINT      NOT NULL REFERENCES nutrition_day(id) ON DELETE CASCADE,
    meal_type           VARCHAR(20) NOT NULL,
    name                VARCHAR(200),
    meal_order          INT         NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meal_day ON meal(nutrition_day_id);

CREATE TABLE food_entry (
    id                  BIGSERIAL PRIMARY KEY,
    meal_id             BIGINT      NOT NULL REFERENCES meal(id) ON DELETE CASCADE,
    description         TEXT        NOT NULL,
    serving_size        VARCHAR(100),
    calories            INT,
    protein_g           DECIMAL(7,2),
    carbs_g             DECIMAL(7,2),
    fat_g               DECIMAL(7,2),
    fiber_g             DECIMAL(7,2),
    sugar_g             DECIMAL(7,2),
    sodium_mg           DECIMAL(7,2),
    cholesterol_mg      DECIMAL(7,2),
    saturated_fat_g     DECIMAL(7,2),
    trans_fat_g         DECIMAL(7,2),
    potassium_mg        DECIMAL(7,2),
    ai_analyzed         BOOLEAN     NOT NULL DEFAULT false,
    ai_raw_response     JSONB,
    manually_adjusted   BOOLEAN     NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_food_entry_meal ON food_entry(meal_id);

CREATE TABLE nutrition_goal (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT   NOT NULL UNIQUE REFERENCES app_user(id),
    calories        INT,
    protein_g       DECIMAL(7,2),
    carbs_g         DECIMAL(7,2),
    fat_g           DECIMAL(7,2),
    fiber_g         DECIMAL(7,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
