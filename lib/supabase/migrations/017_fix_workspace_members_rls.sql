-- Migration 017: Fix workspace_members RLS infinite recursion
-- Problem: The policy "Workspace owners can manage members" queries workspace_members 
-- within a policy for workspace_members, causing infinite recursion
-- Solution: Use a security definer function to break the recursion

-- ============================================================================
-- 1. Drop the problematic policy
-- ============================================================================

DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;

-- ============================================================================
-- 2. Create a security definer function to check if user is workspace owner
-- ============================================================================

CREATE OR REPLACE FUNCTION is_workspace_owner(workspace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM workspace_members
    WHERE workspace_id = workspace_uuid
    AND user_id = user_uuid
    AND role = 'owner'
  );
END;
$$;

-- ============================================================================
-- 3. Create a security definer function to check if user is admin or owner
-- ============================================================================

CREATE OR REPLACE FUNCTION is_workspace_admin_or_owner(workspace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM workspace_members
    WHERE workspace_id = workspace_uuid
    AND user_id = user_uuid
    AND role IN ('owner', 'admin')
  );
END;
$$;

-- ============================================================================
-- 4. Recreate policies using the functions (no recursion)
-- ============================================================================

-- Policy: Users can view their own workspace memberships
-- This one is fine, no recursion
DROP POLICY IF EXISTS "Users can view own workspace memberships" ON workspace_members;
CREATE POLICY "Users can view own workspace memberships"
  ON workspace_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Workspace owners can INSERT members
CREATE POLICY "Workspace owners can insert members"
  ON workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_workspace_owner(workspace_id, auth.uid())
  );

-- Policy: Workspace owners can UPDATE members
CREATE POLICY "Workspace owners can update members"
  ON workspace_members
  FOR UPDATE
  TO authenticated
  USING (
    is_workspace_owner(workspace_id, auth.uid())
  )
  WITH CHECK (
    is_workspace_owner(workspace_id, auth.uid())
  );

-- Policy: Workspace owners can DELETE members
CREATE POLICY "Workspace owners can delete members"
  ON workspace_members
  FOR DELETE
  TO authenticated
  USING (
    is_workspace_owner(workspace_id, auth.uid())
  );

-- Policy: Admins can view all members in their workspaces
CREATE POLICY "Workspace admins can view members"
  ON workspace_members
  FOR SELECT
  TO authenticated
  USING (
    is_workspace_admin_or_owner(workspace_id, auth.uid())
  );

-- ============================================================================
-- 5. Add comments for clarity
-- ============================================================================

COMMENT ON FUNCTION is_workspace_owner(UUID, UUID) IS 
  'Security definer function to check if a user is an owner of a workspace. Used to prevent RLS recursion.';

COMMENT ON FUNCTION is_workspace_admin_or_owner(UUID, UUID) IS 
  'Security definer function to check if a user is an admin or owner of a workspace. Used to prevent RLS recursion.';

-- ============================================================================
-- Verification
-- ============================================================================
-- Run this to verify policies:
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'workspace_members';

