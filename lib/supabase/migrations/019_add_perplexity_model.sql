-- Migration 019: Add Perplexity model to the models table
-- This allows the KPI calculation system to reference Perplexity as a model

INSERT INTO models (id, name, provider, version)
VALUES (
  'perplexity',
  'Perplexity AI',
  'perplexity',
  'sonar-medium-online'
)
ON CONFLICT (id) DO NOTHING;

-- Verify the insertion
SELECT * FROM models WHERE id = 'perplexity';

