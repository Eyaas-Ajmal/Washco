-- Add image_url to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
