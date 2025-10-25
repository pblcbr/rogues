import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePromptsForTopics } from "@/lib/openai/prompt-from-topic";

/**
 * POST /api/prompts/generate-from-topics
 * Body: { workspaceId: string, topicNames?: string[], countPerTopic?: number }
 * If topicNames omitted, uses selected topics for the workspace.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
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

    // Load topics for workspace (selected or by names provided)
    let query = supabase
      .from("topics")
      .select("name, description, category, keywords")
      .eq("workspace_id", workspaceId);

    if (Array.isArray(topicNames) && topicNames.length > 0) {
      query = query.in("name", topicNames);
    } else {
      query = query.eq("is_selected", true);
    }

    const { data: topics, error: topicsError } = await query;
    if (topicsError) {
      return NextResponse.json({ error: topicsError.message }, { status: 500 });
    }

    // Generate prompts with OpenAI (with fallback)
    const prompts = await generatePromptsForTopics(topics || [], countPerTopic);

    // Upsert into monitoring_prompts table
    const rows = prompts.map((p) => ({
      workspace_id: workspaceId,
      prompt_text: p.text,
      topic: p.topic || null,
      category: p.category || null,
      is_active: true,
      source: "ai_from_topic",
    }));

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

    return NextResponse.json({ success: true, inserted: rows.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
