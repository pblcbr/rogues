-- Migration 018: Add active LLMs configuration to workspaces
-- Allows workspaces to configure which LLM providers to use based on their plan

-- Add active_llms column to workspaces table
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS active_llms TEXT[] DEFAULT ARRAY['openai']::TEXT[];

COMMENT ON COLUMN workspaces.active_llms IS 'Array of active LLM provider IDs (e.g., ["openai", "perplexity"])';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_workspaces_active_llms ON workspaces USING GIN (active_llms);

-- Update existing workspaces to have OpenAI as default
UPDATE workspaces
SET active_llms = ARRAY['openai']::TEXT[]
WHERE active_llms IS NULL OR active_llms = '{}';

-- Validate function to ensure LLMs respect plan limits
CREATE OR REPLACE FUNCTION validate_workspace_llms()
RETURNS TRIGGER AS $$
DECLARE
  max_engines INTEGER;
BEGIN
  -- Get max engines allowed for this workspace's plan
  CASE NEW.plan
    WHEN 'starter', 'starter-yearly' THEN max_engines := 1;
    WHEN 'growth', 'growth-yearly' THEN max_engines := 3;
    WHEN 'enterprise' THEN max_engines := -1; -- Unlimited
    ELSE max_engines := 1;
  END CASE;

  -- Check if number of active LLMs exceeds limit (unless unlimited)
  IF max_engines != -1 AND array_length(NEW.active_llms, 1) > max_engines THEN
    RAISE EXCEPTION 'Plan % only allows % LLM engine(s), but % were provided',
      NEW.plan, max_engines, array_length(NEW.active_llms, 1);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate LLMs on insert/update
DROP TRIGGER IF EXISTS validate_workspace_llms_trigger ON workspaces;
CREATE TRIGGER validate_workspace_llms_trigger
  BEFORE INSERT OR UPDATE OF active_llms, plan ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION validate_workspace_llms();

