-- Fix profiles table for signup
-- Run this in Supabase SQL Editor
-- This fixes the NOT NULL constraint error and removes the problematic trigger

-- 1. Drop the trigger (not needed, signup endpoint creates profile manually)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Make first_name and last_name nullable (they're filled by signup endpoint)
ALTER TABLE public.profiles 
  ALTER COLUMN first_name DROP NOT NULL,
  ALTER COLUMN last_name DROP NOT NULL;

-- 3. Ensure RLS policies are correct
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow service role to insert (for signup endpoint and webhooks)
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- 4. Add workspace_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
    CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON profiles(workspace_id);
  END IF;
END $$;

-- 5. Fix RLS policies for workspaces (allow service role to insert)
DROP POLICY IF EXISTS "Service role can manage workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Service role can insert workspaces" ON public.workspaces;

-- Allow service role (used by webhooks) to insert and update workspaces
CREATE POLICY "Service role can insert workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update workspaces"
  ON public.workspaces FOR UPDATE
  USING (true);

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role, anon, authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.workspaces TO service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.workspaces TO authenticated;

-- Done! Now signup and webhooks will work correctly:
-- - No trigger to cause errors
-- - first_name and last_name can be NULL temporarily
-- - Signup endpoint fills them immediately
-- - RLS allows service role to insert profiles
-- - RLS allows service role to create workspaces (for webhooks)
-- - workspace_id column exists in profiles

