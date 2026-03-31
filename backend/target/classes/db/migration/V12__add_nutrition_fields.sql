-- Add complete nutritional fact fields to food_entry
ALTER TABLE food_entry ADD COLUMN IF NOT EXISTS serving_size_g DECIMAL(7,2);
ALTER TABLE food_entry ADD COLUMN IF NOT EXISTS added_sugars_g DECIMAL(7,2);
