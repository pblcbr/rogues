# Sprint 4: UI - Vista de Prompts Individual (Expandido)

## Overview

Sprint 4 implements the expandable prompts view with detailed results, brand/competitor analysis, and citations visualization.

## Objectives

### Core Goals

1. ✅ Make prompt table rows expandable/collapsible
2. ✅ Fetch and display results for each prompt
3. ✅ Show brand mention analysis (Our brand vs Competitors)
4. ✅ Display citations with domains and favicons
5. ✅ Add visual indicators for brand positions

### Design Reference

Based on the user-provided images, each expanded prompt should show:

- List of LLM results (responses)
- Brand positions in each response
- Competitor mentions and their positions
- Citations with metadata (title, domain, favicon)
- Visual indicators (badges, colors)

## Database Schema (Already in Place from Sprint 2)

### Tables Used:

- `results`: Contains `response_text`, `brands_mentioned`, `brand_positions`, `our_brand_mentioned`, `our_brand_position`, `relevancy_score`
- `citations`: Contains `url`, `title`, `domain`, `favicon_url`, `position`
- `monitoring_prompts`: The prompts themselves

## Implementation Plan

### Phase 1: Expand/Collapse Infrastructure ✅

**Files**: `components/dashboard/prompts/prompts-table.tsx`

- Add `expandedPrompts` state (Set of prompt IDs)
- Add click handler to toggle expansion
- Show chevron icon that rotates on expand

### Phase 2: Results Data Fetching 📊

**Files**:

- `app/api/prompts/[promptId]/results/route.ts` (NEW)
- `components/dashboard/prompts/prompts-table.tsx`

#### API Endpoint:

```typescript
GET / api / prompts / [promptId] / results;
Response: {
  results: Array<{
    id: string;
    response_text: string;
    brands_mentioned: { brand: string; count: number }[];
    brand_positions: { brand: string; positions: number[] }[];
    our_brand_mentioned: boolean;
    our_brand_position: number | null;
    relevancy_score: number;
    created_at: string;
    citations: Array<{
      url: string;
      title: string;
      domain: string;
      favicon_url: string;
      position: number;
    }>;
  }>;
}
```

### Phase 3: Expanded Row Component 🎨

**Files**:

- `components/dashboard/prompts/prompt-results-detail.tsx` (NEW)

#### Component Structure:

```
<PromptResultsDetail>
  ├── Loading State (Skeleton)
  ├── Error State
  └── Results List
      └── For each result:
          ├── Result Header (Date, LLM Model, Relevancy Score)
          ├── Brand Analysis Section
          │   ├── Our Brand Badge (position, mentioned/not)
          │   └── Competitors Badges (positions)
          ├── Response Preview (truncated text)
          └── Citations Section
              └── Citation Cards (domain, favicon, title)
```

### Phase 4: Brand Analysis Visualization 🏷️

**Component**: `PromptResultsDetail`

#### Visual Elements:

- **Our Brand**:
  - 🟢 Green badge if mentioned, position shown
  - 🔴 Red/gray badge if not mentioned
- **Competitors**:
  - Yellow/orange badges with positions
  - Show first 3 competitors, "+X more" if needed
- **Position Indicator**:
  - `#1`, `#2`, `#3` styled with font weight
  - Lower positions in muted colors

### Phase 5: Citations Display 📚

**Component**: `PromptResultsDetail`

#### Citation Card Design:

```
┌───────────────────────────────────────┐
│ [favicon] domain.com              #1  │
│ Article Title Here...                 │
└───────────────────────────────────────┘
```

- Favicon (16x16 or 20x20)
- Domain in bold
- Position badge on right
- Title truncated if long
- Hover state with full URL tooltip

### Phase 6: Loading & Empty States 🔄

#### Loading State:

- Skeleton placeholders for results
- Animated pulse effect

#### Empty State:

- "No results yet" message
- Suggestion to run KPI calculation

#### Error State:

- Error message with retry button

## Technical Implementation Details

### State Management

```typescript
const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
const [loadingResults, setLoadingResults] = useState<Set<string>>(new Set());
const [resultsCache, setResultsCache] = useState<Map<string, PromptResult[]>>(
  new Map()
);
```

### Fetch Strategy

- Lazy loading: Fetch results only when prompt is expanded
- Cache results to avoid refetching
- Show loading state while fetching

### Row Expansion

