-- Add richer exercise data fields from ExerciseDB and MuscleWiki
ALTER TABLE exercise ADD COLUMN body_part VARCHAR(50);
ALTER TABLE exercise ADD COLUMN target_muscle VARCHAR(50);
ALTER TABLE exercise ADD COLUMN gif_url VARCHAR(500);
ALTER TABLE exercise ADD COLUMN video_urls TEXT[] DEFAULT '{}';
ALTER TABLE exercise ADD COLUMN description TEXT;
ALTER TABLE exercise ADD COLUMN difficulty VARCHAR(20);
ALTER TABLE exercise ADD COLUMN source VARCHAR(20);
ALTER TABLE exercise ADD COLUMN source_id VARCHAR(100);

CREATE INDEX idx_exercise_body_part ON exercise(body_part);
CREATE INDEX idx_exercise_target_muscle ON exercise(target_muscle);
CREATE INDEX idx_exercise_source ON exercise(source, source_id);
