# Sprint 1 & 2: Competitor Tracking Foundation - Complete Summary 🎉

## What We Built

A complete infrastructure for tracking competitor mentions and brand positioning in LLM responses, with topic-level aggregation.

---

## Sprint 1: Foundation ✅

### Database Schema

```sql
-- New Tables
✅ topic_kpi_snapshots         - Daily topic-level aggregated metrics
✅ topics.competitors (jsonb)  - Competitor brands to track per topic

-- Enhanced Tables
✅ results.response_text        - Full LLM response storage
✅ results.brands_mentioned     - Array of detected brands
✅ results.brand_positions      - Position mapping per brand
✅ results.our_brand_mentioned  - Boolean flag
✅ results.our_brand_position   - Position rank (1, 2, 3...)
✅ results.relevancy_score      - 0-100 relevancy score

✅ citations.title              - Page title
✅ citations.domain             - Extracted domain
✅ citations.favicon_url        - Favicon for UI
✅ citations.position           - Citation order
```

### Core Modules

```typescript
✅ lib/llm/brand-detector.ts      - Detects brands and positions
✅ lib/llm/citation-extractor.ts  - Extracts URLs and metadata
✅ lib/llm/kpi-calculator.ts      - Enhanced with brand analysis
```

**Migration File**: `lib/supabase/migrations/014_enhance_for_competitor_tracking.sql`

---

## Sprint 2: Measurement Integration ✅

### Updated Endpoints

#### 1. `/api/measure/daily-stream` (Enhanced)

- ✅ Fetches topic competitors before calculation
- ✅ Passes competitors to KPI calculator
- ✅ Uses enhanced brand detection for accurate positions
- ✅ Calculates average brand position from actual detections
- ✅ Saves aggregated snapshots to `prompt_kpi_snapshots`

#### 2. `/api/topics/calculate-kpis` (New)

- ✅ Aggregates prompt-level KPIs into topic-level metrics
- ✅ Calculates visibility score across all prompts
- ✅ Finds best/worst brand positions
- ✅ Counts total citations
- ✅ Ready for competitor analysis (placeholders in place)
- ✅ Saves to `topic_kpi_snapshots` table

---

## Data Flow

### Full Pipeline:

```
1. User creates topic with competitors list
   └─ topics.competitors = ["Flagsmith", "ConfigCat", "LaunchDarkly"]

2. User clicks "Calculate KPIs" button
   ↓
3. For each prompt:
   a. Fetch topic competitors
   b. Query LLM 3 times with prompt
   c. Detect brands in each response
      → "Flagsmith is better than ConfigCat..."
      → Detected: [Flagsmith: position 1, ConfigCat: position 2]
   d. Extract citations from response
      → Found: [https://flagsmith.com, https://configcat.com]
   e. Aggregate metrics from 3 samples
   f. Save to prompt_kpi_snapshots
   ↓
4. For each topic:
   a. Fetch all prompt snapshots for today
   b. Calculate aggregated metrics:
      - Average visibility across prompts
      - Average brand position
      - Best/worst positions achieved
      - Total citations
   c. Save to topic_kpi_snapshots
```

---

## Key Features

### 🎯 Brand Detection

- Detects multiple brands in LLM responses
- Calculates exact position (1st, 2nd, 3rd mention)
- Distinguishes our brand vs competitors
- Whole-word matching to avoid false positives

### 📊 Metrics Calculated

**Prompt Level** (per prompt, daily):

- `visibility_score`: 0-100, composite score
- `mention_rate`: % responses mentioning our brand
- `citation_rate`: % responses with citations
- `avg_position`: Average brand position

**Topic Level** (per topic, daily):

- `visibility_score`: % LLM responses mentioning us
- `relevancy_score`: % mentioning us or competitors
- `avg_rank`: Average position across all prompts
- `best_rank`: Best position achieved
- `worst_rank`: Worst position achieved
- `total_citations`: Total URLs cited

### 🔗 Citation Extraction

- Supports markdown links `[text](url)`
- Supports plain URLs
- Extracts domain and favicon
- Orders by appearance

---

## How to Use

### 1. Apply Database Migration

```sql
-- In Supabase Dashboard → SQL Editor
-- Run: lib/supabase/migrations/014_enhance_for_competitor_tracking.sql
```

### 2. Add Competitors to Topics

```sql
UPDATE topics
SET competitors = '["Flagsmith", "ConfigCat", "LaunchDarkly"]'::jsonb
WHERE name = 'Feature Flag Management';
```

### 3. Calculate Prompt-Level KPIs

