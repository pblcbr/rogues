-- Migration 006: Measurement schema (models, prompt_sets, snapshots, results, citations, authority_cache) and workspace settings

-- 1) models catalog
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY, -- e.g., 'chatgpt', 'perplexity', 'gemini'
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed a few models (safe upserts)
INSERT INTO models (id, name, provider) VALUES
  ('chatgpt','ChatGPT','openai') ON CONFLICT (id) DO NOTHING;
INSERT INTO models (id, name, provider) VALUES
  ('perplexity','Perplexity','perplexity') ON CONFLICT (id) DO NOTHING;
INSERT INTO models (id, name, provider) VALUES
  ('gemini','Gemini','google') ON CONFLICT (id) DO NOTHING;

-- 2) workspaces.settings JSONB
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- 3) prompt_sets (optional logical grouping)
CREATE TABLE IF NOT EXISTS prompt_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prompt_sets_workspace ON prompt_sets(workspace_id);

-- 4) snapshots
CREATE TABLE IF NOT EXISTS snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL REFERENCES models(id) ON DELETE RESTRICT,
  prompt_set_id UUID REFERENCES prompt_sets(id) ON DELETE SET NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_snapshots_workspace_time ON snapshots(workspace_id, captured_at DESC);

-- 5) results (per prompt in a snapshot)
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_id UUID NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES monitoring_prompts(id) ON DELETE SET NULL,
  prompt_text TEXT NOT NULL,
  mention_present BOOLEAN DEFAULT FALSE,
  citations_count INTEGER DEFAULT 0,
  sentiment NUMERIC,
  prominence NUMERIC,
  alignment NUMERIC,
  raw_answer JSONB
);
CREATE INDEX IF NOT EXISTS idx_results_snapshot ON results(snapshot_id);

-- 6) citations (extracted from result)
CREATE TABLE IF NOT EXISTS citations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  result_id UUID NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  url TEXT,
  authority_cached NUMERIC,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_citations_domain ON citations(domain);

-- 7) authority_cache
CREATE TABLE IF NOT EXISTS authority_cache (
  domain TEXT PRIMARY KEY,
  da NUMERIC,
  dr NUMERIC,
  tf NUMERIC,
  topical NUMERIC,
  authority NUMERIC,
  refreshed_at TIMESTAMPTZ
);

-- 8) RLS
ALTER TABLE prompt_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own prompt_sets" ON prompt_sets FOR SELECT
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY "manage own prompt_sets" ON prompt_sets FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

CREATE POLICY "view own snapshots" ON snapshots FOR SELECT
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY "manage own snapshots" ON snapshots FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

CREATE POLICY "view own results" ON results FOR SELECT
  USING (snapshot_id IN (
    SELECT id FROM snapshots WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  ));
CREATE POLICY "manage own results" ON results FOR ALL
  USING (snapshot_id IN (
    SELECT id FROM snapshots WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  ));

CREATE POLICY "view own citations" ON citations FOR SELECT
  USING (result_id IN (
    SELECT id FROM results WHERE snapshot_id IN (
      SELECT id FROM snapshots WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    )
  ));
CREATE POLICY "manage own citations" ON citations FOR ALL
  USING (result_id IN (
    SELECT id FROM results WHERE snapshot_id IN (
      SELECT id FROM snapshots WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    )
  ));


