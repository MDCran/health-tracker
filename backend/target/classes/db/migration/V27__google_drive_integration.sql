ALTER TABLE user_profile ADD COLUMN google_access_token TEXT;
ALTER TABLE user_profile ADD COLUMN google_refresh_token TEXT;
ALTER TABLE user_profile ADD COLUMN google_token_expiry TIMESTAMPTZ;
ALTER TABLE user_profile ADD COLUMN google_drive_folder_id VARCHAR(100);
ALTER TABLE user_profile ADD COLUMN google_connected BOOLEAN NOT NULL DEFAULT false;

-- Remove API keys from database (will be stored on Drive)
-- Keep columns for now as fallback, but they'll be phased out
