-- Migration 014: Enhanced Schema for Competitor Tracking and Citations
-- This migration adds support for:
-- - Competitor tracking per topic
-- - Full response text storage
-- - Brand detection and positioning
-- - Enhanced citation details
-- - Topic-level aggregated KPIs

-- ============================================================================
-- 1. Enhance TOPICS table to store competitors
-- ============================================================================

ALTER TABLE topics 
  ADD COLUMN IF NOT EXISTS competitors jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS competitor_count integer GENERATED ALWAYS AS (jsonb_array_length(competitors)) STORED;

COMMENT ON COLUMN topics.competitors IS 'List of competitor brand names to track for this topic. Example: ["Flagsmith", "ConfigCat", "LaunchDarkly"]';
COMMENT ON COLUMN topics.competitor_count IS 'Auto-calculated count of competitors';

-- ============================================================================
-- 2. Enhance RESULTS table for brand detection and full responses
-- ============================================================================

ALTER TABLE results 
  ADD COLUMN IF NOT EXISTS response_text text,
  ADD COLUMN IF NOT EXISTS brands_mentioned jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brand_positions jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS our_brand_mentioned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS our_brand_position integer,
  ADD COLUMN IF NOT EXISTS relevancy_score decimal(5,2) DEFAULT 0;

COMMENT ON COLUMN results.response_text IS 'Full text response from the LLM';
COMMENT ON COLUMN results.brands_mentioned IS 'Array of brand names mentioned in response. Example: ["Flagsmith", "ConfigCat"]';
COMMENT ON COLUMN results.brand_positions IS 'Object mapping brand names to their positions. Example: {"Flagsmith": 1, "ConfigCat": 2}';
COMMENT ON COLUMN results.our_brand_mentioned IS 'Whether our brand was mentioned in this response';
COMMENT ON COLUMN results.our_brand_position IS 'Position of our brand (1 = first mentioned)';
COMMENT ON COLUMN results.relevancy_score IS 'Score 0-100: How relevant is this response to our tracking (mentions us or competitors)';

-- ============================================================================
-- 3. Enhance CITATIONS table with more details
-- ============================================================================

ALTER TABLE citations 
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS favicon_url text,
  ADD COLUMN IF NOT EXISTS position integer;

COMMENT ON COLUMN citations.title IS 'Page title of the cited URL';
COMMENT ON COLUMN citations.domain IS 'Extracted domain from URL (e.g., "configcat.com")';
COMMENT ON COLUMN citations.favicon_url IS 'URL to the favicon for display';
COMMENT ON COLUMN citations.position IS 'Position of citation in the response (1 = first cited)';

-- Create index for domain lookups
CREATE INDEX IF NOT EXISTS idx_citations_domain ON citations(domain);

-- ============================================================================
-- 4. Create TOPIC_KPI_SNAPSHOTS table for aggregated metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS topic_kpi_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workspace_region_id uuid REFERENCES workspace_regions(id) ON DELETE SET NULL,
  snapshot_date date NOT NULL,
  
  -- Visibility metrics
  visibility_score integer DEFAULT 0 CHECK (visibility_score >= 0 AND visibility_score <= 100),
  our_brand_mention_count integer DEFAULT 0,
  
  -- Relevancy metrics
  relevancy_score integer DEFAULT 0 CHECK (relevancy_score >= 0 AND relevancy_score <= 100),
  total_brand_mentions integer DEFAULT 0,
  
  -- Positioning metrics
  avg_rank decimal(5,2),
  best_rank integer,
  worst_rank integer,
  
  -- Citations
  total_citations integer DEFAULT 0,
  unique_domains_cited integer DEFAULT 0,
  
  -- Competitor analysis
  competitor_mentions jsonb DEFAULT '{}'::jsonb,
  competitor_positions jsonb DEFAULT '{}'::jsonb,
  
  -- Measurement details
  total_prompts_measured integer DEFAULT 0,
  total_llm_queries integer DEFAULT 0,
  
  -- LLM details
  llm_provider text DEFAULT 'openai',
  llm_model text DEFAULT 'gpt-4o',
  
  -- Timestamps
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint: one snapshot per topic per date
  CONSTRAINT unique_topic_snapshot_per_date UNIQUE (topic_id, snapshot_date)
);

-- Comments
COMMENT ON TABLE topic_kpi_snapshots IS 'Daily aggregated KPI snapshots for topics, combining all prompts under that topic';
COMMENT ON COLUMN topic_kpi_snapshots.visibility_score IS 'Percentage (0-100) of responses that mention our brand';
COMMENT ON COLUMN topic_kpi_snapshots.relevancy_score IS 'Percentage (0-100) of responses that mention our brand OR any competitor';
COMMENT ON COLUMN topic_kpi_snapshots.avg_rank IS 'Average position where our brand appears (1 = first mentioned, lower is better)';
COMMENT ON COLUMN topic_kpi_snapshots.competitor_mentions IS 'Count of mentions per competitor. Example: {"Flagsmith": 15, "ConfigCat": 12}';
COMMENT ON COLUMN topic_kpi_snapshots.competitor_positions IS 'Average positions per competitor. Example: {"Flagsmith": 1.5, "ConfigCat": 2.3}';

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_topic_kpi_snapshots_topic_id ON topic_kpi_snapshots(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_kpi_snapshots_workspace_id ON topic_kpi_snapshots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_topic_kpi_snapshots_snapshot_date ON topic_kpi_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_topic_kpi_snapshots_workspace_region_id ON topic_kpi_snapshots(workspace_region_id);

-- ============================================================================
-- 5. Row Level Security for topic_kpi_snapshots
-- ============================================================================

ALTER TABLE topic_kpi_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view snapshots for their workspaces
CREATE POLICY "Users can view topic KPI snapshots for their workspaces"
  ON topic_kpi_snapshots
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm 
      WHERE wm.user_id = auth.uid()
    )
  );

-- Policy: Users can insert snapshots for their workspaces
CREATE POLICY "Users can insert topic KPI snapshots for their workspaces"
  ON topic_kpi_snapshots
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm 
      WHERE wm.user_id = auth.uid()
    )
  );

-- Policy: Users can update snapshots for their workspaces
CREATE POLICY "Users can update topic KPI snapshots for their workspaces"
  ON topic_kpi_snapshots
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm 
      WHERE wm.user_id = auth.uid()
    )
  );

-- Policy: Users can delete snapshots for their workspaces
CREATE POLICY "Users can delete topic KPI snapshots for their workspaces"
  ON topic_kpi_snapshots
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm 
      WHERE wm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. Helper function to update topic snapshot
-- ============================================================================

CREATE OR REPLACE FUNCTION update_topic_kpi_snapshot_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_topic_kpi_snapshots_updated_at
  BEFORE UPDATE ON topic_kpi_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_kpi_snapshot_timestamp();

-- ============================================================================
-- Migration complete
-- ============================================================================

