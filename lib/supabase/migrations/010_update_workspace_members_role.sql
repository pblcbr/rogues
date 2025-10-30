-- Migration: Update workspace_members role from 'member' to 'analyst'
-- This aligns with the new role structure: owner, admin, analyst

-- Update the CHECK constraint to use 'analyst' instead of 'member'
ALTER TABLE workspace_members
DROP CONSTRAINT IF EXISTS workspace_members_role_check;

ALTER TABLE workspace_members
ADD CONSTRAINT workspace_members_role_check 
CHECK (role IN ('owner', 'admin', 'analyst'));

-- Update existing 'member' roles to 'analyst'
UPDATE workspace_members
SET role = 'analyst'
WHERE role = 'member';

-- Update the default value
ALTER TABLE workspace_members
ALTER COLUMN role SET DEFAULT 'analyst';

-- Update the comment
COMMENT ON COLUMN workspace_members.role IS 'User role in the workspace: owner (full control), admin (manage settings), analyst (read-only)';

