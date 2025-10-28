-- Migration 004: Prompt generation jobs and monitoring_prompts versioning

-- 1) prompt_generation_jobs table
CREATE TABLE IF NOT EXISTS prompt_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed','skipped')),
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('webhook','manual','system')),
  count_per_topic INTEGER DEFAULT 8,
  topics_snapshot JSONB,
  error JSONB,
  idempotency_key TEXT UNIQUE,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_jobs_workspace ON prompt_generation_jobs(workspace_id);

-- 2) monitoring_prompts: add version (for replace-mode regeneration)
ALTER TABLE monitoring_prompts
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 3) RLS for prompt_generation_jobs
ALTER TABLE prompt_generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view jobs in own workspaces"
  ON prompt_generation_jobs FOR SELECT
  USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can manage jobs in own workspaces"
  ON prompt_generation_jobs FOR ALL
  USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );


