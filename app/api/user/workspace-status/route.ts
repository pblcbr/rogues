import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/user/workspace-status
 * Checks if current user has a workspace (payment completed)
 */
export async function GET() {
  try {
    console.log("[WORKSPACE STATUS] Checking workspace...");
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("[WORKSPACE STATUS] ❌ No user found:", userError?.message);
      return NextResponse.json({ hasWorkspace: false });
    }

    console.log("[WORKSPACE STATUS] ✓ User authenticated:", user.id);

    // Try to get workspace_id from profile first (if column exists)
    let workspaceId: string | null = null;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("workspace_id, current_workspace_id")
        .eq("id", user.id)
        .single();

      // Try workspace_id first, then current_workspace_id
      workspaceId =
        profile?.workspace_id || profile?.current_workspace_id || null;
    } catch (err) {
      console.log(
        "[WORKSPACE STATUS] Columns may not exist yet, trying alternative method"
      );
    }

    // If workspace_id not found, try to find workspace by owner_id
    if (!workspaceId) {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      workspaceId = workspace?.id || null;
    }

    console.log("[WORKSPACE STATUS] Workspace found:", workspaceId);

    return NextResponse.json({
      hasWorkspace: !!workspaceId,
      workspaceId: workspaceId,
    });
  } catch (error) {
    console.error("[WORKSPACE STATUS] 💥 Unexpected error:", error);
    return NextResponse.json({ hasWorkspace: false }, { status: 500 });
  }
}
