-- Migration: Add workspace_regions table for multi-region support
-- This allows one workspace to monitor multiple regions/languages

-- ============================================
-- 1. CREATE WORKSPACE_REGIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS workspace_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  region TEXT NOT NULL,
  language TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one region per workspace (no duplicates)
  UNIQUE(workspace_id, region)
);

-- Indexes for workspace_regions
CREATE INDEX IF NOT EXISTS idx_workspace_regions_workspace_id ON workspace_regions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_regions_is_default ON workspace_regions(is_default);

-- Comments
COMMENT ON TABLE workspace_regions IS 'Multi-region support for workspaces - allows monitoring different markets';
COMMENT ON COLUMN workspace_regions.is_default IS 'First region created is default (used during onboarding)';

-- ============================================
-- 2. ADD WORKSPACE_REGION_ID TO TOPICS
-- ============================================

ALTER TABLE topics
ADD COLUMN IF NOT EXISTS workspace_region_id UUID REFERENCES workspace_regions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_topics_workspace_region ON topics(workspace_region_id);

-- ============================================
-- 3. ADD WORKSPACE_REGION_ID TO MONITORING_PROMPTS
-- ============================================

ALTER TABLE monitoring_prompts
ADD COLUMN IF NOT EXISTS workspace_region_id UUID REFERENCES workspace_regions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_monitoring_prompts_region ON monitoring_prompts(workspace_region_id);

-- ============================================
-- 4. ADD WORKSPACE_REGION_ID TO SNAPSHOTS
-- ============================================

ALTER TABLE snapshots
ADD COLUMN IF NOT EXISTS workspace_region_id UUID REFERENCES workspace_regions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_snapshots_region ON snapshots(workspace_region_id);

-- ============================================
-- 5. ADD WORKSPACE_REGION_ID TO RESULTS
-- ============================================

ALTER TABLE results
ADD COLUMN IF NOT EXISTS workspace_region_id UUID REFERENCES workspace_regions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_results_region ON results(workspace_region_id);

-- ============================================
-- 6. ADD WORKSPACE_REGION_ID TO CITATIONS
-- ============================================

ALTER TABLE citations
ADD COLUMN IF NOT EXISTS workspace_region_id UUID REFERENCES workspace_regions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_citations_region ON citations(workspace_region_id);

-- ============================================
-- 7. ADD WORKSPACE_REGION_ID TO COMPETITORS
-- ============================================

ALTER TABLE competitors
ADD COLUMN IF NOT EXISTS workspace_region_id UUID REFERENCES workspace_regions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_competitors_region ON competitors(workspace_region_id);

-- ============================================
-- 8. UPDATE PROFILE - ADD CURRENT_REGION_ID
-- ============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_workspace_region_id UUID REFERENCES workspace_regions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_current_region ON profiles(current_workspace_region_id);

COMMENT ON COLUMN profiles.current_workspace_region_id IS 'Currently selected region within the workspace (for filtering)';

-- ============================================
-- 9. ROW LEVEL SECURITY FOR WORKSPACE_REGIONS
-- ============================================

ALTER TABLE workspace_regions ENABLE ROW LEVEL SECURITY;

-- Users can view regions from their workspaces
CREATE POLICY "Users can view regions from own workspaces"
  ON workspace_regions FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Users can manage regions in their workspaces
CREATE POLICY "Users can manage regions in own workspaces"
  ON workspace_regions FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- 10. MIGRATE EXISTING DATA
-- ============================================

-- Create a default workspace_region for each existing workspace
INSERT INTO workspace_regions (workspace_id, region, language, is_default)
SELECT 
  w.id as workspace_id,
  COALESCE(w.region, 'United States') as region,
  COALESCE(w.language, 'English') as language,
  TRUE as is_default
FROM workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM workspace_regions wr WHERE wr.workspace_id = w.id
)
ON CONFLICT (workspace_id, region) DO NOTHING;

-- Update existing topics with workspace_region_id
UPDATE topics t
SET workspace_region_id = (
  SELECT id FROM workspace_regions wr 
  WHERE wr.workspace_id = t.workspace_id 
  AND wr.is_default = TRUE 
  LIMIT 1
)
WHERE workspace_region_id IS NULL;

-- Update existing monitoring_prompts with workspace_region_id
UPDATE monitoring_prompts mp
SET workspace_region_id = (
  SELECT id FROM workspace_regions wr 
  WHERE wr.workspace_id = mp.workspace_id 
  AND wr.is_default = TRUE 
  LIMIT 1
)
WHERE workspace_region_id IS NULL;

-- Update existing snapshots with workspace_region_id
UPDATE snapshots s
SET workspace_region_id = (
  SELECT id FROM workspace_regions wr 
  WHERE wr.workspace_id = s.workspace_id 
  AND wr.is_default = TRUE 
  LIMIT 1
)
WHERE workspace_region_id IS NULL;

-- Update existing results with workspace_region_id
UPDATE results r
SET workspace_region_id = (
  SELECT id FROM workspace_regions wr 
  WHERE wr.workspace_id = (
    SELECT snapshot_id FROM results WHERE id = r.id
  )
  AND wr.is_default = TRUE 
  LIMIT 1
)
WHERE workspace_region_id IS NULL;

-- Update existing citations with workspace_region_id  
UPDATE citations c
SET workspace_region_id = (
  SELECT s.workspace_region_id 
  FROM snapshots s 
  WHERE s.id = (
    SELECT snapshot_id FROM results WHERE id = c.result_id
  )
  LIMIT 1
)
WHERE workspace_region_id IS NULL;

-- Update existing competitors with workspace_region_id
UPDATE competitors c
SET workspace_region_id = (
  SELECT id FROM workspace_regions wr 
  WHERE wr.workspace_id = c.workspace_id 
  AND wr.is_default = TRUE 
  LIMIT 1
)
WHERE workspace_region_id IS NULL;

-- Update profiles with current_workspace_region_id
UPDATE profiles p
SET current_workspace_region_id = (
  SELECT id FROM workspace_regions wr 
  WHERE wr.workspace_id = p.current_workspace_id 
  AND wr.is_default = TRUE 
  LIMIT 1
)
WHERE current_workspace_region_id IS NULL 
  AND current_workspace_id IS NOT NULL;

-- ============================================
-- 11. FUNCTION TO GET DEFAULT REGION
-- ============================================

CREATE OR REPLACE FUNCTION get_default_workspace_region(p_workspace_id UUID)
RETURNS UUID AS $$
DECLARE
  region_id UUID;
BEGIN
  SELECT id INTO region_id
  FROM workspace_regions
  WHERE workspace_id = p_workspace_id
    AND is_default = TRUE
  LIMIT 1;
  
  RETURN region_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_default_workspace_region IS 'Returns the default workspace region ID';

