-- Fix current_workspace_region_id in profiles after creating regions
-- Run this in Supabase SQL Editor AFTER creating the regions

UPDATE profiles
SET current_workspace_region_id = (
  SELECT wr.id 
  FROM workspace_regions wr
  WHERE wr.workspace_id = profiles.current_workspace_id
  AND wr.is_default = true
  LIMIT 1
)
WHERE current_workspace_id IS NOT NULL
AND (
  current_workspace_region_id IS NULL
  OR current_workspace_region_id NOT IN (
    SELECT id FROM workspace_regions
  )
);
