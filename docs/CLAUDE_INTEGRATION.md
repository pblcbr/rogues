# Claude (Anthropic) Integration - Complete ✅

## Overview

Claude 3.5 Sonnet has been successfully integrated as an available LLM engine for AEO monitoring in tacmind.

## What's Been Added

### 1. **Anthropic API Client**

- Location: `lib/anthropic/client.ts`
- Uses Anthropic Messages API v1
- Singleton pattern for efficient connection reuse
- Full error handling and type safety

### 2. **Claude KPI Calculator**

- Location: `lib/anthropic/kpi-calculator.ts`
- Extends `BaseKPICalculator` for consistency
- Uses `claude-3-5-sonnet-20241022` model
- Implements dynamic brand detection (no bias)
- Max 1024 tokens per response
- Temperature: 0.3 (balanced creativity/consistency)

### 3. **System Integration**

- Updated `lib/constants.ts`: Claude marked as available (not "Coming Soon")
- Updated `app/api/measure/daily-stream/route.ts`: Added Claude to LLM switch
- Updated TypeScript types: Full support for Claude
- Created migration `020_add_claude_model.sql`

### 4. **Database Migration**

- **Migration 020**: Adds Claude to `models` table
- Model ID: `claude`
- Provider: `anthropic`
- Version: `claude-3-5-sonnet-20241022`

## Current LLM Availability

| LLM        | Provider      | Status           | API Key Required        |
| ---------- | ------------- | ---------------- | ----------------------- |
| ChatGPT    | OpenAI        | ✅ Available     | `OPENAI_API_KEY`        |
| Perplexity | Perplexity AI | ✅ Available     | `PERPLEXITY_API_KEY`    |
| **Claude** | **Anthropic** | **✅ Available** | **`ANTHROPIC_API_KEY`** |
| Gemini     | Google        | 🔜 Coming Soon   | `GOOGLE_API_KEY`        |

## How to Enable Claude

### Step 1: Verify API Key

Your API key is already configured in `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-t3j9_...
```

### Step 2: Run Database Migrations

Execute these migrations in Supabase SQL Editor:

```sql
-- Migration 019: Add Perplexity (Fixed)
-- Run: lib/supabase/migrations/019_add_perplexity_model.sql

-- Migration 020: Add Claude
-- Run: lib/supabase/migrations/020_add_claude_model.sql
```

**Verify migrations:**

```sql
SELECT * FROM models WHERE id IN ('perplexity', 'claude');
```

Expected result:

```
| id         | name          | provider    | version                           |
|------------|---------------|-------------|-----------------------------------|
| perplexity | Perplexity AI | perplexity  | llama-3.1-sonar-large-128k-online |
| claude     | Claude        | anthropic   | claude-3-5-sonnet-20241022        |
```

### Step 3: Configure in Settings

1. Go to **Settings** → **Workspace Settings**
2. Scroll to **Active LLM Engines**
3. You should now see **3 LLMs available** (assuming Growth+ plan):
   - ✅ ChatGPT (OpenAI)
   - ✅ Perplexity
   - ✅ **Claude** (NEW!)
4. Select the LLMs you want to use
5. Click **Save Changes**

### Step 4: Test KPI Calculation

1. Go to **Dashboard** → **Prompts**
2. Click **Calculate KPIs**
3. Watch the progress:
   ```
   Processing 3 prompts × 3 LLMs = 9 total tasks
   [1/9] Prompt "Best CRM" with openai...
   [2/9] Prompt "Best CRM" with perplexity...
   [3/9] Prompt "Best CRM" with claude... ✨ NEW!
   ```

## Technical Details

### API Configuration

```typescript
// Anthropic Messages API
ENDPOINT: "https://api.anthropic.com/v1/messages";
VERSION: "2023-06-01";
MODEL: "claude-3-5-sonnet-20241022";
MAX_TOKENS: 1024;
TEMPERATURE: 0.3;
```

### Request Format

```typescript
{
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  temperature: 0.3,
  system: "You are an AI assistant...",
  messages: [
    { role: "user", content: "Best CRM software for small business" }
  ]
}
```

### Response Structure

