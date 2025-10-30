# Migration 015: Add LLM Provider and Model Columns

## Overview

This migration adds `llm_provider` and `llm_model` columns to the `results` table to track which LLM generated each result.

## Date

October 30, 2025

## What Changed

### Database Schema

Added two new columns to the `results` table:

```sql
ALTER TABLE results
  ADD COLUMN IF NOT EXISTS llm_provider text,
  ADD COLUMN IF NOT EXISTS llm_model text;
```

### Indexes

Added indexes for efficient filtering:

- `idx_results_llm_provider` on `results(llm_provider)`
- `idx_results_llm_model` on `results(llm_model)`

## Migration File

`lib/supabase/migrations/015_add_llm_columns_to_results.sql`

## How to Apply

### 1. Run Migration in Supabase SQL Editor

```sql
-- Copy and paste the contents of:
-- lib/supabase/migrations/015_add_llm_columns_to_results.sql
```

### 2. Verify Columns Were Created

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'results'
  AND column_name IN ('llm_provider', 'llm_model');
```

Expected output:

```
column_name  | data_type
-------------+-----------
llm_provider | text
llm_model    | text
```

### 3. Restart Your Development Server

The code has been updated to use these columns, so restart to pick up changes:

```bash
npm run dev
```

## What This Enables

### 1. Track LLM Provider per Result

Now each result in the database records:

- **llm_provider**: e.g., "openai", "anthropic", "google", "perplexity"
- **llm_model**: e.g., "gpt-4o", "claude-3-opus", "gemini-pro"

### 2. Filter Results by LLM

In the Results page (`/dashboard/results`), you can now filter by:

- Which LLM provider was used
- Which specific model generated the response

### 3. Compare LLM Performance

With this data, you can analyze:

- Which LLMs mention your brand more frequently
- Which models provide better positions
- Relevancy scores across different providers

### 4. Future Multi-LLM Support

This sets the foundation for supporting multiple LLM providers:

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3 Opus, Sonnet, Haiku)
- Google (Gemini Pro, Ultra)
- Perplexity
- Meta (Llama)
- Mistral

## Code Changes

### 1. Results Saving (`app/api/measure/daily-stream/route.ts`)

```typescript
// Now saves LLM info
await supabase.from("results").insert({
  // ... other fields
  llm_provider: "openai",
  llm_model: "gpt-4o",
});
```

### 2. Results Reading (`app/api/prompts/[promptId]/results/route.ts`)

```typescript
// Now reads LLM info
.select(`
  id,
  response_text,
  // ... other fields
  llm_provider,
  llm_model
`)
```

### 3. Results Display

The UI components (`prompt-results-detail.tsx`, `result-card.tsx`) now display:

```
OpenAI • gpt-4o
```

## Backward Compatibility

### Existing Rows

Rows inserted **before** this migration will have:

- `llm_provider`: `NULL`
- `llm_model`: `NULL`

The UI handles this gracefully by not displaying anything when NULL.

### Future Update (Optional)

If you want to update existing rows, run:

```sql
UPDATE results
SET
  llm_provider = 'openai',
  llm_model = 'gpt-4o'
WHERE llm_provider IS NULL;
```

## Testing

### 1. Run KPI Calculation

1. Go to `/dashboard/prompts`
2. Click "Calculate KPIs"
3. Wait for completion

### 2. Verify Data Saved

```sql
SELECT
  id,
  llm_provider,
  llm_model,
  our_brand_mentioned,
  created_at
FROM results
ORDER BY created_at DESC
LIMIT 10;
```

You should see:

```
llm_provider | llm_model
-------------+-----------
openai       | gpt-4o
openai       | gpt-4o
openai       | gpt-4o
```

### 3. Check UI Display

1. Go to `/dashboard/prompts`
2. Expand any prompt (click chevron ▼)
3. Look for the badge showing "OpenAI • gpt-4o"

## Benefits

### 1. Better Analytics

- Compare performance across different LLMs
- Identify which models work best for your brand
- Track model updates and their impact

### 2. Cost Tracking

- Know which provider is being used most
- Estimate costs per LLM provider
- Optimize LLM selection based on performance vs cost

### 3. Debugging

- Trace back any result to the exact model that generated it
- Reproduce issues with specific LLM versions
- A/B test different models

### 4. Compliance

- Document which AI systems were used
- Provide transparency in AI-generated content
- Meet regulatory requirements for AI disclosure

## Related Documentation

- Migration 014: Enhanced Competitor Tracking
- Sprint 4: Prompts Detail UI
- Sprint 5: Advanced Results Page

## Support

If you encounter issues after applying this migration:

1. Verify the columns were created (see verification step above)
2. Check browser console for any errors
3. Restart your development server
4. Clear Supabase schema cache if needed

## Rollback (if needed)

To remove these columns:

```sql
-- WARNING: This will delete the data in these columns
ALTER TABLE results
  DROP COLUMN IF EXISTS llm_provider,
  DROP COLUMN IF EXISTS llm_model;

DROP INDEX IF EXISTS idx_results_llm_provider;
DROP INDEX IF EXISTS idx_results_llm_model;
```
