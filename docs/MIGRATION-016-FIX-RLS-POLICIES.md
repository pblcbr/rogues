# Migration 016: Fix RLS Policies for Results and Citations

## 🎯 **Purpose**

This migration fixes Row Level Security (RLS) policies for the `results` and `citations` tables to allow proper INSERT, SELECT, UPDATE, and DELETE operations from authenticated users who belong to the workspace.

## ⚠️ **Problems**

When running KPI calculations, the system was encountering these errors:

### Error 1: Missing INSERT Policies

```
Error inserting result: {
  code: '42501',
  message: 'new row violates row-level security policy for table "results"'
}
```

This occurred because:

- RLS was enabled on `results` and `citations` tables
- But **INSERT** policies were either missing or incorrectly configured
- The server couldn't insert new measurement data

### Error 2: Infinite Recursion in Policies

```
Error inserting result: {
  code: '42P17',
  message: 'infinite recursion detected in policy for relation "workspace_members"'
}
```

This occurred because:

- RLS policies were using JOINs that created circular references
- `results` policy checked `workspace_members`
- Other tables' policies also checked `workspace_members`, creating a loop

## ✅ **Solution**

This migration:

1. **Drops existing policies** (clean slate)
2. **Ensures RLS is enabled** on both tables
3. **Creates comprehensive policies** for all operations:
   - SELECT (read)
   - INSERT (create) ⭐ **Critical for KPI calculations**
   - UPDATE (modify)
   - DELETE (remove)
4. **Uses nested subqueries** instead of JOINs to avoid recursion
5. **Adds performance indexes** for faster policy checks

### Key Technical Change: Avoiding Recursion

**Before (❌ Caused recursion):**

```sql
EXISTS (
  SELECT 1 FROM monitoring_prompts mp
  JOIN workspace_members wm ON wm.workspace_id = mp.workspace_id
  WHERE mp.id = results.prompt_id AND wm.user_id = auth.uid()
)
```

**After (✅ No recursion):**

```sql
prompt_id IN (
  SELECT mp.id FROM monitoring_prompts mp
  WHERE mp.workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
)
```

The nested `IN` subqueries prevent circular references between RLS policies.

## 🔐 **Security Model**

### **Results Table**

Users can access results if they belong to the workspace that owns the prompt:

```
User → workspace_members → workspace → monitoring_prompts → results
```

### **Citations Table**

Users can access citations if they belong to the workspace that owns the result's prompt:

```
User → workspace_members → workspace → monitoring_prompts → results → citations
```

## 📦 **What This Migration Does**

### **1. Results Table Policies**

- **SELECT**: View results for prompts in your workspaces
- **INSERT**: Create results for prompts in your workspaces
- **UPDATE**: Modify results for prompts in your workspaces
- **DELETE**: Remove results for prompts in your workspaces

### **2. Citations Table Policies**

- **SELECT**: View citations for results in your workspaces
- **INSERT**: Create citations for results in your workspaces
- **UPDATE**: Modify citations for results in your workspaces
- **DELETE**: Remove citations for results in your workspaces

### **3. Performance Indexes**

- `idx_results_prompt_id`: Speeds up RLS checks on `results.prompt_id`
- `idx_citations_result_id`: Speeds up RLS checks on `citations.result_id`

## 🚀 **How to Apply**

### **Option 1: Supabase Dashboard (Recommended)**

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy the contents of `/lib/supabase/migrations/016_fix_results_rls_policies.sql`
4. Paste and click **Run**
5. ✅ You should see: "Success. No rows returned"

### **Option 2: Supabase CLI**

```bash
# Navigate to your project root
cd /Users/pblcbr/rogues/rogues

# Apply the migration
supabase db push

# Or apply this specific migration
psql $DATABASE_URL -f lib/supabase/migrations/016_fix_results_rls_policies.sql
```

## ✅ **Verify the Migration**

Run this query in Supabase SQL Editor:

```sql
-- Check all policies for results and citations
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('results', 'citations')
ORDER BY tablename, cmd;
```

### **Expected Output:**

You should see **8 policies** (4 for `results`, 4 for `citations`):

**Results Table:**

- Users can view results from their workspaces (SELECT)
- Users can insert results for their workspaces (INSERT)
- Users can update results for their workspaces (UPDATE)
- Users can delete results for their workspaces (DELETE)

**Citations Table:**

- Users can view citations from their workspaces (SELECT)
- Users can insert citations for their workspaces (INSERT)
- Users can update citations for their workspaces (UPDATE)
- Users can delete citations for their workspaces (DELETE)

## 🧪 **Test the Fix**

After applying the migration:

1. Go to `/dashboard/prompts`
2. Click **"Calculate KPIs"**
3. Watch the progress bar
4. ✅ **No more "row-level security policy" errors**
5. Check the terminal: You should see successful inserts:
   ```
   [Daily KPI Stream] Saving 3 individual results for prompt xyz...
   [Daily KPI Stream] Inserted result with ID: abc123
   [Daily KPI Stream] Saving 2 citations for result abc123
   [Daily KPI Stream] Successfully saved 2 citations
   ```

## 🔍 **Troubleshooting**

### **Issue: Still getting RLS errors**

1. **Verify migration applied:**

   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'results';
   ```

   Should return 4 policies.

2. **Check user is workspace member:**

   ```sql
   SELECT * FROM workspace_members WHERE user_id = auth.uid();
   ```

   Should return at least one row.

3. **Verify prompt exists and belongs to workspace:**
   ```sql
   SELECT mp.id, mp.workspace_id, wm.user_id
   FROM monitoring_prompts mp
   JOIN workspace_members wm ON wm.workspace_id = mp.workspace_id
   WHERE wm.user_id = auth.uid();
   ```

### **Issue: Policies exist but aren't working**

Try recreating them manually:

```sql
-- Drop and recreate a specific policy
DROP POLICY IF EXISTS "Users can insert results for their workspaces" ON results;

CREATE POLICY "Users can insert results for their workspaces"
ON results
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM monitoring_prompts mp
    JOIN workspace_members wm ON wm.workspace_id = mp.workspace_id
    WHERE mp.id = results.prompt_id
      AND wm.user_id = auth.uid()
  )
);
```

## 📊 **Performance Considerations**

The RLS policies use JOINs to check permissions. To ensure good performance:

1. ✅ Indexes on `prompt_id` and `result_id` (created by this migration)
2. ✅ Indexes on `workspace_id` and `user_id` (should exist from earlier migrations)
3. ✅ Policies check only necessary tables (optimized query path)

For most workspaces (< 10,000 results), performance impact is negligible.

## 🔗 **Related Files**

- **Migration**: `/lib/supabase/migrations/016_fix_results_rls_policies.sql`
- **API Endpoint**: `/app/api/measure/daily-stream/route.ts`
- **Types**: `/lib/supabase/types.ts`
- **Previous Migrations**:
  - `014_enhance_for_competitor_tracking.sql` (added new columns)
  - `015_add_llm_columns_to_results.sql` (added LLM columns)

## 🎉 **What You Can Do Now**

After this migration:

- ✅ **Calculate KPIs** without RLS errors
- ✅ **View results** on the Results page
- ✅ **Expand prompts** to see detailed analysis
- ✅ **Export data** with citations
- ✅ **Track brand mentions** across all LLM responses

---

**Status**: ✅ Ready to apply
**Dependencies**: Migrations 001-015 must be applied first
**Risk Level**: Low (only affects RLS policies, doesn't modify data)
