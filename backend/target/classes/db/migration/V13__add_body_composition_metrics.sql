-- Add gender to user_profile for body composition calculations
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

-- The body_metric table already supports any metric_type string.
-- These are the new types we'll use for body composition:
-- BODY_FAT, BMI, SKELETAL_MUSCLE, MUSCLE_MASS, BMR, FAT_FREE_WEIGHT,
-- SUBCUTANEOUS_FAT, VISCERAL_FAT, BODY_WATER, BONE_MASS, METABOLIC_AGE,
-- PROTEIN_PCT, ABDOMEN, LEFT_CALF, RIGHT_CALF, SHOULDER,
-- WAIST_HIP_RATIO, CHEST_HIP_RATIO, WAIST_CHEST_RATIO
