-- Fix infinite recursion in workspace_members RLS policies
-- The issue is that the "owners can manage members" policy references workspace_members
-- which causes recursion when inserting new rows

-- Drop the problematic policy
DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;

-- Create a new policy that doesn't cause recursion
-- Users can manage their OWN workspace_members rows (insert/update/delete their own membership)
CREATE POLICY "Users can manage own workspace membership"
  ON workspace_members
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow workspace owners to insert new members (without recursion check)
CREATE POLICY "Workspace owners can add members"
  ON workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id
      AND w.owner_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON POLICY "Users can manage own workspace membership" ON workspace_members IS 'Users can insert, update, or delete their own workspace membership rows';
COMMENT ON POLICY "Workspace owners can add members" ON workspace_members IS 'Workspace owners can add new members to their workspaces';

