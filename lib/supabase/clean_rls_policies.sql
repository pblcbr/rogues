-- Clean RLS Policies for Results and Citations
-- Run this BEFORE applying migration 016 if you have existing problematic policies

-- ============================================================================
-- Drop ALL existing policies on results and citations tables
-- ============================================================================

DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on results table
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'results'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON results', pol.policyname);
        RAISE NOTICE 'Dropped policy: % on results', pol.policyname;
    END LOOP;

    -- Drop all policies on citations table
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'citations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON citations', pol.policyname);
        RAISE NOTICE 'Dropped policy: % on citations', pol.policyname;
    END LOOP;

    RAISE NOTICE 'All policies dropped successfully. You can now apply migration 016.';
END $$;

-- Verify all policies were dropped
SELECT 
    tablename, 
    COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('results', 'citations')
GROUP BY tablename;

-- Expected output: No rows (or 0 policies for each table)

