# Sprint 1: Competitor Tracking Foundation - COMPLETED ✅

## Overview

Sprint 1 implements the foundational infrastructure for competitor tracking and enhanced brand visibility analysis, following the reference platform structure.

## Completed Tasks

### 1. Database Schema Enhancement ✅

**File**: `lib/supabase/migrations/014_enhance_for_competitor_tracking.sql`

#### New Tables:

- **`topic_kpi_snapshots`**: Daily aggregated KPI metrics at topic level
  - Visibility score (% our brand mentioned)
  - Relevancy score (% any brand mentioned)
  - Average rank, best/worst ranks
  - Competitor mentions and positions (JSONB)
  - Total citations and unique domains

#### Enhanced Existing Tables:

- **`topics`**:
  - Added `competitors` (jsonb array)
  - Added `competitor_count` (generated column)

- **`results`**:
  - Added `response_text` (full LLM response)
  - Added `brands_mentioned` (jsonb array)
  - Added `brand_positions` (jsonb object)
  - Added `our_brand_mentioned` (boolean)
  - Added `our_brand_position` (integer)
  - Added `relevancy_score` (decimal)

- **`citations`**:
  - Added `title` (page title)
  - Added `domain` (extracted domain)
  - Added `favicon_url` (favicon for UI)
  - Added `position` (citation order)

### 2. Brand Detection Module ✅

**File**: `lib/llm/brand-detector.ts`

**Features**:

- Detects multiple brands in LLM responses
- Calculates position of each brand (1st, 2nd, 3rd...)
- Identifies our brand vs competitors
- Calculates relevancy score (0-100)
- Whole-word matching to avoid false positives
- Aggregation functions for topic-level metrics

**Key Functions**:

```typescript
detectBrands(responseText, ourBrand, competitors): BrandAnalysis
extractBrandData(analysis): { brandNames, brandPositions }
aggregateCompetitorMentions(analyses): Record<string, number>
calculateAveragePositions(analyses): Record<string, number>
```

### 3. Citation Extraction Module ✅

**File**: `lib/llm/citation-extractor.ts`

**Features**:

- Extracts URLs from LLM responses
- Supports markdown-style citations `[text](url)`
- Supports plain URLs
- Supports numbered references `[1]`, `[2]`
- Extracts domain and generates favicon URLs
- Orders citations by appearance

**Key Functions**:

```typescript
extractCitations(responseText, llmProvider): Citation[]
getUniqueDomains(citations): string[]
isOurWebsiteCited(citations, ourWebsite): boolean
countCitationsPerDomain(citations): Record<string, number>
```

### 4. Enhanced KPI Calculator ✅

**Files**:

- `lib/llm/kpi-calculator.ts` (base)
- `lib/openai/kpi-calculator.ts` (OpenAI implementation)

**Enhancements**:

- Added `competitors` parameter to brand context
- Integrated `brand-detector` for brand analysis
- Integrated `citation-extractor` for URL analysis
- New fields in `KPIMetrics`:
  - `responseText`: Full LLM response
  - `brandAnalysis`: Detailed brand detection results
  - `citations`: Array of extracted citations
  - `ourBrandMentioned`: Boolean flag
  - `ourBrandPosition`: Position rank (1, 2, 3...)
  - `relevancyScore`: 0-100 score

### 5. TypeScript Types ✅

**File**: `lib/supabase/types.ts`

Added type definitions for:

- `topic_kpi_snapshots` table (Row, Insert, Update)
- Updated to include all new JSONB fields

## Database Schema Summary

```sql
-- Topic-level snapshots
topic_kpi_snapshots
├─ visibility_score (integer 0-100)
├─ relevancy_score (integer 0-100)
├─ avg_rank (decimal)
├─ competitor_mentions (jsonb) -> {"Flagsmith": 15, "ConfigCat": 12}
└─ competitor_positions (jsonb) -> {"Flagsmith": 1.5, "ConfigCat": 2.3}

-- Enhanced results
results
├─ response_text (text)
├─ brands_mentioned (jsonb) -> ["Flagsmith", "ConfigCat"]
├─ brand_positions (jsonb) -> {"Flagsmith": 1, "ConfigCat": 2}
├─ our_brand_mentioned (boolean)
├─ our_brand_position (integer)
└─ relevancy_score (decimal)

-- Enhanced citations
citations
├─ title (text)
├─ domain (text)
├─ favicon_url (text)
└─ position (integer)

-- Topics with competitors
topics
├─ competitors (jsonb) -> ["Flagsmith", "ConfigCat", "LaunchDarkly"]
└─ competitor_count (integer, generated)
```

## Architecture Flow

```
User Prompt
    ↓
OpenAI API (3 samples)
    ↓
Response Text
    ↓
├─ Brand Detector ──→ Brand Analysis (positions, mentions)
├─ Citation Extractor ──→ Citations (URLs, domains, titles)
└─ KPI Calculator ──→ Legacy metrics (sentiment, alignment)
    ↓
Combined KPIMetrics
    ↓
Saved to DB (results table with enhanced fields)
    ↓
Aggregated to topic_kpi_snapshots (daily)
```

## Testing

To test the new functionality:

```typescript
import { detectBrands } from "@/lib/llm/brand-detector";
import { extractCitations } from "@/lib/llm/citation-extractor";

// Test brand detection
const analysis = detectBrands(
  "Flagsmith and ConfigCat are great feature flag tools...",
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

// Test citation extraction
const citations = extractCitations(
  "Learn more at https://flagsmith.com and https://configcat.com",
  "openai"
);
console.log(citations);
// [
//   { url: "https://flagsmith.com", domain: "flagsmith.com", position: 1 },
//   { url: "https://configcat.com", domain: "configcat.com", position: 2 }
// ]
```

## Next Steps (Sprint 2)

1. ✅ Update `/api/measure/daily-stream` to use enhanced KPI calculator
2. ✅ Save `response_text`, `brands_mentioned`, `citations` to DB
3. ✅ Create endpoint for topic-level KPI aggregation
4. ✅ Test full flow with real LLM responses

## Migration Instructions

To apply this migration to your Supabase database:

1. Open Supabase Dashboard → SQL Editor
2. Paste the contents of `lib/supabase/migrations/014_enhance_for_competitor_tracking.sql`
3. Execute the migration
4. Verify tables and columns are created correctly

## Notes

- All code follows TypeScript best practices
- Backward compatible with existing KPI metrics
- Ready for integration with measurement endpoints
- RLS policies configured for workspace-level access control
- Indexes optimized for query performance

---

**Status**: ✅ Sprint 1 Complete
**Next Sprint**: Sprint 2 - Enhanced Measurement & Storage
