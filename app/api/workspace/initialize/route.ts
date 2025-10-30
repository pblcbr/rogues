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
    console.log("[API] Full request body:", JSON.stringify(body, null, 2));

    const {
      workspaceId,
      brandWebsite,
      brandDescription,
      region,
      language,
      visibilityAnalysis,
      generatedTopics,
      selectedTopics,
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
    console.log("[API] Generated Topics:", generatedTopics);
    console.log("[API] Selected Topics:", selectedTopics);
    console.log("[API] Custom Topics:", customTopics);
    // Get default region for this workspace
    console.log("[API] Looking for default region for workspace:", workspaceId);

    const { data: defaultRegion, error: regionError } = await supabase
      .from("workspace_regions")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("is_default", true)
      .single();

    let regionToUse = defaultRegion;

    if (regionError || !defaultRegion) {
      console.error("[API] Error fetching default region:", regionError);

      // Try to find any region for this workspace as fallback
      const { data: anyRegion } = await supabase
        .from("workspace_regions")
        .select("id")
        .eq("workspace_id", workspaceId)
        .single();

      if (anyRegion) {
        console.log("[API] Using fallback region:", anyRegion.id);
        regionToUse = anyRegion;
      } else {
        console.error("[API] No regions found for workspace");
        return NextResponse.json(
          { error: "No regions found for workspace" },
          { status: 500 }
        );
      }
    }

    if (!regionToUse) {
      console.error("[API] No region found for workspace");
      return NextResponse.json(
        { error: "No region found for workspace" },
        { status: 500 }
      );
    }

    console.log("[API] Using region ID:", regionToUse.id);

    // 1. Update workspace with region and language (NOT profile - region/language belong to workspace)
    if (region || language) {
      const workspaceUpdate: {
        region?: string;
        language?: string;
        brand_website?: string | null;
      } = {};

      if (region) workspaceUpdate.region = region;
      if (language) workspaceUpdate.language = language;
      if (brandWebsite) workspaceUpdate.brand_website = brandWebsite;

      const { error: workspaceUpdateError } = await supabase
        .from("workspaces")
        .update(workspaceUpdate)
        .eq("id", workspaceId);

      if (workspaceUpdateError) {
        console.error(
          "[API] ❌ Error updating workspace:",
          workspaceUpdateError
        );
      } else {
        console.log("[API] ✓ Workspace updated with region/language");
      }
    }

    // 2. Update profile with registration data (but NOT region/language - those belong to workspace)
    console.log("[API] Attempting to update profile with data:", {
      userId: user.id,
      brandWebsite,
      brandDescription,
      hasBrandWebsite: !!brandWebsite,
      hasBrandDescription: !!brandDescription,
    });

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        brand_website: brandWebsite,
        brand_description: brandDescription,
        visibility_analysis: visibilityAnalysis,
        workspace_id: workspaceId,
        current_workspace_region_id: regionToUse.id,
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

    // Note: Topics and prompts are now automatically generated when the default region is created
    // in /api/workspace/create-from-payment, so we don't need to insert them here anymore.

    console.log("[API] ✅ Workspace initialization complete");

    return NextResponse.json({
      success: true,
      message: "Workspace initialized successfully",
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
