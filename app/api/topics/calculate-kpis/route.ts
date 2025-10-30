import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";

/**
 * POST /api/topics/calculate-kpis
 * Calculates and saves aggregated KPI metrics at topic level
 * Combines data from all prompts under each topic
 */
export async function POST(request: NextRequest) {
  console.log("[Topic KPIs] Starting topic-level KPI calculation");

  const supabase = createServerComponentClient<Database>({ cookies });

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.error("[Topic KPIs] Unauthorized - no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { workspaceId?: string; topicId?: string; force?: boolean } = {};
  try {
    body = await request.json();
  } catch (e) {
    console.error("[Topic KPIs] Error parsing body:", e);
  }

  const { workspaceId, topicId, force = false } = body;
  console.log("[Topic KPIs] Params:", { workspaceId, topicId, force });

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId required" },
      { status: 400 }
    );
  }

  // Verify user has access to this workspace
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", session.user.id)
    .single();

  if (profile?.current_workspace_id !== workspaceId) {
    console.error("[Topic KPIs] Unauthorized - workspace mismatch");
    return NextResponse.json(
      { error: "Unauthorized workspace" },
      { status: 403 }
    );
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // Fetch topics for this workspace
    let topicsQuery = supabase
      .from("topics")
      .select("id, name, competitors")
      .eq("workspace_id", workspaceId);

    if (topicId) {
      topicsQuery = topicsQuery.eq("id", topicId);
    }

    const { data: topics } = await topicsQuery;

    if (!topics || topics.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No topics found",
        summary: { total: 0, processed: 0, skipped: 0, errors: 0 },
      });
    }

    console.log(`[Topic KPIs] Found ${topics.length} topic(s) to process`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    // Process each topic
    for (const topic of topics) {
      try {
        console.log(
          `[Topic KPIs] Processing topic: ${topic.name} (${topic.id})`
        );

        // Check if already calculated today (unless force=true)
        if (!force) {
          const { data: existing } = await supabase
            .from("topic_kpi_snapshots")
            .select("id")
            .eq("topic_id", topic.id)
            .eq("snapshot_date", today)
            .single();

          if (existing) {
            console.log(
              `[Topic KPIs] Snapshot already exists for topic ${topic.id} on ${today}, skipping`
            );
            skipped++;
            continue;
          }
        }

        // Fetch all prompts for this topic
        const { data: prompts } = await supabase
          .from("monitoring_prompts")
          .select("id, workspace_region_id")
          .eq("topic_id", topic.id)
          .eq("is_active", true);

        if (!prompts || prompts.length === 0) {
          console.log(`[Topic KPIs] No active prompts for topic ${topic.id}`);
          skipped++;
          continue;
        }

        console.log(
          `[Topic KPIs] Found ${prompts.length} active prompts for topic ${topic.id}`
        );

        // Fetch latest KPI snapshots for all prompts in this topic
        const promptIds = prompts.map((p) => p.id);
        const { data: promptSnapshots } = await supabase
          .from("prompt_kpi_snapshots")
          .select("*")
          .in("prompt_id", promptIds)
          .eq("snapshot_date", today);

        if (!promptSnapshots || promptSnapshots.length === 0) {
          console.log(
            `[Topic KPIs] No prompt snapshots found for today for topic ${topic.id}`
          );
          skipped++;
          continue;
        }

        console.log(
          `[Topic KPIs] Found ${promptSnapshots.length} prompt snapshots for topic ${topic.id}`
        );

        // Aggregate metrics across all prompts
        const totalPromptsProcessed = promptSnapshots.length;
        const totalLLMQueries = promptSnapshots.reduce(
          (sum, s) => sum + (s.total_measurements || 0),
          0
        );

        // Visibility metrics (our brand)
        const ourBrandMentionCount = promptSnapshots.reduce(
          (sum, s) => sum + (s.mention_count || 0),
          0
        );
        const visibilityScore =
          totalLLMQueries > 0
            ? Math.round((ourBrandMentionCount / totalLLMQueries) * 100)
            : 0;

        // TODO: Relevancy metrics (our brand + competitors)
        // This requires analyzing brand_analysis data from results
        // For now, we use visibility as a proxy
        const relevancyScore = visibilityScore;
        const totalBrandMentions = ourBrandMentionCount;

        // Positioning metrics
        const positions = promptSnapshots
          .map((s) => s.avg_position)
          .filter((p): p is number => p !== null && p !== undefined);

        const avgRank =
          positions.length > 0
            ? positions.reduce((sum, p) => sum + p, 0) / positions.length
            : null;
        const bestRank = positions.length > 0 ? Math.min(...positions) : null;
        const worstRank = positions.length > 0 ? Math.max(...positions) : null;

        // Citations
        const totalCitations = promptSnapshots.reduce(
          (sum, s) => sum + (s.citation_count || 0),
          0
        );

        // TODO: Competitor analysis
        // This requires brand_analysis data from individual results
        // For now, use empty objects
        const competitorMentions = {};
        const competitorPositions = {};

        // Get workspace_region_id (use first prompt's region)
        const workspaceRegionId = prompts[0]?.workspace_region_id || null;

        console.log(`[Topic KPIs] Aggregated metrics for topic ${topic.id}:`, {
          visibilityScore,
          relevancyScore,
          avgRank,
          totalCitations,
          totalPromptsProcessed,
        });

        // Insert or update topic KPI snapshot
        const { error: insertError } = await supabase
          .from("topic_kpi_snapshots")
          .upsert(
            {
              topic_id: topic.id,
              workspace_id: workspaceId,
              workspace_region_id: workspaceRegionId,
              snapshot_date: today,
              visibility_score: visibilityScore,
              our_brand_mention_count: ourBrandMentionCount,
              relevancy_score: relevancyScore,
              total_brand_mentions: totalBrandMentions,
              avg_rank: avgRank,
              best_rank: bestRank,
              worst_rank: worstRank,
              total_citations: totalCitations,
              unique_domains_cited: 0, // TODO: Calculate from citations table
              competitor_mentions: competitorMentions,
              competitor_positions: competitorPositions,
              total_prompts_measured: totalPromptsProcessed,
              total_llm_queries: totalLLMQueries,
              llm_provider: "openai",
              llm_model: "gpt-4o",
            },
            {
              onConflict: "topic_id,snapshot_date",
            }
          );

        if (insertError) {
          console.error(
            `[Topic KPIs] Error inserting snapshot for topic ${topic.id}:`,
            insertError
          );
          errors++;
        } else {
          processed++;
        }
      } catch (error: any) {
        console.error(
          `[Topic KPIs] Error processing topic ${topic.id}:`,
          error
        );
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: topics.length,
        processed,
        skipped,
        errors,
      },
    });
  } catch (error: any) {
    console.error("[Topic KPIs] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
