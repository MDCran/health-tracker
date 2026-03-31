ALTER TABLE habit ADD COLUMN habit_type VARCHAR(10) NOT NULL DEFAULT 'GOOD';
ALTER TABLE habit ADD COLUMN target_days INT NOT NULL DEFAULT 66;

-- For bad habits, logs represent occurrences (when the bad habit was done)
-- For good habits, logs represent completions (when the habit was done - existing behavior)
-- target_days: how many consecutive days to form/break the habit (default 66 based on research)

COMMENT ON COLUMN habit.habit_type IS 'GOOD = build this habit, BAD = break this habit';
COMMENT ON COLUMN habit.target_days IS 'Number of consecutive days needed to form (GOOD) or break (BAD) the habit';