```typescript
{
  id: "msg_...",
  type: "message",
  role: "assistant",
  content: [
    { type: "text", text: "Here are the best CRM solutions..." }
  ],
  model: "claude-3-5-sonnet-20241022",
  stop_reason: "end_turn",
  usage: {
    input_tokens: 120,
    output_tokens: 456
  }
}
```

### Data Storage

```sql
-- prompt_kpi_snapshots
llm_provider: 'claude'
llm_model: 'claude-3-5-sonnet-20241022'

-- results
llm_provider: 'claude'
llm_model: 'claude-3-5-sonnet-20241022'
response_text: 'Here are the best CRM solutions...'
brands_mentioned: ["Salesforce", "HubSpot", ...]
```

## Plan Limits

| Plan       | Max LLMs  | Can Use Claude?                        |
| ---------- | --------- | -------------------------------------- |
| Starter    | 1         | ⚠️ Only if selected instead of OpenAI  |
| Growth     | 3         | ✅ Yes (alongside OpenAI & Perplexity) |
| Enterprise | Unlimited | ✅ Yes                                 |

## Comparison: Claude vs Others

### Claude 3.5 Sonnet

- **Strengths**:
  - High-quality reasoning and analysis
  - Strong understanding of context
  - Excellent at following complex instructions
  - Lower cost per token than GPT-4
- **Use Case**: Detailed brand analysis, nuanced responses
- **Speed**: ~2-4s per request

### GPT-4o (OpenAI)

- **Strengths**:
  - Fastest response time
  - Wide knowledge base
  - Good at structured outputs
- **Use Case**: Quick iterations, high volume
- **Speed**: ~1-2s per request

### Perplexity AI

- **Strengths**:
  - Real-time web search integration
  - Up-to-date information
  - Citation-rich responses
- **Use Case**: Latest trends, real-time data
- **Speed**: ~3-5s per request

## Troubleshooting

### "Model claude not found in database"

**Solution**: Run migration 020:

```bash
psql -d your_database -f lib/supabase/migrations/020_add_claude_model.sql
```

### "ANTHROPIC_API_KEY is not configured"

**Solution**:

1. Check `.env.local` has the API key
2. Restart your dev server: `npm run dev`
3. For production, update env vars in hosting platform

### "Invalid API key"

**Solution**:

1. Verify your API key at https://console.anthropic.com/
2. Ensure it starts with `sk-ant-api03-`
3. Check for any trailing spaces or newlines

### Claude responses are empty

**Solution**:

1. Check console logs for API errors
2. Verify your API key has sufficient credits
3. Check Anthropic API status: https://status.anthropic.com/

## Cost Considerations

### Token Pricing (as of Oct 2024)

- **Claude 3.5 Sonnet**:
  - Input: $3.00 / 1M tokens
  - Output: $15.00 / 1M tokens

- **GPT-4o**:
  - Input: $5.00 / 1M tokens
  - Output: $15.00 / 1M tokens

- **Perplexity**:
  - ~$1.00 / 1K requests (search-based pricing)

### Estimated Cost per KPI Run

For 10 prompts × 3 samples × 3 LLMs:

- Total: 90 API calls
- Input: ~120 tokens/call = 10,800 tokens
- Output: ~500 tokens/call = 45,000 tokens
- **Cost with Claude**: ~$0.05 per run
- **Cost all 3 LLMs**: ~$0.15 per run

## Next Steps

1. ✅ API key configured
2. ⏳ Run migrations 019 & 020
3. ⏳ Test in Settings UI
4. ⏳ Run KPI calculation with Claude
5. 📊 Compare results across LLMs
6. 🚀 Enable for production

## Future Enhancements

- [ ] Claude Opus 4.0 (when released)
- [ ] Claude Haiku (faster, cheaper variant)
- [ ] Per-prompt LLM preferences
- [ ] Cost tracking dashboard
- [ ] A/B testing framework

## Support

For issues specific to Claude integration:

1. Check Anthropic API status
2. Review console logs for detailed errors
3. Verify all migrations are applied
4. Test with a single prompt first

---

**Status**: ✅ Ready for Testing
**Last Updated**: 2025-10-30
**Integration Version**: v1.0