```typescript
const toggleExpand = async (promptId: string) => {
  const newExpanded = new Set(expandedPrompts);
  if (newExpanded.has(promptId)) {
    newExpanded.delete(promptId);
  } else {
    newExpanded.add(promptId);
    // Fetch results if not cached
    if (!resultsCache.has(promptId)) {
      await fetchResults(promptId);
    }
  }
  setExpandedPrompts(newExpanded);
};
```

## UI/UX Design

### Spacing & Layout

- Expanded row: Full-width with `bg-gray-50` background
- Inner padding: `p-6`
- Result cards: `gap-4` vertical spacing

### Typography

- Result date: `text-xs text-gray-500`
- Brand badges: `text-xs font-medium`
- Domain: `text-sm font-semibold`
- Citation title: `text-sm text-gray-600`

### Colors

- Our brand mentioned: `bg-green-100 text-green-800`
- Our brand not mentioned: `bg-red-100 text-red-800`
- Competitors: `bg-orange-100 text-orange-800`
- Position badges: `bg-blue-50 text-blue-700`

### Interactions

- Click row to expand/collapse
- Hover on citation for full URL
- Click citation to open in new tab
- Smooth expand/collapse animation

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Only fetch results when expanded
2. **Caching**: Store fetched results in memory
3. **Pagination**: If >10 results, paginate or show "Load more"
4. **Virtual Scrolling**: For very long lists (future)

### API Optimization

- Use `Promise.all` to fetch results + citations in parallel
- Add indexes on `prompt_id` in results and citations tables
- Limit to last 30 days of results by default

## Testing Checklist

### Functional Tests

- [ ] Click prompt row to expand
- [ ] Click again to collapse
- [ ] Verify results are fetched and displayed
- [ ] Verify brand badges show correct info
- [ ] Verify citations display with favicons
- [ ] Verify loading state appears

### Edge Cases

- [ ] Prompt with no results
- [ ] Prompt with only citations, no brand mentions
- [ ] Prompt with many competitors (10+)
- [ ] Very long response text
- [ ] Missing favicon URLs

### Visual Tests

- [ ] Expanded row has distinct background
- [ ] Chevron icon rotates smoothly
- [ ] Brand badges have correct colors
- [ ] Citations are readable and well-spaced
- [ ] Mobile view (if applicable)

## Files to Create/Modify

### New Files:

```
✅ docs/sprint-4-prompts-detail-ui.md
✅ app/api/prompts/[promptId]/results/route.ts
✅ components/dashboard/prompts/prompt-results-detail.tsx
```

### Modified Files:

```
✅ components/dashboard/prompts/prompts-table.tsx (add expand logic)
```

## Database Queries

### Fetch Results for Prompt:

```sql
SELECT
  r.id,
  r.response_text,
  r.brands_mentioned,
  r.brand_positions,
  r.our_brand_mentioned,
  r.our_brand_position,
  r.relevancy_score,
  r.created_at,
  COALESCE(
    json_agg(
      json_build_object(
        'url', c.url,
        'title', c.title,
        'domain', c.domain,
        'favicon_url', c.favicon_url,
        'position', c.position
      ) ORDER BY c.position
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'
  ) as citations
FROM results r
LEFT JOIN citations c ON c.result_id = r.id
WHERE r.prompt_id = $1
  AND r.created_at > NOW() - INTERVAL '30 days'
GROUP BY r.id
ORDER BY r.created_at DESC
LIMIT 50;
```

## Integration with Previous Sprints

### Sprint 2 (Enhanced Measurement)

- Uses `brands_mentioned`, `brand_positions` from results
- Uses enhanced `citations` with `title`, `domain`, `favicon_url`

### Sprint 3 (Topics UI)

- Similar expandable row pattern
- Consistent visual design language

## Future Enhancements (Post-Sprint 4)

### Sprint 5 Preparation:

- Add filter by date range
- Add filter by brand mentioned
- Add sort by relevancy score
- Export results to CSV

### Advanced Features:

- Inline response text expansion
- Sentiment analysis visualization
- Citation quality score
- Brand position trend chart per prompt

## Success Metrics

### User Experience:

- Users can quickly drill down into prompt results
- Brand presence is immediately visible
- Citations are discoverable and accessible

### Performance:

- Results load in <500ms
- Smooth expand/collapse animation
- No UI lag with 50+ results

## Summary

Sprint 4 transforms the prompts table from a static list to an interactive drill-down interface, enabling users to:

1. See detailed results per prompt
2. Analyze brand vs competitor mentions
3. Review citations and sources
4. Understand prompt performance at granular level

This sets the stage for Sprint 5 (Results Detail View) and Sprint 6 (Full Integration).
