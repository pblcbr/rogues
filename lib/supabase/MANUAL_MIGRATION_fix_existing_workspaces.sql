-- IMPORTANT: Run this AFTER MANUAL_MIGRATION_workspace_members.sql
-- This migrates existing users to workspace_members if they're not there yet

-- Add existing users to workspace_members based on their workspace_id
INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT 
  p.workspace_id,
  p.id as user_id,
  'owner' as role
FROM profiles p
WHERE p.workspace_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM workspace_members wm 
    WHERE wm.workspace_id = p.workspace_id 
    AND wm.user_id = p.id
  )
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Update current_workspace_id for all users who have a workspace_id but no current_workspace_id
UPDATE profiles
SET current_workspace_id = workspace_id
WHERE workspace_id IS NOT NULL 
  AND current_workspace_id IS NULL;

-- Verify the migration
SELECT 
  p.email,
  p.workspace_id,
  p.current_workspace_id,
  w.name as workspace_name,
  wm.role as workspace_role
FROM profiles p
LEFT JOIN workspaces w ON p.workspace_id = w.id
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND p.id = wm.user_id
WHERE p.workspace_id IS NOT NULL;

