import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { generatePromptsForTopics } from "@/lib/openai/prompt-from-topic";

/**
 * POST /api/prompts/generate-from-topics
 * Body: { workspaceId: string, topicNames?: string[], countPerTopic?: number }
 * If topicNames omitted, uses selected topics for the workspace.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, topicNames, countPerTopic = 8 } = await request.json();
    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Load topics for workspace and current region (selected or by names provided)
    let query = supabase
      .from("topics")
      .select("id, name")
      .eq("workspace_id", workspaceId)
      .eq("workspace_region_id", currentRegionId);

    if (Array.isArray(topicNames) && topicNames.length > 0) {
      query = query.in("name", topicNames);
    } else {
      query = query.eq("is_selected", true);
    }

    const { data: topics, error: topicsError } = await query;
    if (topicsError) {
      return NextResponse.json({ error: topicsError.message }, { status: 500 });
    }

    // Fetch user's current region from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_region_id")
      .eq("id", user.id)
      .single();

    const currentRegionId = profile?.current_workspace_region_id;

    if (!currentRegionId) {
      return NextResponse.json(
        { error: "No active region selected" },
        { status: 400 }
      );
    }

    // Get region details
    const { data: regionData } = await supabase
      .from("workspace_regions")
      .select("region, language")
      .eq("id", currentRegionId)
      .single();

    const language = regionData?.language || "English";
    const region = regionData?.region || "United States";

    // Determine plan cap (starter=50, growth=100, enterprise=100 default)
    const { data: ws } = await supabase
      .from("workspaces")
      .select("plan")
      .eq("id", workspaceId)
      .single();
    const plan = ws?.plan || "growth";
    const cap = plan === "starter" ? 50 : 100;

    // Count active prompts
    const { count: activeCount } = await supabase
      .from("monitoring_prompts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("is_active", true);

    const remaining = Math.max(0, cap - (activeCount || 0));
    // If cap reached, replace mode: deactivate oldest active prompts to free slots
    let replaceFreed = 0;
    if (remaining === 0) {
      const { data: oldestActives } = await supabase
        .from("monitoring_prompts")
        .select("id, created_at, is_pinned")
        .eq("workspace_id", workspaceId)
        .eq("is_active", true)
        .eq("is_pinned", false)
        .order("created_at", { ascending: true })
        .limit(countPerTopic * (topics?.length || 1));

      const idsToDeactivate = (oldestActives || []).map((r) => r.id);
      if (idsToDeactivate.length > 0) {
        const { error: deactErr } = await supabase
          .from("monitoring_prompts")
          .update({ is_active: false })
          .in("id", idsToDeactivate);
        if (!deactErr) replaceFreed = idsToDeactivate.length;
      }
    }

    // Generate prompts with OpenAI (with fallback)
    const prompts = await generatePromptsForTopics(
      topics || [],
      countPerTopic,
      language,
      region
    );

    // Create a map of topic name to topic id
    const topicMap = new Map(topics?.map((t) => [t.name, t.id]) || []);

    const rowsAll = prompts.map((p) => ({
      workspace_id: workspaceId,
      workspace_region_id: currentRegionId,
      prompt_text: p.text,
      topic_id: p.topic ? topicMap.get(p.topic) || null : null,
      is_active: true,
      source: "ai_generated",
    }));

    // If we freed slots, recompute remaining
    const remainingAfterReplace = (async () => {
      if (remaining > 0) return remaining;
      const { count: activeAfter } = await supabase
        .from("monitoring_prompts")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("is_active", true);
      return Math.max(0, cap - (activeAfter || 0));
    })();

    const slots = await remainingAfterReplace;
    const rows = rowsAll.slice(0, slots);

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("monitoring_prompts")
        .insert(rows);
      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      inserted: rows.length,
      cap,
      remainingBeforeInsert: remaining,
      replaceFreed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
