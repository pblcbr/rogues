import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/workspace/initialize
 * Saves all registration data to the database after workspace creation
 * Called after successful Stripe payment
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[API] Authentication error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[API] Initializing workspace for user:", user.id);

    const body = await request.json();
    const {
      workspaceId,
      brandWebsite,
      brandDescription,
      region,
      language,
      visibilityAnalysis,
      selectedTopics,
      generatedTopics,
      customTopics,
    } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    console.log("[API] Workspace ID:", workspaceId);
    console.log("[API] Brand Website:", brandWebsite);
    console.log("[API] Region:", region);
    console.log("[API] Language:", language);
    console.log("[API] Selected Topics:", selectedTopics?.length || 0);

    // 1. Update profile with registration data
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        brand_website: brandWebsite,
        brand_description: brandDescription,
        region,
        language,
        visibility_analysis: visibilityAnalysis,
        workspace_id: workspaceId,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("[API] Error updating profile:", profileError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    console.log("[API] ✓ Profile updated");

    // 2. Prepare topics data (merge generated and custom)
    const allTopics = [];

    // Add selected generated topics
    if (generatedTopics && selectedTopics) {
      const selectedGeneratedTopics = generatedTopics.filter((topic: any) =>
        selectedTopics.includes(topic.name)
      );
      allTopics.push(
        ...selectedGeneratedTopics.map((topic: any) => ({
          workspace_id: workspaceId,
          name: topic.name,
          description: topic.description,
          category: topic.category,
          estimated_prompts: topic.estimated_prompts,
          priority: topic.priority,
          keywords: topic.keywords,
          why_it_matters: topic.why_it_matters,
          source: "ai_generated",
          is_selected: true,
        }))
      );
    }

    // Add custom topics
    if (customTopics && customTopics.length > 0) {
      allTopics.push(
        ...customTopics
          .filter((topicName: string) => selectedTopics?.includes(topicName))
          .map((topicName: string) => ({
            workspace_id: workspaceId,
            name: topicName,
            description: `Custom monitoring topic: ${topicName}`,
            category: "awareness",
            estimated_prompts: 10,
            priority: "medium",
            keywords: [topicName.toLowerCase()],
            why_it_matters: "Custom topic added by user",
            source: "custom",
            is_selected: true,
          }))
      );
    }

    console.log("[API] Total topics to insert:", allTopics.length);

    // 3. Insert topics
    if (allTopics.length > 0) {
      const { error: topicsError } = await supabase
        .from("topics")
        .insert(allTopics);

      if (topicsError) {
        console.error("[API] Error inserting topics:", topicsError);
        return NextResponse.json(
          { error: "Failed to save topics" },
          { status: 500 }
        );
      }

      console.log("[API] ✓ Topics inserted");
    }

    console.log("[API] ✅ Workspace initialization complete");

    return NextResponse.json({
      success: true,
      message: "Workspace initialized successfully",
      topicsCount: allTopics.length,
    });
  } catch (error) {
    console.error("[API] Workspace initialization error:", error);
    if (error instanceof Error) {
      console.error("[API] Error details:", error.message);
    }
    return NextResponse.json(
      { error: "Failed to initialize workspace" },
      { status: 500 }
    );
  }
}
