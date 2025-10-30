# Daily KPI Measurement System

This system automatically calculates visibility KPIs for active prompts using LLM providers (currently OpenAI, extensible to others).

## Overview

The daily KPI measurement system:

- Queries LLMs (OpenAI) multiple times per prompt to get sample responses
- Analyzes responses to calculate visibility metrics
- Stores daily snapshots in the `prompt_kpi_snapshots` table
- Can be run manually or via scheduled cron jobs

## Architecture

### Components

1. **`lib/llm/kpi-calculator.ts`**: Abstract interface and base class for LLM-based KPI calculators
2. **`lib/openai/kpi-calculator.ts`**: OpenAI implementation of the KPI calculator
3. **`app/api/measure/daily/route.ts`**: API endpoint to trigger daily measurements
4. **`prompt_kpi_snapshots` table**: Database table storing daily KPI snapshots

### KPI Metrics Calculated

- **Visibility Score** (0-100): Composite score combining:
  - 40% Mention Rate
  - 25% Prominence (inverted)
  - 20% Citation Authority
  - 15% Alignment

- **Mention Rate** (0-100%): Percentage of responses that mention the brand
- **Citation Rate** (0-100%): Percentage of responses with citations
- **Average Position** (0-1): Average prominence (lower = earlier/more prominent)
- **Average Sentiment** (-1 to 1): Average sentiment of responses
- **Average Alignment** (0-1): How well responses match prompt intent

## Database Schema

The `prompt_kpi_snapshots` table stores:

- Daily snapshots per prompt (one per day, enforced by UNIQUE constraint)
- All calculated metrics
- Metadata (LLM provider, model used, calculation timestamp)

## Usage

### Manual Execution

```bash
# Measure all workspaces
curl -X POST http://localhost:3000/api/measure/daily \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Measure specific workspace
curl -X POST http://localhost:3000/api/measure/daily \
  -H "Content-Type: application/json" \
  -d '{"workspaceId": "workspace-uuid"}'

# Force re-calculation (ignore existing snapshots)
curl -X POST http://localhost:3000/api/measure/daily \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

### Scheduled Execution (Cron)

Set up a cron job or scheduled task to call the endpoint daily:

```bash
# Daily at 2 AM UTC
0 2 * * * curl -X POST https://your-domain.com/api/measure/daily \
  -H "Authorization: Bearer $CRON_SECRET"
```

Or use a service like:

- **Vercel Cron**: Add to `vercel.json`
- **GitHub Actions**: Scheduled workflow
- **Supabase Edge Functions**: Scheduled function

### Environment Variables

Required:

- `OPENAI_API_KEY`: OpenAI API key for LLM queries
- `CRON_SECRET` (optional): Secret token for authenticating cron requests

## How It Works

1. **Fetch Active Prompts**: Gets all active prompts for the workspace(s)
2. **Query LLM**: For each prompt, queries OpenAI 3 times (default) with the prompt
3. **Analyze Responses**: Extracts metrics from each response:
   - Mentions (brand name/domain detection)
   - Citations (URL extraction)
   - Sentiment (lexical analysis)
   - Prominence (position in response)
   - Alignment (response quality)
4. **Aggregate Metrics**: Calculates averages across all samples
5. **Store Snapshots**: Saves daily snapshot to database

## Extending to Other LLM Providers

To add support for other providers (Anthropic, Google, etc.):

1. Create a new calculator class extending `BaseKPICalculator`:

```typescript
// lib/anthropic/kpi-calculator.ts
export class AnthropicKPICalculator extends BaseKPICalculator {
  name = "anthropic";

  async calculateKPIs(...) {
    // Implement Anthropic API calls
  }
}
```

2. Update `getKPICalculator` factory in `lib/openai/kpi-calculator.ts`:

```typescript
case "anthropic":
  return new AnthropicKPICalculator();
```

3. Update workspace settings to specify provider preference

## Performance Considerations

- **Rate Limiting**: Built-in 500ms delay between queries to avoid rate limits
- **Batch Processing**: Processes workspaces sequentially, prompts in batches
- **Idempotency**: Skips prompts that already have a snapshot for today (unless `force: true`)
- **Error Handling**: Continues processing even if individual prompts fail

## Querying KPI Data

```sql
-- Get latest KPIs for a prompt
SELECT * FROM prompt_kpi_snapshots
WHERE prompt_id = 'prompt-uuid'
ORDER BY snapshot_date DESC
LIMIT 30;

-- Get average visibility score over last 30 days
SELECT AVG(visibility_score) as avg_score
FROM prompt_kpi_snapshots
WHERE prompt_id = 'prompt-uuid'
AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days';

-- Get all prompts with visibility score > 70 today
SELECT p.prompt_text, k.visibility_score, k.mention_rate
FROM prompt_kpi_snapshots k
JOIN monitoring_prompts p ON p.id = k.prompt_id
WHERE k.snapshot_date = CURRENT_DATE
AND k.visibility_score > 70;
```

## Future Improvements

- [ ] Support for Anthropic Claude
- [ ] Support for Google Gemini
- [ ] More sophisticated sentiment analysis
- [ ] Citation authority calculation using real domain metrics
- [ ] Embeddings-based alignment calculation
- [ ] Parallel processing for faster execution
- [ ] Webhook notifications on significant score changes
