import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { generateTopicsForDomain } from "@/lib/openai/topic-generator";
import { generatePromptsForTopics } from "@/lib/openai/prompt-from-topic";

/**
 * GET /api/workspace-regions
 * List all regions for a workspace
 * Query params: workspaceId
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Get all regions for this workspace
    console.log(
      "[API workspace-regions] Fetching regions for workspace:",
      workspaceId
    );
    const { data: regions, error } = await supabase
      .from("workspace_regions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[API workspace-regions] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(
      "[API workspace-regions] Found",
      regions?.length || 0,
      "regions"
    );
    return NextResponse.json({ regions: regions || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspace-regions
 * Create a new region for a workspace
 * Body: { workspaceId, region, language }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, region, language } = await request.json();

    if (!workspaceId || !region || !language) {
      return NextResponse.json(
        { error: "workspaceId, region, and language are required" },
        { status: 400 }
      );
    }

    // Verify user owns this workspace and get workspace details
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, domain, plan")
      .eq("id", workspaceId)
      .eq("owner_id", user.id)
      .single();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or unauthorized" },
        { status: 403 }
      );
    }

    // Get user profile to get brand_description
    const { data: profile } = await supabase
      .from("profiles")
      .select("brand_description")
      .eq("id", user.id)
      .single();

    // Create new region
    const { data: newRegion, error } = await supabase
      .from("workspace_regions")
      .insert({
        workspace_id: workspaceId,
        region,
        language,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[API workspace-regions] ✅ Region created:", newRegion.id);

    // Return immediately, then trigger async generation
    // Execute generation in background (non-blocking)
    (async () => {
      try {
        console.log(
          "[API workspace-regions] Starting async topic/prompt generation..."
        );

        // Get workspace brand info for generation
        const { data: workspaceData } = await supabase
          .from("workspaces")
          .select("brand_name, brand_description, domain, brand_website")
          .eq("id", workspaceId)
          .single();

        const domain =
          workspaceData?.domain ||
          workspaceData?.brand_website ||
          workspaceData?.brand_name ||
          "";
        const brandName = workspaceData?.brand_name || "";
        const brandDescription =
          workspaceData?.brand_description || profile?.brand_description || "";

        console.log(
          "[API workspace-regions] Generating topics for domain:",
          domain
        );
        console.log("[API workspace-regions] Brand:", brandName);
        console.log("[API workspace-regions] Description:", brandDescription);

        // Generate topics using OpenAI
        const topicsResult = await generateTopicsForDomain(domain, {
          brandHint:
            brandDescription || `${brandName} - ${brandDescription || ""}`,
          context: {
            regions_languages: `${region}, ${language}`,
          },
          count: 10, // Generate 10 topics
        });

        const topics = topicsResult.topics || [];
        console.log(
          `[API workspace-regions] Generated ${topics.length} topics`
        );

        if (topics.length > 0) {
          // Insert topics
          const { error: topicsError } = await supabase.from("topics").insert(
            topics.map((t) => ({
              workspace_id: workspaceId,
              workspace_region_id: newRegion.id,
              name: t.name,
              is_selected: true,
              source: "ai_generated",
            }))
          );

          if (topicsError) {
            console.error(
              "[API workspace-regions] Topics insert error:",
              topicsError
            );
          } else {
            console.log(
              `[API workspace-regions] Inserted ${topics.length} topics`
            );

            // Fetch inserted topics to get IDs
            const { data: insertedTopics } = await supabase
              .from("topics")
              .select("id, name")
              .eq("workspace_id", workspaceId)
              .eq("workspace_region_id", newRegion.id)
              .eq("is_selected", true);

            if (insertedTopics && insertedTopics.length > 0) {
              // Generate prompts from topics
              console.log(
                "[API workspace-regions] Generating prompts from topics..."
              );
              console.log(
                "[API workspace-regions] Using language:",
                language,
                "region:",
                region
              );
              const topicsWithFullData = topics.filter((t) =>
                insertedTopics.some((td) => td.name === t.name)
              );

              const prompts = await generatePromptsForTopics(
                topicsWithFullData,
                8, // 8 prompts per topic
                language, // Pass language explicitly
                region // Pass region explicitly
              );
              console.log(
                `[API workspace-regions] Generated ${prompts.length} prompts for ${language}`
              );

              const topicMap = new Map(
                insertedTopics.map((t) => [t.name, t.id])
              );

              const rows = prompts.map((p) => ({
                workspace_id: workspaceId,
                workspace_region_id: newRegion.id,
                prompt_text: p.text,
                topic_id: p.topic ? topicMap.get(p.topic) || null : null,
                is_active: true,
                source: "ai_generated",
              }));

              if (rows.length > 0) {
                // Cap at 50 prompts for starter plan, 100 for growth
                const plan = workspace?.plan || "starter";
                const maxPrompts = plan === "starter" ? 50 : 100;
                const { error: promptsError } = await supabase
                  .from("monitoring_prompts")
                  .insert(rows.slice(0, maxPrompts));

                if (promptsError) {
                  console.error(
                    "[API workspace-regions] Prompts insert error:",
                    promptsError
                  );
                } else {
                  console.log(
                    `[API workspace-regions] Inserted ${rows.slice(0, maxPrompts).length} prompts`
                  );
                }
              }
            }
          }
        } else {
          console.warn(
            "[API workspace-regions] No topics generated, skipping prompt generation"
          );
        }

        console.log(
          "[API workspace-regions] ✅ Async generation completed successfully"
        );
      } catch (error) {
        console.error(
          "[API workspace-regions] ❌ Async generation error:",
          error
        );
      }
    })();

    return NextResponse.json({ region: newRegion, generating: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
