-- Migration: Update get_user_workspaces function to use correct field names
-- Fixes the workspace switcher to work with current schema

CREATE OR REPLACE FUNCTION get_user_workspaces(user_uuid UUID)
RETURNS TABLE (
  workspace_id UUID,
  workspace_name TEXT,
  workspace_domain TEXT,
  workspace_plan TEXT,
  user_role TEXT,
  is_current BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.domain,
    w.plan,
    wm.role,
    (p.current_workspace_id = w.id) as is_current
  FROM workspaces w
  INNER JOIN workspace_members wm ON w.id = wm.workspace_id
  LEFT JOIN profiles p ON p.id = user_uuid
  WHERE wm.user_id = user_uuid
  ORDER BY w.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

