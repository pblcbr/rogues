# Supabase Setup Instructions

## ⚠️ CRITICAL: Migrations Must Be Executed

For the registration flow to work correctly, you **MUST** execute these SQL migrations in the Supabase SQL Editor:

### 1. Execute These Migrations (In Order)

1. **`MANUAL_MIGRATION_workspace_members.sql`**
   - Creates `workspace_members` table
   - Adds `current_workspace_id` to `profiles`
   - Sets up multi-workspace support

2. **`FIX_RLS_POLICIES.sql`**
   - Fixes infinite recursion in RLS policies
   - Allows workspace creation without errors

3. **`MANUAL_MIGRATION_simplify_topics.sql`** (Optional)
   - Simplifies topics table structure
   - Removes unnecessary columns

### 2. How to Execute

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy and paste the SQL from each file
4. Click **Run**
5. Verify successful execution

### 3. After Executing Migrations

Once all migrations are executed:

- The registration flow will work correctly
- Workspaces will be created successfully
- The workspace switcher will function properly
- Multi-workspace support will be enabled

## Current Error: "Timeout waiting for workspace"

This error occurs when:

1. The Stripe webhook creates a workspace in the database
2. But the `workspace_id` or `current_workspace_id` columns don't exist in `profiles` table
3. So the page can't find the workspace to redirect to

**Solution**: Execute the migrations above, then try registering again.

## Need Help?

If you continue to see errors after executing the migrations, check:

- Supabase logs for webhook execution
- Browser console for client-side errors
- Network tab for API call failures
