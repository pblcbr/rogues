-- Migration 016: Fix RLS Policies for Results and Citations Tables
-- This migration ensures that users can INSERT, SELECT, UPDATE, and DELETE
-- results and citations for workspaces they belong to

-- ============================================================================
-- 1. Drop existing policies (if any) to start fresh
-- ============================================================================

DROP POLICY IF EXISTS "Users can view results from their workspaces" ON results;
DROP POLICY IF EXISTS "Users can insert results for their workspaces" ON results;
DROP POLICY IF EXISTS "Users can update results for their workspaces" ON results;
DROP POLICY IF EXISTS "Users can delete results for their workspaces" ON results;

DROP POLICY IF EXISTS "Users can view citations from their workspaces" ON citations;
DROP POLICY IF EXISTS "Users can insert citations for their workspaces" ON citations;
DROP POLICY IF EXISTS "Users can update citations for their workspaces" ON citations;
DROP POLICY IF EXISTS "Users can delete citations for their workspaces" ON citations;

-- ============================================================================
-- 2. Enable RLS on tables (if not already enabled)
-- ============================================================================

ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Create comprehensive RLS policies for RESULTS table
-- ============================================================================
-- Note: We use prompt_id directly to avoid recursion through workspace_members

-- SELECT: Users can view results for prompts in their workspaces
CREATE POLICY "Users can view results from their workspaces"
ON results
FOR SELECT
TO authenticated
USING (
  prompt_id IN (
    SELECT mp.id 
    FROM monitoring_prompts mp
    WHERE mp.workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- INSERT: Users can insert results for prompts in their workspaces
CREATE POLICY "Users can insert results for their workspaces"
ON results
FOR INSERT
TO authenticated
WITH CHECK (
  prompt_id IN (
    SELECT mp.id 
    FROM monitoring_prompts mp
    WHERE mp.workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- UPDATE: Users can update results for prompts in their workspaces
CREATE POLICY "Users can update results for their workspaces"
ON results
FOR UPDATE
TO authenticated
USING (
  prompt_id IN (
    SELECT mp.id 
    FROM monitoring_prompts mp
    WHERE mp.workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  prompt_id IN (
    SELECT mp.id 
    FROM monitoring_prompts mp
    WHERE mp.workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- DELETE: Users can delete results for prompts in their workspaces
CREATE POLICY "Users can delete results for their workspaces"
ON results
FOR DELETE
TO authenticated
USING (
  prompt_id IN (
    SELECT mp.id 
    FROM monitoring_prompts mp
    WHERE mp.workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 4. Create comprehensive RLS policies for CITATIONS table
-- ============================================================================
-- Note: We use nested subqueries to avoid recursion through workspace_members

-- SELECT: Users can view citations for results in their workspaces
CREATE POLICY "Users can view citations from their workspaces"
ON citations
FOR SELECT
TO authenticated
USING (
  result_id IN (
    SELECT r.id 
    FROM results r
    WHERE r.prompt_id IN (
      SELECT mp.id 
      FROM monitoring_prompts mp
      WHERE mp.workspace_id IN (
        SELECT workspace_id 
        FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- INSERT: Users can insert citations for results in their workspaces
CREATE POLICY "Users can insert citations for their workspaces"
ON citations
FOR INSERT
TO authenticated
WITH CHECK (
  result_id IN (
    SELECT r.id 
    FROM results r
    WHERE r.prompt_id IN (
      SELECT mp.id 
      FROM monitoring_prompts mp
      WHERE mp.workspace_id IN (
        SELECT workspace_id 
        FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- UPDATE: Users can update citations for results in their workspaces
CREATE POLICY "Users can update citations for their workspaces"
ON citations
FOR UPDATE
TO authenticated
USING (
  result_id IN (
    SELECT r.id 
    FROM results r
    WHERE r.prompt_id IN (
      SELECT mp.id 
      FROM monitoring_prompts mp
      WHERE mp.workspace_id IN (
        SELECT workspace_id 
        FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  result_id IN (
    SELECT r.id 
    FROM results r
    WHERE r.prompt_id IN (
      SELECT mp.id 
      FROM monitoring_prompts mp
      WHERE mp.workspace_id IN (
        SELECT workspace_id 
        FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- DELETE: Users can delete citations for results in their workspaces
CREATE POLICY "Users can delete citations for their workspaces"
ON citations
FOR DELETE
TO authenticated
USING (
  result_id IN (
    SELECT r.id 
    FROM results r
    WHERE r.prompt_id IN (
      SELECT mp.id 
      FROM monitoring_prompts mp
      WHERE mp.workspace_id IN (
        SELECT workspace_id 
        FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- ============================================================================
-- 5. Create indexes to optimize RLS policy checks
-- ============================================================================

-- Index on results.prompt_id for faster policy lookups
CREATE INDEX IF NOT EXISTS idx_results_prompt_id ON results(prompt_id);

-- Index on citations.result_id for faster policy lookups
CREATE INDEX IF NOT EXISTS idx_citations_result_id ON citations(result_id);

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Run this to verify policies were created:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('results', 'citations')
-- ORDER BY tablename, cmd;