```typescript
// Via UI: Dashboard → Prompts → "Calculate KPIs" button

// Via API:
POST /api/measure/daily-stream
{
  "workspaceId": "uuid",
  "regionId": "uuid",
  "force": false
}
```

### 4. Aggregate to Topic Level

```typescript
// Via API:
POST /api/topics/calculate-kpis
{
  "workspaceId": "uuid",
  "force": false
}
```

### 5. Query Results

```sql
-- View prompt KPIs
SELECT
  mp.prompt_text,
  pks.visibility_score,
  pks.mention_rate,
  pks.avg_position,
  pks.snapshot_date
FROM prompt_kpi_snapshots pks
JOIN monitoring_prompts mp ON mp.id = pks.prompt_id
WHERE pks.snapshot_date = CURRENT_DATE;

-- View topic KPIs
SELECT
  t.name as topic_name,
  tks.visibility_score,
  tks.relevancy_score,
  tks.avg_rank,
  tks.best_rank,
  tks.total_citations,
  tks.total_prompts_measured
FROM topic_kpi_snapshots tks
JOIN topics t ON t.id = tks.topic_id
WHERE tks.snapshot_date = CURRENT_DATE;
```

---

## Testing

### Test Brand Detection

```typescript
import { detectBrands } from "@/lib/llm/brand-detector";

const analysis = detectBrands(
  "Flagsmith and ConfigCat are great tools for feature flags",
  "Flagsmith",
  ["ConfigCat", "LaunchDarkly"]
);

console.log(analysis);
// {
//   ourBrandMentioned: true,
//   ourBrandPosition: 1,
//   brandsDetected: [
//     { brandName: "Flagsmith", position: 1, isOurBrand: true },
//     { brandName: "ConfigCat", position: 2, isOurBrand: false }
//   ],
//   relevancyScore: 100
// }
```

### Test Citation Extraction

```typescript
import { extractCitations } from "@/lib/llm/citation-extractor";

const citations = extractCitations(
  "Learn more at https://flagsmith.com and https://configcat.com",
  "openai"
);

console.log(citations);
// [
//   {
//     url: "https://flagsmith.com",
//     domain: "flagsmith.com",
//     faviconUrl: "https://www.google.com/s2/favicons?domain=flagsmith.com&sz=32",
//     position: 1
//   },
//   ...
// ]
```

---

## Future Work (Sprint 3+)

### Immediate Next Steps:

1. **Topics UI** - Build the topics view with aggregated metrics
2. **Competitor Icons** - Show brand logos/icons
3. **Expandable Prompts** - Click topic to see its prompts
4. **Trend Charts** - Visibility over time

### Later Enhancements:

1. **Individual Results Storage** - Save each LLM response to `results` table
2. **Citation Details** - Save complete citation metadata
3. **Competitor Analysis** - Real competitor mention counts and positions
4. **Advanced Metrics** - Sentiment per brand, citation authority

---

## Files Created/Modified

### New Files:

```
✅ lib/supabase/migrations/014_enhance_for_competitor_tracking.sql
✅ lib/llm/brand-detector.ts
✅ lib/llm/citation-extractor.ts
✅ app/api/topics/calculate-kpis/route.ts
✅ docs/sprint-1-competitor-tracking.md
✅ docs/sprint-2-enhanced-measurement.md
✅ docs/SPRINT-1-2-SUMMARY.md (this file)
```

### Modified Files:

```
✅ lib/llm/kpi-calculator.ts (enhanced with brand analysis)
✅ lib/openai/kpi-calculator.ts (updated signature)
✅ lib/supabase/types.ts (new tables & fields)
✅ app/api/measure/daily-stream/route.ts (enhanced measurement)
```

---

## Status

✅ **Sprint 1: Complete** - Foundation built
✅ **Sprint 2: Complete** - Measurement integrated
⏳ **Sprint 3: Pending** - UI & Visualization

---

## Quick Start Checklist

- [ ] Run database migration `014_enhance_for_competitor_tracking.sql`
- [ ] Add competitors to at least one topic
- [ ] Click "Calculate KPIs" on prompts page
- [ ] Call `/api/topics/calculate-kpis` to aggregate
- [ ] Query `topic_kpi_snapshots` to verify data
- [ ] Ready for Sprint 3 (Topics UI)

---

**Questions?** Check:

- `docs/sprint-1-competitor-tracking.md` for technical details
- `docs/sprint-2-enhanced-measurement.md` for API usage
- Code comments for inline documentation

**Next**: Sprint 3 will build the Topics UI to visualize all this data! 🚀
