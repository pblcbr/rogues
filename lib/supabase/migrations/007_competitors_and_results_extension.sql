-- Migration 007: Competitors and results extension

-- Competitors per workspace (up to 5 suggested)
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  brand_terms TEXT[], -- optional synonyms/aliases
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitors_workspace ON competitors(workspace_id);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own competitors" ON competitors FOR SELECT
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY "manage own competitors" ON competitors FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

-- Extend results with competitor_mentions count
ALTER TABLE results
ADD COLUMN IF NOT EXISTS competitor_mentions INTEGER DEFAULT 0;


