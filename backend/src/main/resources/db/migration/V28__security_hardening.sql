-- Remove plaintext API keys from database (now stored encrypted on Google Drive)
ALTER TABLE user_profile DROP COLUMN IF EXISTS openai_api_key;
ALTER TABLE user_profile DROP COLUMN IF EXISTS api_ninjas_key;
ALTER TABLE user_profile DROP COLUMN IF EXISTS exercisedb_api_key;

-- Add sidebar customization
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS sidebar_config JSONB;
