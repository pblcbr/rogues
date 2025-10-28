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

    // Get default region for this workspace
    const { data: defaultRegion } = await supabase
      .from("workspace_regions")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("is_default", true)
      .single();

    if (!defaultRegion) {
      console.error("[API] No default region found for workspace");
      return NextResponse.json(
        { error: "Default region not found" },
        { status: 500 }
      );
    }

    console.log("[API] Default region ID:", defaultRegion.id);

    // 1. Update profile with registration data
    console.log("[API] Attempting to update profile with data:", {
      userId: user.id,
      brandWebsite,
      brandDescription,
      region,
      language,
      hasBrandWebsite: !!brandWebsite,
      hasBrandDescription: !!brandDescription,
      hasRegion: !!region,
      hasLanguage: !!language,
    });

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        brand_website: brandWebsite,
        brand_description: brandDescription,
        region,
        language,
        visibility_analysis: visibilityAnalysis,
        workspace_id: workspaceId,
        current_workspace_region_id: defaultRegion.id,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("[API] ❌ Error updating profile:", profileError);
      console.error("[API] Error code:", profileError.code);
      console.error("[API] Error message:", profileError.message);
      return NextResponse.json(
        { error: "Failed to update profile: " + profileError.message },
        { status: 500 }
      );
    }

    console.log("[API] ✓ Profile updated successfully");

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
          workspace_region_id: defaultRegion.id,
          name: topic.name,
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
            workspace_region_id: defaultRegion.id,
            name: topicName,
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
