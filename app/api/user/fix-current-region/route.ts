import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * POST /api/user/fix-current-region
 * Fixes current_workspace_region_id if it's invalid or missing
 * Auto-sets to default region if current region doesn't exist
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

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id, current_workspace_region_id")
      .eq("id", user.id)
      .single();

    if (!profile?.current_workspace_id) {
      return NextResponse.json({
        success: true,
        message: "No workspace selected",
      });
    }

    // Check if current_workspace_region_id is valid
    let needsUpdate = false;
    let correctRegionId: string | null = null;

    if (profile.current_workspace_region_id) {
      // Verify the region exists and belongs to the workspace
      const { data: region } = await supabase
        .from("workspace_regions")
        .select("id")
        .eq("id", profile.current_workspace_region_id)
        .eq("workspace_id", profile.current_workspace_id)
        .single();

      if (!region) {
        // Current region ID is invalid
        needsUpdate = true;
      } else {
        // Current region is valid
        return NextResponse.json({
          success: true,
          message: "Region ID is valid",
          regionId: profile.current_workspace_region_id,
        });
      }
    } else {
      // No region ID set
      needsUpdate = true;
    }

    if (needsUpdate) {
      // Get default region for the workspace
      const { data: defaultRegion } = await supabase
        .from("workspace_regions")
        .select("id")
        .eq("workspace_id", profile.current_workspace_id)
        .eq("is_default", true)
        .single();

      if (defaultRegion) {
        correctRegionId = defaultRegion.id;
      } else {
        // No default region, get any region
        const { data: anyRegion } = await supabase
          .from("workspace_regions")
          .select("id")
          .eq("workspace_id", profile.current_workspace_id)
          .limit(1)
          .single();

        if (anyRegion) {
          correctRegionId = anyRegion.id;
        }
      }

      if (correctRegionId) {
        // Update profile with correct region ID
        const { error } = await supabase
          .from("profiles")
          .update({ current_workspace_region_id: correctRegionId })
          .eq("id", user.id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: "Region ID fixed",
          regionId: correctRegionId,
        });
      } else {
        return NextResponse.json({
          success: false,
          message: "No regions found for workspace",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "No update needed",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
