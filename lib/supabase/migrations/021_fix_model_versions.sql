-- Migration 021: Fix model versions for Claude and Perplexity
-- This updates the model versions to the correct API names

-- Update Perplexity model version
UPDATE models 
SET version = 'sonar-medium-online'
WHERE id = 'perplexity';

-- Update Claude model version
UPDATE models 
SET version = 'claude-sonnet-4-20250514'
WHERE id = 'claude';

-- Verify the updates
SELECT id, name, provider, version FROM models WHERE id IN ('perplexity', 'claude');

