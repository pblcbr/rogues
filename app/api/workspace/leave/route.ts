import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUserRoleInWorkspace } from "@/lib/utils/get-user-role";

/**
 * POST /api/workspace/leave
 * Leave a workspace
 * Owners cannot leave their workspace (must transfer ownership or delete)
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

    const { workspaceId }: { workspaceId: string } = await request.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Missing required field: workspaceId" },
        { status: 400 }
      );
    }

    // Get user's role in the workspace
    const userRole = await getUserRoleInWorkspace(workspaceId, user.id);

    if (!userRole) {
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 404 }
      );
    }

    // Owners cannot leave
    if (userRole === "owner") {
      return NextResponse.json(
        {
          error:
            "Owners cannot leave their workspace. Please transfer ownership to another member or delete the workspace.",
        },
        { status: 400 }
      );
    }

    // Remove user from workspace_members
    const { error: deleteError } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("[API] Error leaving workspace:", deleteError);
      return NextResponse.json(
        { error: "Failed to leave workspace. Please try again." },
        { status: 500 }
      );
    }

    // If this was the current workspace, switch to another one or null
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .single();

    if (profile?.current_workspace_id === workspaceId) {
      // Find another workspace
      const { data: otherWorkspaces } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      await supabase
        .from("profiles")
        .update({
          current_workspace_id: otherWorkspaces?.workspace_id || null,
        })
        .eq("id", user.id);
    }

    return NextResponse.json({
      success: true,
      message: "You have left the workspace",
    });
  } catch (error) {
    console.error("[API] Error in leave workspace:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
