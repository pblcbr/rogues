-- Quick check: Verify if critical columns exist in results table
-- Run this in Supabase SQL Editor

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'results' AND column_name = 'response_text'
    ) THEN '✓ response_text exists'
    ELSE '✗ response_text MISSING - Run migration 014!'
  END as column_1,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'results' AND column_name = 'brands_mentioned'
    ) THEN '✓ brands_mentioned exists'
    ELSE '✗ brands_mentioned MISSING - Run migration 014!'
  END as column_2,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'results' AND column_name = 'brand_positions'
    ) THEN '✓ brand_positions exists'
    ELSE '✗ brand_positions MISSING - Run migration 014!'
  END as column_3,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'results' AND column_name = 'our_brand_mentioned'
    ) THEN '✓ our_brand_mentioned exists'
    ELSE '✗ our_brand_mentioned MISSING - Run migration 014!'
  END as column_4,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'results' AND column_name = 'our_brand_position'
    ) THEN '✓ our_brand_position exists'
    ELSE '✗ our_brand_position MISSING - Run migration 014!'
  END as column_5,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'results' AND column_name = 'relevancy_score'
    ) THEN '✓ relevancy_score exists'
    ELSE '✗ relevancy_score MISSING - Run migration 014!'
  END as column_6;

-- Also check citations table
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'citations' AND column_name = 'title'
    ) THEN '✓ title exists in citations'
    ELSE '✗ title MISSING in citations - Run migration 014!'
  END as citations_column_1,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'citations' AND column_name = 'domain'
    ) THEN '✓ domain exists in citations'
    ELSE '✗ domain MISSING in citations - Run migration 014!'
  END as citations_column_2,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'citations' AND column_name = 'favicon_url'
    ) THEN '✓ favicon_url exists in citations'
    ELSE '✗ favicon_url MISSING in citations - Run migration 014!'
  END as citations_column_3;

-- Check if there's any data
SELECT 
  (SELECT COUNT(*) FROM results) as total_results,
  (SELECT COUNT(*) FROM citations) as total_citations,
  (SELECT COUNT(*) FROM monitoring_prompts WHERE is_active = true) as active_prompts;

