# Multi-LLM Engine Setup

This document explains how to set up and use multiple LLM engines for AEO monitoring in tacmind.

## Overview

tacmind now supports multiple LLM providers for monitoring brand visibility:

- **OpenAI (ChatGPT)** - `gpt-4o`
- **Perplexity AI** - `llama-3.1-sonar-large-128k-online`
- **Anthropic Claude** - `claude-3-5-sonnet-20241022` (Coming Soon)
- **Google Gemini** - `gemini-pro` (Coming Soon)

Each workspace can configure which LLMs to use based on their subscription plan:

- **Starter Plan**: 1 LLM engine (OpenAI only)
- **Growth Plan**: Up to 3 LLM engines
- **Enterprise Plan**: Unlimited LLM engines

## Setup Instructions

### 1. Environment Variables

Add the required API keys to your `.env.local` file:

```bash
# OpenAI (Required for all plans)
OPENAI_API_KEY=sk-...

# Perplexity AI (Optional - Growth+ plans)
PERPLEXITY_API_KEY=pplx-...

# Coming Soon:
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_API_KEY=...
```

### 2. Database Migrations

Run the following migrations in order:

```bash
# Migration 018: Add active_llms column to workspaces
psql -d your_database -f lib/supabase/migrations/018_add_active_llms_to_workspaces.sql

# Migration 019: Add Perplexity model reference
psql -d your_database -f lib/supabase/migrations/019_add_perplexity_model.sql
```

Or run them directly in the Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Open and execute `018_add_active_llms_to_workspaces.sql`
3. Open and execute `019_add_perplexity_model.sql`

### 3. Verify Setup

Check that the migrations applied correctly:

```sql
-- Check workspaces table has active_llms column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'workspaces'
AND column_name = 'active_llms';

-- Check models table has perplexity
SELECT * FROM models WHERE id = 'perplexity';

-- Check existing workspaces have default LLM
SELECT id, name, active_llms FROM workspaces;
```

## User Configuration

### For Workspace Admins/Owners

1. Navigate to **Settings** → **Workspace Settings**
2. Scroll to the **Active LLM Engines** section
3. Select which LLMs you want to use (based on your plan limits)
4. Click **Save Changes**

### Plan Limits

The system will automatically enforce plan limits:

- If you try to select more LLMs than your plan allows, you'll see an error
- Upgrade your plan to unlock more LLM engines

## How It Works

### KPI Calculation

When you run "Calculate KPIs" for your prompts:

1. The system fetches your workspace's `active_llms` configuration
2. For each active prompt:
   - For each active LLM:
     - Queries the LLM with the prompt
     - Analyzes the response for brand mentions, citations, etc.
     - Saves results to the database
3. Results are stored separately for each LLM provider

### Data Structure

```
Workspace
└── active_llms: ["openai", "perplexity"]
    └── Prompt 1
        ├── OpenAI Results
        │   ├── KPI Snapshot (aggregated)
        │   └── Individual Results (3 samples)
        └── Perplexity Results
            ├── KPI Snapshot (aggregated)
            └── Individual Results (3 samples)
```

### Database Schema

**workspaces table:**

```sql
active_llms TEXT[] DEFAULT ARRAY['openai']::TEXT[]
```

**prompt_kpi_snapshots table:**

```sql
llm_provider TEXT  -- e.g., "openai", "perplexity"
llm_model TEXT     -- e.g., "gpt-4o", "llama-3.1-sonar-large-128k-online"
```

**results table:**

```sql
llm_provider TEXT
llm_model TEXT
```

## Viewing Results

Results from different LLMs are displayed separately:

- Each LLM's logo/icon is shown in the results
- Filter by LLM provider in the Results page
- Compare performance across different LLMs

## API Integration

### Trigger KPI Calculation

```bash
POST /api/measure/daily-stream
{
  "workspaceId": "workspace-uuid",
  "regionId": "region-uuid",
  "force": false
}
```

The endpoint will automatically use the workspace's `active_llms` configuration.

### Response (SSE Stream)

```json
{
  "type": "start",
  "total": 6,
  "promptCount": 3,
  "llmCount": 2
}

{
  "type": "progress",
  "promptId": "prompt-uuid",
  "promptText": "Best CRM software",
  "llmProvider": "openai",
  "current": 1,
  "total": 6
}

{
  "type": "success",
  "promptId": "prompt-uuid",
  "promptText": "Best CRM software",
  "llmProvider": "openai",
  "kpis": {
    "visibilityScore": 85,
    "mentionRate": 100,
    "citationRate": 67,
    "avgPosition": "2.33"
  }
}

{
  "type": "complete",
  "summary": {
    "total": 6,
    "promptCount": 3,
    "llmCount": 2,
    "processed": 5,
    "skipped": 1,
    "errors": 0
  }
}
```

## Troubleshooting

### "LLM model not configured in database"

**Problem**: The `models` table is missing the LLM reference.

**Solution**: Run migration 019:

```bash
psql -d your_database -f lib/supabase/migrations/019_add_perplexity_model.sql
```

### "Plan only allows X LLM engine(s)"

**Problem**: Trying to select more LLMs than your plan allows.

**Solution**:

- Deselect some LLMs to match your plan limit
- Or upgrade your plan in Settings → Billing

### API Key Errors

**Problem**: Missing or invalid API key.

**Solution**:

1. Check your `.env.local` file has the correct API key
2. Restart your development server
3. For production, update environment variables in your hosting platform

### RLS Policy Errors

**Problem**: Permission denied when inserting results.

**Solution**: Ensure migration 016 (RLS policies fix) is applied:

```bash
psql -d your_database -f lib/supabase/migrations/016_fix_results_rls_policies.sql
```

## Roadmap

### Coming Soon

- **Claude (Anthropic)**: High-quality reasoning and analysis
- **Gemini (Google)**: Integration with Google Search data
- **Custom LLMs**: Bring your own model endpoints

### Future Enhancements

- Per-prompt LLM configuration
- LLM-specific prompt templates
- Cost tracking per LLM
- Performance comparison dashboard
- A/B testing between LLMs

## Support

For questions or issues:

1. Check this documentation
2. Review the troubleshooting section
3. Check the console logs for detailed error messages
4. Contact support with:
   - Your workspace ID
   - Which LLM you're trying to use
   - Error message or behavior you're seeing
