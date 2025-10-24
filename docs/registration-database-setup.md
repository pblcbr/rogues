# Registration Database Setup

## Overview

This document explains how to set up the database to store all registration information from the 11-step registration flow.

## Data Flow

### Registration Steps

1. **Email** → Stored in `auth.users` and `profiles.email`
2. **Company Info** → `profiles.company_size`, `profiles.is_agency`
3. **Account** → `profiles.first_name`, `profiles.last_name` + password in `auth.users`
4. **Verification** → (Skipped in MVP)
5. **Brand Info** → `profiles.brand_website`, `profiles.brand_description`
6. **Region & Language** → `profiles.region`, `profiles.language`
7. **Visibility Analysis** → `profiles.visibility_analysis` (JSONB)
8. **Topics** → `topics` table (multiple rows per workspace)
9. **Pricing** → `workspaces.plan`
10. **Payment** → `workspaces.stripe_customer_id`, `workspaces.stripe_subscription_id`
11. **Welcome** → Onboarding complete

### When Data is Saved

1. **During Signup (Step 3)**:
   - User created in `auth.users`
   - Profile created in `profiles` with `email`, `first_name`, `last_name`

2. **Before Stripe Checkout (Step 9)**:
   - Brand info, region, language, and visibility analysis saved to `profiles`
   - This ensures data is preserved even if webhook fails

3. **After Stripe Payment (Webhook)**:
   - Workspace created in `workspaces`
   - Profile updated with `workspace_id` and `onboarding_completed = true`

4. **After Payment Processing (Frontend)**:
   - Topics saved to `topics` table
   - All registration data is now in the database

## Database Schema Changes

### Run this SQL in Supabase SQL Editor

```sql
-- Run the migration file
\i lib/supabase/migrations/002_add_registration_fields.sql
```

Or copy the contents of `/lib/supabase/migrations/002_add_registration_fields.sql` and run it in the Supabase SQL Editor.

## New Tables

### `topics`

Stores monitoring topic categories (not individual prompts).

**Columns:**

- `id` (UUID, PK)
- `workspace_id` (UUID, FK to workspaces)
- `name` (TEXT) - Topic name (e.g., "Brand Awareness & Recognition")
- `description` (TEXT) - What this topic covers
- `category` (TEXT) - awareness, consideration, decision, retention, advocacy
- `estimated_prompts` (INTEGER) - How many prompts this topic will generate
- `priority` (TEXT) - high, medium, low
- `keywords` (TEXT[]) - Array of relevant keywords
- `why_it_matters` (TEXT) - Business value explanation
- `source` (TEXT) - ai_generated or custom
- `is_selected` (BOOLEAN) - Whether user selected this topic
- `created_at`, `updated_at` (TIMESTAMPTZ)

## Updated Tables

### `profiles`

**New Columns:**

- `brand_website` (TEXT) - Company website/domain
- `brand_description` (TEXT) - Optional brand description
- `region` (TEXT) - Primary region (e.g., "United States", "Spain")
- `language` (TEXT) - Primary language (e.g., "English (en)", "Spanish (es)")
- `visibility_analysis` (JSONB) - AI visibility analysis results
- `workspace_id` (UUID, FK) - Reference to workspace (set after payment)

### `monitoring_prompts`

**New Columns:**

- `topic_id` (UUID, FK) - Link to parent topic
- `category` (TEXT) - Prompt category
- `intent` (TEXT) - informational, transactional, comparative, navigational
- `persona` (TEXT) - Target persona
- `funnel_stage` (TEXT) - TOFU, MOFU, BOFU

## API Endpoints

### New Endpoints

#### `POST /api/workspace/initialize`

Saves all registration data after workspace creation.

**Request Body:**

```json
{
  "workspaceId": "uuid",
  "brandWebsite": "taclia.com",
  "brandDescription": "Invoicing software...",
  "region": "Spain",
  "language": "Spanish (es)",
  "visibilityAnalysis": {
    "client_rank": 15,
    "competitors": [...],
    "opportunities_found": 10
  },
  "generatedTopics": [...],
  "selectedTopics": ["Topic 1", "Topic 2"],
  "customTopics": ["Custom Topic"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Workspace initialized successfully",
  "topicsCount": 8
}
```

### Updated Endpoints

#### `POST /api/stripe/create-checkout`

Now accepts `registrationData` in the request body and saves it to the profile before creating the Stripe session.

## Data Persistence Strategy

### Why We Save Data at Multiple Points

1. **Before Stripe Checkout**:
   - Saves brand info, region, language, visibility analysis
   - Ensures data isn't lost if user abandons checkout or webhook fails

2. **After Payment (Webhook)**:
   - Creates workspace
   - Links profile to workspace

3. **After Payment Processing (Frontend)**:
   - Saves topics (requires Zustand store data)
   - Completes registration

### Fallback Mechanisms

- If webhook fails, data is still in profile
- If frontend initialization fails, user can retry from dashboard
- Registration data persists in Zustand store (localStorage) until cleared

## Verification Checklist

After running the migration, verify:

- [ ] `profiles` table has new columns: `brand_website`, `brand_description`, `region`, `language`, `visibility_analysis`, `workspace_id`
- [ ] `topics` table exists with all columns
- [ ] `monitoring_prompts` table has new columns: `topic_id`, `category`, `intent`, `persona`, `funnel_stage`
- [ ] RLS policies are enabled on `topics` table
- [ ] Indexes are created for performance
- [ ] Function `save_registration_data` exists (optional helper)

## Testing the Flow

1. **Start Registration**: Go to `/register`
2. **Complete All Steps**: Email → Company → Account → Brand → Region → Visibility → Topics → Pricing
3. **Complete Payment**: Use Stripe test card `4242 4242 4242 4242`
4. **Verify Data in Supabase**:

   ```sql
   -- Check profile
   SELECT * FROM profiles WHERE email = 'test@example.com';

   -- Check workspace
   SELECT * FROM workspaces WHERE owner_id = '<user_id>';

   -- Check topics
   SELECT * FROM topics WHERE workspace_id = '<workspace_id>';
   ```

## Troubleshooting

### Topics Not Saving

- Check browser console for errors in `/payment-processing` page
- Verify `/api/workspace/initialize` endpoint is being called
- Check Supabase logs for RLS policy errors

### Registration Data Lost

- Check if data was saved before Stripe checkout in `profiles` table
- Verify Zustand store persistence in browser localStorage (key: `rogues-registration`)

### Workspace Not Created

- Check Stripe webhook logs
- Verify webhook secret is correct in `.env.local`
- Ensure Stripe CLI is forwarding events (if testing locally)

## Next Steps

After registration is complete, you can:

1. Generate specific prompts for each topic
2. Start monitoring AI search engines
3. Track brand visibility metrics
4. Analyze competitor mentions
