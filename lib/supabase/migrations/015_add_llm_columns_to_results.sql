-- Migration 015: Add LLM Provider and Model columns to results table
-- This migration adds tracking for which LLM generated each result

-- ============================================================================
-- Add LLM tracking columns to RESULTS table
-- ============================================================================

ALTER TABLE results 
  ADD COLUMN IF NOT EXISTS llm_provider text,
  ADD COLUMN IF NOT EXISTS llm_model text;

-- Add indexes for filtering by LLM provider/model
CREATE INDEX IF NOT EXISTS idx_results_llm_provider ON results(llm_provider);
CREATE INDEX IF NOT EXISTS idx_results_llm_model ON results(llm_model);

-- Add comments for documentation
COMMENT ON COLUMN results.llm_provider IS 'LLM provider that generated this result (e.g., "openai", "anthropic", "google")';
COMMENT ON COLUMN results.llm_model IS 'Specific model used (e.g., "gpt-4o", "claude-3-opus", "gemini-pro")';

-- Optional: Set default values for existing rows (if any)
-- UPDATE results 
-- SET 
--   llm_provider = 'openai',
--   llm_model = 'gpt-4o'
-- WHERE llm_provider IS NULL;

