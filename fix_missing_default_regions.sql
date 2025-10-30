-- Fix missing default regions for existing workspaces
-- Run this in Supabase SQL Editor

-- First, let's see what workspaces don't have default regions
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  w.owner_id,
  COUNT(wr.id) as region_count,
  COUNT(CASE WHEN wr.is_default = true THEN 1 END) as default_region_count
FROM workspaces w
LEFT JOIN workspace_regions wr ON w.id = wr.workspace_id
GROUP BY w.id, w.name, w.owner_id
HAVING COUNT(CASE WHEN wr.is_default = true THEN 1 END) = 0
ORDER BY w.created_at DESC;

-- Create default regions for workspaces that don't have any
INSERT INTO workspace_regions (workspace_id, region, language, is_default)
SELECT 
  w.id,
  COALESCE(p.region, 'United States') as region,
  COALESCE(p.language, 'English') as language,
  true as is_default
FROM workspaces w
LEFT JOIN profiles p ON w.owner_id = p.id
WHERE w.id NOT IN (
  SELECT DISTINCT workspace_id 
  FROM workspace_regions 
  WHERE is_default = true
);

-- Update profiles to set current_workspace_region_id for users who don't have it
UPDATE profiles 
SET current_workspace_region_id = (
  SELECT wr.id 
  FROM workspace_regions wr 
  WHERE wr.workspace_id = profiles.current_workspace_id 
  AND wr.is_default = true
  LIMIT 1
)
WHERE current_workspace_id IS NOT NULL 
AND current_workspace_region_id IS NULL;

-- Verify the fix
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  wr.id as region_id,
  wr.region,
  wr.language,
  wr.is_default,
  p.current_workspace_region_id
FROM workspaces w
LEFT JOIN workspace_regions wr ON w.id = wr.workspace_id AND wr.is_default = true
LEFT JOIN profiles p ON w.owner_id = p.id
ORDER BY w.created_at DESC;
