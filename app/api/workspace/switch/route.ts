import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * POST /api/workspace/switch
 * Switch user's current workspace
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

    const { workspaceId } = await request.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    // Get default region for this workspace
    const { data: defaultRegion } = await supabase
      .from("workspace_regions")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("is_default", true)
      .single();

    // Update current workspace and region in profile
    const updateData: {
      current_workspace_id: string;
      current_workspace_region_id?: string | null;
    } = {
      current_workspace_id: workspaceId,
    };

    if (defaultRegion) {
      updateData.current_workspace_region_id = defaultRegion.id;
    } else {
      // Try to get any region if no default exists
      const { data: anyRegion } = await supabase
        .from("workspace_regions")
        .select("id")
        .eq("workspace_id", workspaceId)
        .limit(1)
        .single();

      if (anyRegion) {
        updateData.current_workspace_region_id = anyRegion.id;
      } else {
        updateData.current_workspace_region_id = null;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      console.error("[API] Error updating current workspace:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      workspaceId,
      regionId: updateData.current_workspace_region_id,
    });
  } catch (error) {
    console.error("[API] Error switching workspace:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
