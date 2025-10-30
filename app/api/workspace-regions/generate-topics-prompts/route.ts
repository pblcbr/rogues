import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { generatePromptsForTopics } from "@/lib/openai/prompt-from-topic";
import { generateTopicsForDomain } from "@/lib/openai/topic-generator";

export async function POST(request: NextRequest) {
  try {
    console.log("[Async Generation] Starting...");
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("[Async Generation] Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      workspaceId,
      regionId,
      brandName,
      brandDescription,
      region,
      language,
    } = await request.json();

    if (!workspaceId || !regionId) {
      console.error("[Async Generation] Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get workspace domain for topic generation
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("domain, brand_website")
      .eq("id", workspaceId)
      .single();

    const domain =
      workspace?.domain || workspace?.brand_website || brandName || "";

    console.log("[Async Generation] Generating topics for domain:", domain);
    console.log("[Async Generation] Brand:", brandName);
    console.log("[Async Generation] Description:", brandDescription);
    console.log("[Async Generation] Region:", region, "Language:", language);

    // Generate topics using OpenAI based on brand information
    const topicsResult = await generateTopicsForDomain(domain, {
      brandHint: brandDescription || `${brandName} - ${brandDescription || ""}`,
      context: {
        regions_languages: `${region}, ${language}`,
      },
      count: 10, // Generate 10 topics
    });

    const topics = topicsResult.topics || [];
    console.log(`[Async Generation] Generated ${topics.length} topics`);

    if (topics.length > 0) {
      const { error: topicsError } = await supabase.from("topics").insert(
        topics.map((t) => ({
          workspace_id: workspaceId,
          workspace_region_id: regionId,
          name: t.name,
          is_selected: true,
          source: "ai_generated",
        }))
      );

      if (topicsError) {
        console.error("[Async Generation] Topics error:", topicsError);
      } else {
        console.log(`[Async Generation] Inserted ${topics.length} topics`);
      }

      console.log("[Async Generation] Generating prompts...");
      const topicIds = await supabase
        .from("topics")
        .select("id, name")
        .eq("workspace_id", workspaceId)
        .eq("workspace_region_id", regionId)
        .eq("is_selected", true);

      if (topicIds.data && topicIds.data.length > 0) {
        // Generate prompts from topics with full topic data (for better AI generation)
        const topicsWithFullData = topics.filter((t) =>
          topicIds.data.some((td) => td.name === t.name)
        );

        const prompts = await generatePromptsForTopics(
          topicsWithFullData,
          8, // 8 prompts per topic
          language,
          region
        );

        const topicMap = new Map(topicIds.data.map((t) => [t.name, t.id]));

        const rows = prompts.map((p) => ({
          workspace_id: workspaceId,
          workspace_region_id: regionId,
          prompt_text: p.text,
          topic_id: p.topic ? topicMap.get(p.topic) || null : null,
          is_active: true,
          source: "ai_generated",
        }));

        if (rows.length > 0) {
          const { error: promptsError } = await supabase
            .from("monitoring_prompts")
            .insert(rows.slice(0, 50)); // Cap at 50 prompts for starter plan

          if (promptsError) {
            console.error("[Async Generation] Prompts error:", promptsError);
          } else {
            console.log(
              `[Async Generation] Inserted ${rows.slice(0, 50).length} prompts`
            );
          }
        }
      }
    } else {
      console.warn(
        "[Async Generation] No topics generated, skipping prompt generation"
      );
    }

    console.log("[Async Generation] Completed successfully");

    // Generation completed - client will detect this by checking if topics/prompts exist
    return NextResponse.json({ success: true, regionId });
  } catch (error) {
    console.error("[Async Generation] Fatal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
