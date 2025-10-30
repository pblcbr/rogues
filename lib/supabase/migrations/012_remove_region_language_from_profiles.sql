-- Migration: Remove region and language columns from profiles table
-- These fields now belong to workspaces, not profiles
-- Run this migration after ensuring all workspaces have region/language set

-- ============================================
-- 1. MIGRATE EXISTING DATA (if any)
-- ============================================

-- Update workspaces with region/language from profiles if workspace doesn't have them
-- This ensures we don't lose data during the migration
UPDATE workspaces w
SET 
  region = COALESCE(w.region, p.region),
  language = COALESCE(w.language, p.language)
FROM profiles p
WHERE w.id = p.workspace_id
  AND (w.region IS NULL OR w.language IS NULL)
  AND (p.region IS NOT NULL OR p.language IS NOT NULL);

-- ============================================
-- 2. UPDATE HELPER FUNCTION
-- ============================================

-- Update save_registration_data function to remove region/language parameters
CREATE OR REPLACE FUNCTION public.save_registration_data(
  p_user_id UUID,
  p_workspace_id UUID,
  p_brand_website TEXT,
  p_brand_description TEXT,
  p_visibility_analysis JSONB,
  p_topics JSONB -- Array of topics with their data
)
RETURNS VOID AS $$
DECLARE
  topic_record JSONB;
  topic_id UUID;
BEGIN
  -- Update profile with registration data (NOT region/language - those belong to workspace)
  UPDATE profiles
  SET
    brand_website = p_brand_website,
    brand_description = p_brand_description,
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
-- 3. REMOVE COLUMNS FROM PROFILES
-- ============================================

-- Remove region and language columns from profiles table
ALTER TABLE profiles 
DROP COLUMN IF EXISTS region,
DROP COLUMN IF EXISTS language;

-- Remove comments for region and language (they are no longer in this table)
COMMENT ON COLUMN profiles.brand_website IS 'Company website/domain being monitored';
COMMENT ON COLUMN profiles.brand_description IS 'Optional brand description for AI context';
COMMENT ON COLUMN profiles.visibility_analysis IS 'AI visibility analysis results (competitor rankings, opportunities)';
COMMENT ON COLUMN profiles.workspace_id IS 'Reference to user workspace (set after payment)';

-- ============================================
-- 4. NOTES
-- ============================================

-- After running this migration:
-- - Region and language are now ONLY in workspaces table
-- - Use workspace.region and workspace.language instead of profile.region/language
-- - Workspace_regions table still exists for multi-region support per workspace

