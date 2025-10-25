-- Migration: Add multi-workspace support for agencies
-- This allows agencies to manage multiple client workspaces

-- Create workspace_members table for multi-tenant support
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: a user can only have one role per workspace
  UNIQUE(workspace_id, user_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);

-- Add current_workspace_id to profiles (tracks which workspace user is currently viewing)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_profiles_current_workspace ON profiles(current_workspace_id);

-- Function to automatically add user as owner when they create their first workspace
CREATE OR REPLACE FUNCTION add_user_to_workspace()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the user as owner of their workspace
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-add user as owner
DROP TRIGGER IF EXISTS on_workspace_created ON workspaces;
CREATE TRIGGER on_workspace_created
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION add_user_to_workspace();

-- Function to get user's workspaces
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
    w.company_name,
    w.company_domain,
    w.plan_id,
    wm.role,
    (p.current_workspace_id = w.id) as is_current
  FROM workspaces w
  INNER JOIN workspace_members wm ON w.id = wm.workspace_id
  LEFT JOIN profiles p ON p.id = user_uuid
  WHERE wm.user_id = user_uuid
  ORDER BY w.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on workspace_members
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own workspace memberships
CREATE POLICY "Users can view own workspace memberships"
  ON workspace_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Workspace owners can manage members
CREATE POLICY "Workspace owners can manage members"
  ON workspace_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_members.workspace_id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Migrate existing profiles to workspace_members
INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT 
  workspace_id,
  id as user_id,
  'owner' as role
FROM profiles
WHERE workspace_id IS NOT NULL
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Update current_workspace_id for existing users
UPDATE profiles
SET current_workspace_id = workspace_id
WHERE workspace_id IS NOT NULL AND current_workspace_id IS NULL;

COMMENT ON TABLE workspace_members IS 'Many-to-many relationship between users and workspaces, enabling agencies to manage multiple clients';
COMMENT ON COLUMN workspace_members.role IS 'User role in the workspace: owner (full control), admin (manage settings), member (view/edit)';
COMMENT ON COLUMN profiles.current_workspace_id IS 'The workspace the user is currently viewing (for agencies with multiple workspaces)';

