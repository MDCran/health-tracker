ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS target_weekly_change_kg DECIMAL(4,2) DEFAULT 0;
-- Negative = losing weight (cut), Positive = gaining weight (bulk), 0 = maintain
-- e.g., -0.45 = lose ~1 lb/week, 0.23 = gain ~0.5 lb/week
