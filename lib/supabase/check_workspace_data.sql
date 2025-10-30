-- Check workspace data for debugging
-- Run this in Supabase SQL Editor

-- 1. Check if workspace exists
SELECT 
  id, 
  name, 
  owner_id, 
  plan,
  stripe_customer_id,
  stripe_subscription_id
FROM workspaces;

-- 2. Check workspace_members for your user
SELECT 
  wm.*,
  w.name as workspace_name
FROM workspace_members wm
LEFT JOIN workspaces w ON wm.workspace_id = w.id;

-- 3. Check profile data
SELECT 
  id,
  email,
  current_workspace_id,
  current_workspace_region_id,
  workspace_id
FROM profiles;

-- 4. Check if RPC get_user_workspaces is working
-- Replace 'YOUR_USER_ID' with your actual user ID
SELECT * FROM get_user_workspaces('YOUR_USER_ID_HERE'::UUID);
