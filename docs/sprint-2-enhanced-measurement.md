# Sprint 2: Enhanced Measurement & Topic Aggregation - COMPLETED ✅

## Overview

Sprint 2 integrates the competitor tracking infrastructure from Sprint 1 into the measurement endpoints, enabling enhanced brand detection and topic-level KPI aggregation.

## Completed Tasks

### 1. Enhanced Daily Measurement Endpoint ✅

**File**: `app/api/measure/daily-stream/route.ts`

#### Key Changes:

- **Fetch Topic Competitors**: Before calculating KPIs, fetch the `competitors` array from the topic
- **Enhanced Brand Context**: Pass full brand context to KPI calculator:
  ```typescript
  {
    name: workspace.brand_name,
    website: workspace.brand_website,
    competitors: topicCompetitors  // NEW
  }
  ```
- **Use New KPI Fields**: Leverage `ourBrandMentioned`, `ourBrandPosition`, `brandAnalysis` from enhanced KPIMetrics
- **Better Position Calculation**: Calculate average brand position from actual brand detection results instead of using prominence as a proxy

#### Benefits:

- Accurate brand positioning (1st, 2nd, 3rd mention)
- Competitor tracking ready for future implementation
- More reliable visibility metrics

### 2. Topic-Level KPI Aggregation Endpoint ✅

**File**: `app/api/topics/calculate-kpis/route.ts`

#### Features:

- **Aggregates prompt-level KPIs** into topic-level snapshots
- **Metrics Calculated**:
  - `visibility_score`: % of LLM responses mentioning our brand
  - `relevancy_score`: % mentioning our brand OR competitors (placeholder for now)
  - `avg_rank`: Average position of our brand across all prompts
  - `best_rank`: Best (lowest) position achieved
  - `worst_rank`: Worst (highest) position achieved
  - `total_citations`: Total URLs cited across all responses
  - `competitor_mentions`: Count per competitor (placeholder)
  - `competitor_positions`: Avg position per competitor (placeholder)

#### Usage:

```bash
POST /api/topics/calculate-kpis
{
  "workspaceId": "uuid",
  "topicId": "uuid",  // optional, processes all if omitted
  "force": false
}
```

#### Response:

```json
{
  "success": true,
  "summary": {
    "total": 5,
    "processed": 4,
    "skipped": 1,
    "errors": 0
  }
}
```

### 3. Data Flow Enhancement ✅

#### Before Sprint 2:

```
LLM Response → Basic KPIs → prompt_kpi_snapshots
```

#### After Sprint 2:

```
LLM Response
    ↓
Brand Detection (with competitors)
    ↓
Enhanced KPIs (with brand positions)
    ↓
prompt_kpi_snapshots (with accurate positions)
    ↓
Topic Aggregation
    ↓
topic_kpi_snapshots
```

## Architecture

### Prompt-Level Calculation Flow:

```
1. Fetch prompt and its topic
2. Get topic competitors list
3. Call KPI calculator with:
   - Brand context (name, website, competitors)
   - Region/language settings
4. Receive enhanced KPIMetrics with:
   - brandAnalysis (positions, mentions)
   - citations (URLs, domains, titles)
   - ourBrandPosition (1, 2, 3...)
5. Aggregate metrics from 3 samples
6. Save to prompt_kpi_snapshots
```

### Topic-Level Aggregation Flow:

```
1. Fetch all prompts for topic
2. Get today's prompt_kpi_snapshots for all prompts
3. Aggregate:
   - Average visibility across prompts
   - Average brand position
   - Best/worst positions
   - Total citations
4. Save to topic_kpi_snapshots
```

## Database Schema Usage

### Enhanced Tables (from Sprint 1):

```sql
-- Topics store competitor lists
topics.competitors -> ["Flagsmith", "ConfigCat", "LaunchDarkly"]

-- Prompt snapshots now use accurate brand positions
prompt_kpi_snapshots.avg_position -> actual position from brand detection

-- Topic snapshots aggregate everything
topic_kpi_snapshots
  ├─ visibility_score (% our brand mentioned)
  ├─ relevancy_score (% any brand mentioned)
  ├─ avg_rank (average position)
  ├─ best_rank (best position achieved)
  ├─ worst_rank (worst position achieved)
  ├─ competitor_mentions (count per competitor)
  └─ competitor_positions (avg position per competitor)
```

