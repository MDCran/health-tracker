-- Store full set details on PRs so we can compare properly
ALTER TABLE personal_record ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2);
ALTER TABLE personal_record ADD COLUMN IF NOT EXISTS reps INT;
ALTER TABLE personal_record ADD COLUMN IF NOT EXISTS set_number INT;
