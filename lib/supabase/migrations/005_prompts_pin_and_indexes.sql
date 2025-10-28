-- Migration 005: Pin prompts and helpful indexes

ALTER TABLE monitoring_prompts
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Fast counts
CREATE INDEX IF NOT EXISTS idx_monitoring_prompts_active ON monitoring_prompts(workspace_id, is_active);
CREATE INDEX IF NOT EXISTS idx_monitoring_prompts_pinned ON monitoring_prompts(workspace_id, is_pinned);


