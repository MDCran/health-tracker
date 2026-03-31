-- Restore API key storage in database (reverted from Drive-only approach)
-- Only photos, medical records, and journal PDFs go to Google Drive
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS openai_api_key VARCHAR(500);
