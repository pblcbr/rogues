-- Migration 020: Add Claude (Anthropic) model to the models table
-- This allows the KPI calculation system to reference Claude as a model

INSERT INTO models (id, name, provider, version)
VALUES (
  'claude',
  'Claude',
  'anthropic',
  'claude-sonnet-4-20250514'
)
ON CONFLICT (id) DO NOTHING;

-- Verify the insertion
SELECT * FROM models WHERE id = 'claude';

