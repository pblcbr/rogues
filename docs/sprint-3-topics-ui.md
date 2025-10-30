# Sprint 3: Topics UI & Visualization - COMPLETED ✅

## Overview

Sprint 3 implements the Topics UI with aggregated KPI visualization, following the reference design from the competitor tracking platform.

## Completed Features

### 1. Enhanced Topics Page ✅

**File**: `app/(dashboard)/dashboard/topics/page.tsx`

#### Key Changes:

- **Fetch Topic KPI Snapshots**: Load latest `topic_kpi_snapshots` for each topic
- **Data Enrichment**: Each topic now includes:
  - `promptCount`: Number of prompts
  - `kpis`: Latest aggregated KPIs from `topic_kpi_snapshots`
  - `competitors`: List of competitor brands

#### Server-Side Data Flow:

```typescript
1. Fetch all topics for workspace/region
2. Count prompts per topic
3. Fetch latest KPI snapshots per topic
4. Merge data → topicsWithData
5. Pass to client component
```

### 2. Topics Table with KPI Visualization ✅

**File**: `components/dashboard/topics/topics-table.tsx`

#### New UI Elements:

##### Table Columns:

| Column         | Description                             | Visualization              |
| -------------- | --------------------------------------- | -------------------------- |
| **Expand**     | Toggle to see prompts                   | ChevronRight/Down icon     |
| **Topic**      | Topic name + competitors + prompt count | Text + badges              |
| **Visibility** | % AI responses mentioning your brand    | Score badge + progress bar |
| **Relevancy**  | % responses mentioning any brand        | Score badge + progress bar |
| **Avg Rank**   | Average position (1, 2, 3...)           | Colored rank number        |
| **Citations**  | Total URLs cited                        | Simple number              |

##### Visual Indicators:

- **Score Colors**:
  - 🟢 Green (70-100%): Excellent visibility
  - 🟡 Yellow (40-69%): Moderate visibility
  - ⚪ Gray (0-39%): Low visibility

