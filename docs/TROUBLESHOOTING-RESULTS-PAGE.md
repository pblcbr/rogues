# Troubleshooting: Results Page "Failed to load results"

## Problem

The Results page (`/dashboard/results`) shows an error: "Failed to load results. Please try again."

## Common Causes

### 1. Database Migrations Not Applied

The most common cause is that Sprint 2 database migrations haven't been executed.

**Solution:**

1. Open your Supabase SQL Editor
2. Run the migration file: `lib/supabase/migrations/014_enhance_for_competitor_tracking.sql`
3. Verify it completed successfully

### 2. No Data in Results Table

The Results page requires data from the `results` table, which is populated when you run KPI calculations.

**Solution:**

1. Go to `/dashboard/prompts`
2. Click "Calculate KPIs" button
3. Wait for the calculation to complete
4. Return to `/dashboard/results`

### 3. RLS (Row Level Security) Issues

Supabase RLS policies might not be allowing INSERT/SELECT access to the results table.

**Common Errors:**

```
Error inserting result: {
  code: '42501',
  message: 'new row violates row-level security policy for table "results"'
}
```

**Solution:**

1. Apply migration 016 to fix RLS policies: `lib/supabase/migrations/016_fix_results_rls_policies.sql`
2. This migration creates comprehensive INSERT, SELECT, UPDATE, DELETE policies
3. Verify policies exist by running: `SELECT * FROM pg_policies WHERE tablename IN ('results', 'citations');`
4. See full documentation: `docs/MIGRATION-016-FIX-RLS-POLICIES.md`

## Diagnostic Steps

### Step 1: Verify Database Schema

Run the verification script in Supabase SQL Editor:

```bash
lib/supabase/verify_results_schema.sql
```

This will check:

- ✓ If `results` table exists
- ✓ If required columns are present
- ✓ If `citations` table has enhanced columns
- ✓ If there's any data in the tables
- ✓ If RLS policies are configured

### Step 2: Check Console Logs

1. Open browser DevTools (F12)
2. Go to Console tab
3. Refresh the Results page
4. Look for error messages starting with "Error fetching results:"

### Step 3: Check Supabase Logs

1. Go to your Supabase Dashboard
2. Navigate to Logs → API
3. Look for recent errors related to the `results` table

## Expected Database Structure

### Results Table (after Sprint 2 migration):

```sql
results (
  id uuid PRIMARY KEY,
  prompt_id uuid REFERENCES monitoring_prompts,
  snapshot_id uuid REFERENCES snapshots,
  response_text text,              -- NEW in Sprint 2
  brands_mentioned jsonb,          -- NEW in Sprint 2
  brand_positions jsonb,           -- NEW in Sprint 2
  our_brand_mentioned boolean,     -- NEW in Sprint 2
  our_brand_position integer,      -- NEW in Sprint 2
  relevancy_score decimal,         -- NEW in Sprint 2
  llm_provider text,
  llm_model text,
  prominence decimal,
  alignment decimal,
  sentiment decimal,
  created_at timestamp,
  updated_at timestamp
)
```

### Citations Table (after Sprint 2 migration):

```sql
citations (
  id uuid PRIMARY KEY,
  result_id uuid REFERENCES results,
  url text,
  title text,                      -- NEW in Sprint 2
  domain text,                     -- NEW in Sprint 2
  favicon_url text,                -- NEW in Sprint 2
  position integer,                -- NEW in Sprint 2
  created_at timestamp
)
```

## Quick Fixes

### Fix 1: Run All Migrations

If you're not sure which migrations have been applied:

```bash
# Run in Supabase SQL Editor (in order!)
-- Migration 013: Prompt KPI Snapshots
\i lib/supabase/migrations/013_prompt_kpi_snapshots.sql

-- Migration 014: Enhanced Competitor Tracking
\i lib/supabase/migrations/014_enhance_for_competitor_tracking.sql

-- Migration 015: Add LLM Provider and Model columns
\i lib/supabase/migrations/015_add_llm_columns_to_results.sql

-- Migration 016: Fix RLS Policies (IMPORTANT!)
\i lib/supabase/migrations/016_fix_results_rls_policies.sql
```

