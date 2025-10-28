import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * PATCH /api/user/switch-region
 * Switch the active region for the current user
 * Body: { regionId: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { regionId } = await request.json();

    if (!regionId) {
      return NextResponse.json(
        { error: "regionId is required" },
        { status: 400 }
      );
    }

    // Verify the region exists and user has access to it
    const { data: region } = await supabase
      .from("workspace_regions")
      .select("workspace_id, workspaces!inner(owner_id)")
      .eq("id", regionId)
      .single();

    if (!region || region.workspaces.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Region not found or unauthorized" },
        { status: 403 }
      );
    }

    // Update user's current region
    const { error } = await supabase
      .from("profiles")
      .update({ current_workspace_region_id: regionId })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      regionId,
      message: "Region switched successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
