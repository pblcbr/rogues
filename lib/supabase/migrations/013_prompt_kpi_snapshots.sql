-- Migration: Create table for daily KPI snapshots per prompt
-- Stores visibility KPIs calculated daily for active prompts using LLM analysis

CREATE TABLE IF NOT EXISTS prompt_kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL REFERENCES monitoring_prompts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Visibility KPIs
  visibility_score INTEGER, -- 0-100 composite score
  mention_rate INTEGER, -- Percentage 0-100
  citation_rate INTEGER, -- Percentage 0-100
  avg_position NUMERIC, -- Average prominence position (0-1)
  
  -- Detailed metrics
  total_measurements INTEGER DEFAULT 0, -- Number of LLM responses analyzed
  mention_count INTEGER DEFAULT 0, -- Number of times brand was mentioned
  citation_count INTEGER DEFAULT 0, -- Total number of citations found
  avg_sentiment NUMERIC, -- Average sentiment score (-1 to 1)
  avg_prominence NUMERIC, -- Average prominence score (0-1)
  avg_alignment NUMERIC, -- Average alignment score (0-1)
  avg_citation_authority NUMERIC, -- Average authority of citations (0-1)
  
  -- Metadata
  llm_provider TEXT, -- 'openai', 'anthropic', etc.
  llm_model TEXT, -- Model used for calculation
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one snapshot per prompt per day
  UNIQUE(prompt_id, snapshot_date)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_prompt_kpi_snapshots_prompt ON prompt_kpi_snapshots(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_kpi_snapshots_workspace ON prompt_kpi_snapshots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prompt_kpi_snapshots_date ON prompt_kpi_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_kpi_snapshots_prompt_date ON prompt_kpi_snapshots(prompt_id, snapshot_date DESC);

-- RLS
ALTER TABLE prompt_kpi_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own prompt kpi snapshots" ON prompt_kpi_snapshots FOR SELECT
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

CREATE POLICY "manage own prompt kpi snapshots" ON prompt_kpi_snapshots FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

-- Comments
COMMENT ON TABLE prompt_kpi_snapshots IS 'Daily snapshots of visibility KPIs per monitoring prompt';
COMMENT ON COLUMN prompt_kpi_snapshots.visibility_score IS 'Composite visibility score (0-100): 40% mention rate + 25% prominence + 20% citation authority + 15% alignment';
COMMENT ON COLUMN prompt_kpi_snapshots.mention_rate IS 'Percentage of AI responses that mention the brand (0-100)';
COMMENT ON COLUMN prompt_kpi_snapshots.citation_rate IS 'Percentage of AI responses that include citations (0-100)';
COMMENT ON COLUMN prompt_kpi_snapshots.avg_position IS 'Average prominence position in responses (0=early/important, 1=late/less important)';

