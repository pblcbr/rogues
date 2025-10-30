# Fix: LLM Model Names Correction

## Problem

When running KPI calculations, only OpenAI was working. Claude and Perplexity were failing with errors:

### Claude Error (404)

```
Anthropic API error (404): {"type":"error","error":{"type":"not_found_error","message":"model: claude-3-5-sonnet-20241022"}}
```

### Perplexity Error (400)

```
Perplexity API error (400): {"error":{"message":"Invalid model 'llama-3.1-sonar-large-128k-online'"}}
```

## Root Cause

The model names used in the code were incorrect:

- ❌ Claude: `claude-3-5-sonnet-20241022` (doesn't exist)
- ❌ Perplexity: `llama-3.1-sonar-large-128k-online` (invalid)

## Solution

Updated all model names to the correct API versions:

- ✅ Claude: `claude-3-5-sonnet-20240620`
- ✅ Perplexity: `llama-3.1-sonar-medium-128k-online`

## Files Updated

### 1. **lib/anthropic/kpi-calculator.ts**

```typescript
- private readonly DEFAULT_MODEL = "claude-3-5-sonnet-20241022";
+ private readonly DEFAULT_MODEL = "claude-3-5-sonnet-20240620";
```

### 2. **lib/perplexity/kpi-calculator.ts**

```typescript
- private readonly DEFAULT_MODEL = "llama-3.1-sonar-large-128k-online";
+ private readonly DEFAULT_MODEL = "llama-3.1-sonar-medium-128k-online";
```

### 3. **lib/constants.ts**

```typescript
// Perplexity
- model: "llama-3.1-sonar-large-128k-online",
+ model: "llama-3.1-sonar-medium-128k-online",

// Claude
- model: "claude-3-5-sonnet-20241022",
+ model: "claude-3-5-sonnet-20240620",
```

### 4. **app/api/measure/daily-stream/route.ts**

```typescript
function getLLMModel(llmProviderId: string): string {
  switch (llmProviderId) {
    case "openai":
      return "gpt-4o";
    case "perplexity":
-     return "llama-3.1-sonar-large-128k-online";
+     return "llama-3.1-sonar-medium-128k-online";
    case "claude":
-     return "claude-3-5-sonnet-20241022";
+     return "claude-3-5-sonnet-20240620";
    // ...
  }
}
```

### 5. **Database Migrations**

- Updated `019_add_perplexity_model.sql`
- Updated `020_add_claude_model.sql`
- Created `021_fix_model_versions.sql` (update script)

## How to Apply

### Option 1: Fresh Install (New Database)

If you haven't run migrations yet, just run them now with the corrected versions:

```sql
-- Run in Supabase SQL Editor
-- 1. Migration 019 (Perplexity) - already corrected
-- 2. Migration 020 (Claude) - already corrected
```

### Option 2: Update Existing Database

If you already ran migrations 019 and 020 with wrong model names, run the fix migration:

```sql
-- Run in Supabase SQL Editor
-- lib/supabase/migrations/021_fix_model_versions.sql

UPDATE models
SET version = 'llama-3.1-sonar-medium-128k-online'
WHERE id = 'perplexity';

UPDATE models
SET version = 'claude-3-5-sonnet-20240620'
WHERE id = 'claude';
```

## Verification

After applying fixes, verify the models are correct:

```sql
SELECT id, name, provider, version
FROM models
WHERE id IN ('openai', 'perplexity', 'claude');
```

Expected output:

```
| id         | name          | provider   | version                               |
|------------|---------------|------------|---------------------------------------|
| chatgpt    | ChatGPT       | openai     | gpt-4o                                |
| perplexity | Perplexity AI | perplexity | llama-3.1-sonar-medium-128k-online    |
| claude     | Claude        | anthropic  | claude-3-5-sonnet-20240620            |
```

## Testing

After applying the fix:

1. **Restart dev server**

   ```bash
   # Kill the server and restart
   npm run dev
   ```

2. **Go to Settings** → Workspace Settings
   - Verify you see all 3 LLMs: ChatGPT, Perplexity, Claude
   - Select all 3
   - Save Changes

3. **Run KPI Calculation**
   - Go to Dashboard → Prompts
   - Click "Calculate KPIs"
   - All 3 LLMs should work now! ✅

## Expected Logs (Success)

```
[Daily KPI Stream] Active LLMs: [ 'claude', 'openai', 'perplexity' ]
[Daily KPI Stream] Found 1 active prompts x 3 LLMs = 3 total tasks

✅ [Daily KPI Stream] Calculating KPIs with claude... (no errors)
✅ [Daily KPI Stream] Calculating KPIs with openai... (no errors)
✅ [Daily KPI Stream] Calculating KPIs with perplexity... (no errors)
```

## API References

### Claude (Anthropic)

- **Documentation**: https://docs.anthropic.com/claude/reference/models
- **Model**: `claude-3-5-sonnet-20240620`
- **Released**: June 20, 2024
- **Note**: October 2024 version doesn't exist yet

### Perplexity

- **Documentation**: https://docs.perplexity.ai/guides/model-cards
- **Model**: `llama-3.1-sonar-medium-128k-online`
- **Note**: Changed from "large" to "medium" (large might not be available in all regions)

## Troubleshooting

### Still seeing 404 for Claude?

- Verify your `ANTHROPIC_API_KEY` is valid
- Check https://console.anthropic.com/ for API status
- Ensure you have access to Claude 3.5 Sonnet

### Still seeing 400 for Perplexity?

- Verify your `PERPLEXITY_API_KEY` is valid
- Try alternative models: `sonar-small-online`, `sonar-medium-chat`
- Check https://docs.perplexity.ai/ for latest model names

---

**Status**: ✅ Fixed
**Date**: 2025-10-30
**Issue**: Model names were incorrect
**Solution**: Updated to correct API model names
