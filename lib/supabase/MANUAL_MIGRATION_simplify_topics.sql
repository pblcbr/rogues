-- IMPORTANT: This migration needs to be run manually in Supabase SQL Editor
-- Removes unused fields from topics table: description, category, priority, keywords, why_it_matters
-- Keep only: name, source, is_selected

-- Drop indexes on removed columns
DROP INDEX IF EXISTS idx_topics_category;
DROP INDEX IF EXISTS idx_topics_priority;

-- Drop the columns
ALTER TABLE topics
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS keywords,
DROP COLUMN IF EXISTS why_it_matters;

-- Update the save_registration_data function to only use required fields
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

  -- Insert topics (simplified - only name required)
  IF p_topics IS NOT NULL THEN
    FOR topic_record IN SELECT * FROM jsonb_array_elements(p_topics)
    LOOP
      INSERT INTO topics (
        workspace_id,
        name,
        source,
        is_selected
      ) VALUES (
        p_workspace_id,
        topic_record->>'name',
        COALESCE(topic_record->>'source', 'ai_generated'),
        COALESCE((topic_record->>'is_selected')::BOOLEAN, TRUE)
      );
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE topics IS 'Monitoring topic categories for AEO tracking';
COMMENT ON COLUMN topics.name IS 'Topic name (e.g., Brand Awareness, Competitive Analysis)';
COMMENT ON COLUMN topics.source IS 'Origin of the topic: ai_generated or custom';
COMMENT ON COLUMN topics.is_selected IS 'Whether the user has selected this topic for monitoring';

