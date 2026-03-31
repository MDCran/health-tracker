-- Add advanced habit fields
ALTER TABLE habit ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE habit ADD COLUMN IF NOT EXISTS cue TEXT;
ALTER TABLE habit ADD COLUMN IF NOT EXISTS routine TEXT;
ALTER TABLE habit ADD COLUMN IF NOT EXISTS reward TEXT;
ALTER TABLE habit ADD COLUMN IF NOT EXISTS stack_after_habit_id BIGINT REFERENCES habit(id);
ALTER TABLE habit ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'MEDIUM';
ALTER TABLE habit ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;
ALTER TABLE habit ADD COLUMN IF NOT EXISTS reminder_time TIME;

-- Add notes and mood to habit_log for richer tracking
ALTER TABLE habit_log ADD COLUMN IF NOT EXISTS intensity INT CHECK (intensity BETWEEN 1 AND 10);
ALTER TABLE habit_log ADD COLUMN IF NOT EXISTS mood VARCHAR(20);
ALTER TABLE habit_log ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE habit_log ADD COLUMN IF NOT EXISTS skip_reason TEXT;

-- Milestones table
CREATE TABLE IF NOT EXISTS habit_milestone (
    id              BIGSERIAL PRIMARY KEY,
    habit_id        BIGINT      NOT NULL REFERENCES habit(id) ON DELETE CASCADE,
    milestone_type  VARCHAR(30) NOT NULL,
    milestone_value INT         NOT NULL,
    achieved_at     DATE        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habit_milestone_habit ON habit_milestone(habit_id);
