-- Migration: Remove UNIQUE constraint from stripe_customer_id
-- Reason: Multiple workspaces can share the same Stripe customer ID
-- Each workspace should have its own stripe_subscription_id (which remains UNIQUE)

-- Drop the existing UNIQUE constraint on stripe_customer_id if it exists
-- Check if the constraint exists first
DO $$
BEGIN
  -- Drop the unique constraint if it exists
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'workspaces_stripe_customer_id_key'
  ) THEN
    ALTER TABLE workspaces 
    DROP CONSTRAINT workspaces_stripe_customer_id_key;
    
    RAISE NOTICE 'Dropped unique constraint workspaces_stripe_customer_id_key';
  ELSE
    RAISE NOTICE 'Unique constraint workspaces_stripe_customer_id_key does not exist';
  END IF;
END $$;

-- Ensure stripe_subscription_id remains UNIQUE (each workspace has its own subscription)
-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'workspaces_stripe_subscription_id_key'
  ) THEN
    -- Only add constraint if there are no duplicate subscription IDs
    -- (Allow NULLs but ensure uniqueness for non-NULL values)
    ALTER TABLE workspaces 
    ADD CONSTRAINT workspaces_stripe_subscription_id_key 
    UNIQUE (stripe_subscription_id);
    
    RAISE NOTICE 'Added unique constraint workspaces_stripe_subscription_id_key';
  ELSE
    RAISE NOTICE 'Unique constraint workspaces_stripe_subscription_id_key already exists';
  END IF;
END $$;

-- Keep the index on stripe_customer_id for performance (but without unique constraint)
CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer ON workspaces(stripe_customer_id);

-- Add index on stripe_subscription_id for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_subscription ON workspaces(stripe_subscription_id);

COMMENT ON COLUMN workspaces.stripe_customer_id IS 'Stripe customer ID - can be shared across multiple workspaces (same account)';
COMMENT ON COLUMN workspaces.stripe_subscription_id IS 'Stripe subscription ID - unique per workspace (each workspace has its own subscription)';

