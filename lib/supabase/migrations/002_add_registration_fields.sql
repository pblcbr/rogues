-- Migration: Add Registration Flow Fields
-- This adds all the fields needed to store complete registration data

-- ============================================
-- 1. UPDATE PROFILES TABLE
-- ============================================

-- Add brand information fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS brand_website TEXT,
ADD COLUMN IF NOT EXISTS brand_description TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

-- Add visibility analysis (stored as JSONB for flexibility)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS visibility_analysis JSONB;

-- Add index for workspace_id
CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON profiles(workspace_id);

-- ============================================
-- 2. CREATE TOPICS TABLE
-- ============================================

-- Topics are the monitoring categories (not individual prompts)
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('awareness', 'consideration', 'decision', 'retention', 'advocacy')),
  estimated_prompts INTEGER DEFAULT 10,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  keywords TEXT[], -- Array of keywords
  why_it_matters TEXT,
  source TEXT DEFAULT 'ai_generated' CHECK (source IN ('ai_generated', 'custom')),
  is_selected BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for topics
CREATE INDEX IF NOT EXISTS idx_topics_workspace ON topics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
CREATE INDEX IF NOT EXISTS idx_topics_priority ON topics(priority);

-- ============================================
-- 3. UPDATE MONITORING_PROMPTS TABLE
-- ============================================

-- Add topic relationship to prompts
ALTER TABLE monitoring_prompts
ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS intent TEXT CHECK (intent IN ('informational', 'transactional', 'comparative', 'navigational')),
ADD COLUMN IF NOT EXISTS persona TEXT,
ADD COLUMN IF NOT EXISTS funnel_stage TEXT CHECK (funnel_stage IN ('TOFU', 'MOFU', 'BOFU'));

-- Add index for topic_id
CREATE INDEX IF NOT EXISTS idx_monitoring_prompts_topic ON monitoring_prompts(topic_id);

-- ============================================
-- 4. ROW LEVEL SECURITY FOR TOPICS
-- ============================================

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Users can view topics from own workspaces
CREATE POLICY "Users can view topics from own workspaces"
  ON topics FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Users can manage topics in own workspaces
CREATE POLICY "Users can manage topics in own workspaces"
  ON topics FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- 5. UPDATED_AT TRIGGER FOR TOPICS
-- ============================================

CREATE TRIGGER set_updated_at_topics
  BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- 6. HELPER FUNCTION TO SAVE REGISTRATION DATA
-- ============================================

-- Function to save complete registration data after payment
CREATE OR REPLACE FUNCTION public.save_registration_data(
  p_user_id UUID,
  p_workspace_id UUID,
  p_brand_website TEXT,
  p_brand_description TEXT,
  p_region TEXT,
  p_language TEXT,
  p_visibility_analysis JSONB,
  p_topics JSONB -- Array of topics with their data
)
RETURNS VOID AS $$
DECLARE
  topic_record JSONB;
  topic_id UUID;
BEGIN
  -- Update profile with registration data
  UPDATE profiles
  SET
    brand_website = p_brand_website,
    brand_description = p_brand_description,
    region = p_region,
    language = p_language,
    visibility_analysis = p_visibility_analysis,
    workspace_id = p_workspace_id,
    onboarding_completed = TRUE
  WHERE id = p_user_id;

  -- Insert topics
  IF p_topics IS NOT NULL THEN
    FOR topic_record IN SELECT * FROM jsonb_array_elements(p_topics)
    LOOP
      INSERT INTO topics (
        workspace_id,
        name,
        description,
        category,
        estimated_prompts,
        priority,
        keywords,
        why_it_matters,
        source,
        is_selected
      ) VALUES (
        p_workspace_id,
        topic_record->>'name',
        topic_record->>'description',
        topic_record->>'category',
        (topic_record->>'estimated_prompts')::INTEGER,
        topic_record->>'priority',
        ARRAY(SELECT jsonb_array_elements_text(topic_record->'keywords')),
        topic_record->>'why_it_matters',
        COALESCE(topic_record->>'source', 'ai_generated'),
        COALESCE((topic_record->>'is_selected')::BOOLEAN, TRUE)
      );
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE topics IS 'Monitoring topic categories for AEO tracking';
COMMENT ON COLUMN profiles.brand_website IS 'Company website/domain being monitored';
COMMENT ON COLUMN profiles.brand_description IS 'Optional brand description for AI context';
COMMENT ON COLUMN profiles.region IS 'Primary region for monitoring (e.g., United States, Spain)';
COMMENT ON COLUMN profiles.language IS 'Primary language for monitoring (e.g., English (en), Spanish (es))';
COMMENT ON COLUMN profiles.visibility_analysis IS 'AI visibility analysis results (competitor rankings, opportunities)';
COMMENT ON COLUMN profiles.workspace_id IS 'Reference to user workspace (set after payment)';

