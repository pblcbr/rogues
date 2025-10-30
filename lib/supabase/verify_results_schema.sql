-- Verification script for Results page database schema
-- Run this in your Supabase SQL Editor to check if all required tables and columns exist

-- 1. Check if results table exists and has all required columns
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'results'
ORDER BY ordinal_position;

-- Expected columns for results table:
-- - id
-- - prompt_id
-- - snapshot_id
-- - mention_present (old, might not be used)
-- - prominence
-- - alignment  
-- - sentiment
-- - response_text (NEW - from Sprint 2)
-- - brands_mentioned (NEW - from Sprint 2)
-- - brand_positions (NEW - from Sprint 2)
-- - our_brand_mentioned (NEW - from Sprint 2)
-- - our_brand_position (NEW - from Sprint 2)
-- - relevancy_score (NEW - from Sprint 2)
-- - llm_provider
-- - llm_model
-- - created_at
-- - updated_at

-- 2. Check if citations table has enhanced columns
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'citations'
ORDER BY ordinal_position;

-- Expected columns for citations table:
-- - id
-- - result_id
-- - url
-- - title (NEW - from Sprint 2)
-- - domain (NEW - from Sprint 2)
-- - favicon_url (NEW - from Sprint 2)
-- - position (NEW - from Sprint 2)
-- - created_at

-- 3. Check if monitoring_prompts table exists
SELECT COUNT(*) as prompts_count
FROM monitoring_prompts;

-- 4. Check if results table has any data
SELECT COUNT(*) as results_count
FROM results;

-- 5. Check RLS policies on results table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'results';

-- 6. If results table doesn't have required columns, you need to run migration 014
-- Check if migration 014 has been applied:
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'results' 
        AND column_name = 'response_text'
    ) THEN 'Migration 014 appears to be applied ✓'
    ELSE 'Migration 014 NOT applied - Please run: lib/supabase/migrations/014_enhance_for_competitor_tracking.sql'
  END as migration_status;