### Fix 2: Generate Sample Data

If you need to test with sample data:

1. Create a topic (if you don't have one)
2. Create a prompt for that topic
3. Run KPI calculation from the Prompts page
4. This will populate the `results` and `citations` tables

### Fix 3: Check Workspace/Region

Ensure you have:

- A workspace selected
- At least one active topic
- At least one active prompt

## Error Messages and Solutions

### Error: "No workspace selected"

**Cause:** User doesn't have a current workspace set
**Solution:** Select a workspace from the workspace switcher in the sidebar

### Error: "Column does not exist"

**Cause:** Database migration 014 hasn't been applied
**Solution:** Run migration 014

### Error: "permission denied for table results"

**Cause:** RLS policies not configured correctly
**Solution:**

1. Apply migration 016: `lib/supabase/migrations/016_fix_results_rls_policies.sql`
2. This creates proper INSERT, SELECT, UPDATE, DELETE policies
3. Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'results';`
4. Verify your user has access to the workspace

### Error: "new row violates row-level security policy for table 'results'"

**Cause:** RLS INSERT policies are missing or incorrectly configured
**Solution:**

1. **Apply migration 016** (most important): `lib/supabase/migrations/016_fix_results_rls_policies.sql`
2. This specifically fixes INSERT policies that allow KPI calculations to save data
3. Verify with: `SELECT cmd, policyname FROM pg_policies WHERE tablename = 'results' AND cmd = 'INSERT';`
4. Should return: "Users can insert results for their workspaces"

### Error: "relation 'results' does not exist"

**Cause:** The results table hasn't been created
**Solution:** Run the base schema migration first, then migration 014

## Still Having Issues?

### 1. Check Migration History

Run this in Supabase SQL Editor:

```sql
SELECT *
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;
```

### 2. Verify User Permissions

```sql
-- Check if your user has workspace access
SELECT w.*, wm.role
FROM workspaces w
JOIN workspace_members wm ON wm.workspace_id = w.id
WHERE wm.user_id = auth.uid();
```

### 3. Test Results Query Manually

```sql
-- Try fetching results directly
SELECT
  r.id,
  r.response_text,
  r.our_brand_mentioned,
  mp.prompt_text,
  t.name as topic_name
FROM results r
JOIN monitoring_prompts mp ON r.prompt_id = mp.id
LEFT JOIN topics t ON mp.topic_id = t.id
WHERE mp.workspace_id IN (
  SELECT workspace_id
  FROM workspace_members
  WHERE user_id = auth.uid()
)
LIMIT 5;
```

If this query fails, note the exact error message.

## Prevention

To avoid this issue in the future:

1. **Always run migrations in order**: 013 → 014 → etc.
2. **Verify migrations**: Use the verification script after running migrations
3. **Test with data**: Run KPI calculation immediately after setup
4. **Monitor logs**: Check Supabase logs regularly for errors

## Contact Support

If none of these solutions work, please provide:

1. Output from verification script
2. Browser console errors
3. Supabase API logs
4. Screenshot of the error

## Related Documentation

- Sprint 2: Enhanced Measurement (`docs/sprint-2-enhanced-measurement.md`)
- Sprint 5: Results Page (`docs/sprint-5-results-page.md`)
- Migration 014: Competitor Tracking (`docs/sprint-2-enhanced-measurement.md`)
- Migration 015: LLM Columns (`docs/MIGRATION-015-LLM-COLUMNS.md`)
- Migration 016: Fix RLS Policies (`docs/MIGRATION-016-FIX-RLS-POLICIES.md`) ⭐ **Important**
- Database Migrations (`lib/supabase/migrations/`)
