-- Migration: Add brand, region, and language to workspaces
-- This allows workspaces to have their own brand configuration independent of user profile

-- Add new columns to workspaces table
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS brand_website TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS language TEXT;

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_workspaces_brand_name ON workspaces(brand_name);
CREATE INDEX IF NOT EXISTS idx_workspaces_region ON workspaces(region);
CREATE INDEX IF NOT EXISTS idx_workspaces_language ON workspaces(language);

-- Migrate existing brand data from profiles to workspaces
UPDATE workspaces w
SET 
  brand_name = COALESCE(p.first_name || ' ' || p.last_name, 'Company'),
  brand_website = p.brand_website,
  region = p.region,
  language = p.language
FROM profiles p
WHERE w.id = p.workspace_id
  AND (w.brand_name IS NULL OR w.brand_website IS NULL OR w.region IS NULL OR w.language IS NULL);

-- Add comments for documentation
COMMENT ON COLUMN workspaces.brand_name IS 'Brand/company name for this workspace';
COMMENT ON COLUMN workspaces.brand_website IS 'Brand website/domain for monitoring';
COMMENT ON COLUMN workspaces.region IS 'Primary region for this workspace (e.g., United States, Spain)';
COMMENT ON COLUMN workspaces.language IS 'Primary language for this workspace (e.g., English, Spanish)';

