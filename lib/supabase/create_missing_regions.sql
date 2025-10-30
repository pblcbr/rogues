-- Create missing workspace_regions for existing workspaces
-- Run this in Supabase SQL Editor

INSERT INTO workspace_regions (workspace_id, region, language, is_default)
SELECT 
  w.id as workspace_id,
  COALESCE(p.region, 'United States') as region,
  COALESCE(p.language, 'English') as language,
  true as is_default
FROM workspaces w
INNER JOIN profiles p ON w.owner_id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM workspace_regions wr 
  WHERE wr.workspace_id = w.id
)
AND w.owner_id IS NOT NULL;