## Testing

### 1. Test Prompt-Level Calculation:

```bash
# Via UI: Click "Calculate KPIs" button on prompts page
# Monitors real-time progress via SSE

# Via API:
curl -X POST http://localhost:3000/api/measure/daily-stream \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"uuid","regionId":"uuid","force":false}'
```

### 2. Test Topic-Level Aggregation:

```bash
curl -X POST http://localhost:3000/api/topics/calculate-kpis \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"uuid","force":false}'
```

### 3. Verify Data:

```sql
-- Check prompt snapshots
SELECT
  prompt_id,
  visibility_score,
  mention_rate,
  avg_position,
  snapshot_date
FROM prompt_kpi_snapshots
WHERE workspace_id = 'your-workspace-id'
  AND snapshot_date = CURRENT_DATE;

-- Check topic snapshots
SELECT
  t.name as topic_name,
  tks.visibility_score,
  tks.avg_rank,
  tks.best_rank,
  tks.total_prompts_measured,
  tks.snapshot_date
FROM topic_kpi_snapshots tks
JOIN topics t ON t.id = tks.topic_id
WHERE tks.workspace_id = 'your-workspace-id'
  AND tks.snapshot_date = CURRENT_DATE;
```

## Future Enhancements (Sprint 3+)

### Pending TODOs:

1. **Save Individual Results** (marked as TODO in code):
   - Save each LLM response to `results` table with:
     - `response_text`
     - `brands_mentioned`
     - `brand_positions`
     - `our_brand_mentioned`
     - `our_brand_position`
     - `relevancy_score`

2. **Save Citation Details** (marked as TODO in code):
   - Save each citation to `citations` table with:
     - `title`
     - `domain`
     - `favicon_url`
     - `position`

3. **Enhanced Competitor Analysis**:
   - Calculate actual `competitor_mentions` from brand analysis
   - Calculate actual `competitor_positions` from brand analysis
   - Track competitor trends over time

4. **Unique Domains Calculation**:
   - Count `unique_domains_cited` from citations table

### Why Not Implemented Yet:

- Current flow focuses on **aggregated snapshots** (daily KPIs per prompt)
- Saving individual results would create massive data volume
- Decided to implement in phases to validate the approach first
- Can be added without breaking existing functionality

## Performance Considerations

### Optimization:

- ✅ Idempotency: Won't recalculate if snapshot exists for today
- ✅ Batching: Processes multiple prompts in one stream
- ✅ Concurrent queries: Uses Promise.all where possible
- ✅ Early returns: Skips if no data available

### Throttling:

- 3 LLM samples per prompt (configurable)
- 500ms delay between samples
- Per-workspace processing to avoid cross-workspace rate limits

## Monitoring & Logging

Enhanced logging throughout:

```
[Daily KPI Stream] Found 5 competitors for topic: ["Flagsmith", "ConfigCat"...]
[Daily KPI Stream] Calculating KPIs for prompt (region: US, language: English)
[Daily KPI Stream] Got 3 KPI samples for prompt
[Daily KPI Stream] Aggregated metrics: {visibilityScore: 85, brandPositions: 3}
[Topic KPIs] Aggregated metrics for topic: {visibilityScore: 78, avgRank: 2.3}
```

## Error Handling

- ✅ Graceful failures: Continues processing other prompts if one fails
- ✅ Error counting: Returns summary with error count
- ✅ Detailed logging: All errors logged with context
- ✅ Rollback safety: Uses upsert for topic snapshots

## Next Steps (Sprint 3)

1. Build UI for Topics view with aggregated metrics
2. Show competitor icons and positions
3. Implement expandable prompts under topics
4. Add trend charts (visibility over time)
5. Save individual results for detailed analysis

---

**Status**: ✅ Sprint 2 Complete
**Next Sprint**: Sprint 3 - Topics UI & Visualization