- **Rank Colors**:
  - 🟢 Green (#1-2): Top positions
  - 🟡 Yellow (#3-5): Mid positions
  - ⚪ Gray (#6+): Lower positions

##### Progress Bars:

- Visual representation of Visibility/Relevancy scores
- Dynamic width based on percentage
- Color-coded (green/yellow/gray)

##### Competitor Badges:

- Shows first 3 competitors under topic name
- "+X more" indicator if more than 3
- Compact design with `text-[10px]`

### 3. Expandable Rows (Prepared) ✅

**Current State**: Click on any row toggles expand/collapse
**Future Enhancement**: Show prompts list when expanded

```typescript
const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

// Toggle expand on click
onClick={() => {
  const newExpanded = new Set(expandedTopics);
  if (isExpanded) {
    newExpanded.delete(topic.id);
  } else {
    newExpanded.add(topic.id);
  }
  setExpandedTopics(newExpanded);
}}
```

### 4. Summary Cards ✅

Top of page shows 3 KPI cards:

- **Active Topics**: X / Total
- **Coverage**: Percentage of active topics
- **Total Prompts**: Sum across all topics

## UI Components Breakdown

### Topic Row Structure:

```
┌─────────────────────────────────────────────────────────────────┐
│ [>] Feature Flag Management              [85%] [90%] [#1.5]  10 │
│     Flagsmith ConfigCat +1    23 prompts   ■■■   ■■■            │
└─────────────────────────────────────────────────────────────────┘
     ↑        ↑            ↑         ↑         ↑     ↑     ↑    ↑
  Expand   Topic      Competitors Prompts  Vis  Rel  Rank Cit
```

### Visibility/Relevancy Cell:

```
┌─────────────┐
│    85%      │ ← Badge with color
│   ■■■■■     │ ← Progress bar
└─────────────┘
```

### Avg Rank Cell:

```
#1.5  ← Green (good position)
#7.2  ← Gray (lower position)
```

## Data Integration

### From `topic_kpi_snapshots`:

```typescript
{
  visibility_score: 85,        // % our brand mentioned
  relevancy_score: 90,         // % any brand mentioned
  avg_rank: 1.5,               // Average position
  best_rank: 1,                // Best position achieved
  total_citations: 10,         // Total URLs cited
  total_prompts_measured: 23,  // Prompts included
  competitor_mentions: {...},  // Per-competitor counts
  snapshot_date: "2025-10-30"  // Date calculated
}
```

## Styling & Design

### Color Scheme:

- **Greens**: Success, high scores (#10b981, #22c55e)
- **Yellows**: Warning, medium scores (#f59e0b, #eab308)
- **Grays**: Neutral, low scores (#6b7280, #9ca3af)
- **Blues**: Interactive elements (#3b82f6, #2563eb)

### Typography:

- **Headers**: `text-xs uppercase tracking-wider`
- **Scores**: `text-sm font-semibold`
- **Topic Names**: `text-sm font-medium`
- **Badges**: `text-[10px]` for compact display

### Spacing:

- **Table Padding**: `px-4 py-4` (more spacious than before)
- **Card Gap**: `gap-4` between summary cards
- **Badge Gap**: `gap-1` between competitor badges

## Responsive Behavior

### Desktop-First (1280px+):

- Full table with all columns visible
- Progress bars visible
- All competitor badges shown

### Hover States:

- Row: `hover:bg-blue-50/50` (subtle highlight)
- Expand icon: Indicates clickability
- Cells: Stop propagation on metric clicks

## User Interactions

### Click Actions:

1. **Click Row**: Toggle expand/collapse (chevron rotates)
2. **Click Metrics**: Stop propagation (for future drill-down)
3. **Click "Add new topic"**: Opens dialog

### Visual Feedback:

- Cursor changes to pointer on rows
- Subtle background color change on hover
- Smooth transitions on expand/collapse

## Performance Considerations

### Server-Side:

- Single query for all topics
- Single query for all KPI snapshots
- In-memory aggregation (fast)

### Client-Side:

- Minimal state management (only expanded topics)
- No unnecessary re-renders
- Efficient Set operations for expand state

## Future Enhancements (Pending TODOs)

### 1. Expandable Prompts List ⏳

**Status**: Infrastructure ready, content pending

When expanded, show:

```
┌─────────────────────────────────────────────────────────────────┐
│ [v] Feature Flag Management              [85%] [90%] [#1.5]  10 │
│     Flagsmith ConfigCat +1    23 prompts   ■■■   ■■■            │
├─────────────────────────────────────────────────────────────────┤
│     Prompts:                                                     │
│     1. cost effective feature flagging for startups      [90%]  │
│     2. open source vs paid feature flag tools            [85%]  │
│     3. alternatives to split io for feature toggles      [80%]  │
│     ... [Show all 23 prompts]                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Plan**:

- Fetch prompts with KPIs when topic expands
- Show mini-table inside expanded row
- Include individual prompt visibility scores
- Link to prompt detail view

### 2. Topic Detail View ⏳

**Status**: Pending

Full-page view for a topic showing:

- All prompts with their responses
- Brands mentioned per response
- Citations with titles and domains
- Competitor analysis charts
- Historical trend graphs

### 3. Competitor Icons ✅ (Badges implemented)

**Enhancement**: Replace text badges with actual logos

- Use `favicon_url` or brand logo API
- Circular avatars with brand colors
- Tooltip with brand name on hover

### 4. Trend Charts 📊

**Status**: Future enhancement

Add small sparkline charts showing:

- Visibility trend over last 7/30 days
- Rank improvement/decline
- Citation growth

## Testing Guide

### Manual Testing:

1. Navigate to `/dashboard/topics`
2. Verify summary cards show correct counts
3. Click on a topic row → chevron should rotate
4. Check that KPIs display correctly:
   - Scores with colored badges
   - Progress bars match percentages
   - Ranks show with appropriate colors
5. Verify competitor badges appear
6. Check "-" appears for topics without KPIs

### Data Requirements:

```sql
-- Ensure you have topic KPI snapshots
SELECT
  t.name,
  tks.visibility_score,
  tks.relevancy_score,
  tks.avg_rank,
  tks.snapshot_date
FROM topic_kpi_snapshots tks
JOIN topics t ON t.id = tks.topic_id
WHERE tks.snapshot_date = CURRENT_DATE;

-- If no data, run:
POST /api/topics/calculate-kpis
{
  "workspaceId": "your-workspace-id"
}
```

## Files Modified

### New/Modified Files:

```
✅ app/(dashboard)/dashboard/topics/page.tsx (enhanced data loading)
✅ components/dashboard/topics/topics-table.tsx (complete redesign)
✅ components/dashboard/topics/topics-table-wrapper.tsx (updated props)
✅ docs/sprint-3-topics-ui.md (this file)
```

## Migration from Old UI

### Before Sprint 3:

- Simple table with Topic, Prompts, Status, Actions
- No KPI visualization
- No competitor information
- No expand/collapse functionality

### After Sprint 3:

- Rich table with 6 columns including KPIs
- Visual indicators (badges, progress bars)
- Competitor badges displayed
- Expandable rows (ready for prompts list)
- Professional, data-rich interface

## Next Steps (Sprint 4)

1. **Implement Prompt Expansion**: Show prompts when topic is expanded
2. **Topic Detail Page**: Full analysis view with responses
3. **Competitor Analysis Dashboard**: Dedicated view for competitor comparison
4. **Historical Trends**: Charts showing visibility over time
5. **Export Functionality**: Download topic reports as PDF/CSV

---

**Status**: ✅ Sprint 3 Core Complete  
**Pending**: Expandable prompts content, detail views  
**Next Sprint**: Sprint 4 - Advanced Analytics & Insights
