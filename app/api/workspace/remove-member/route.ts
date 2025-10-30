import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUserRoleInWorkspace } from "@/lib/utils/get-user-role";
import { canRemoveMembers } from "@/lib/utils/permissions";

/**
 * POST /api/workspace/remove-member
 * Remove a member from the workspace
 * Only admins and owners can remove members
 * Only owners can remove other owners
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

    const { workspaceId, memberId }: { workspaceId: string; memberId: string } =
      await request.json();

    if (!workspaceId || !memberId) {
      return NextResponse.json(
        { error: "Missing required fields: workspaceId, memberId" },
        { status: 400 }
      );
    }

    // Check if user has permission to remove members
    const userRole = await getUserRoleInWorkspace(workspaceId, user.id);
    if (!userRole) {
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 }
      );
    }

    // Get member to remove and their role
    const { data: memberToRemove, error: memberError } = await supabase
      .from("workspace_members")
      .select("user_id, role")
      .eq("id", memberId)
      .eq("workspace_id", workspaceId)
      .single();

    if (memberError || !memberToRemove) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Can't remove yourself
    if (memberToRemove.user_id === user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself. Use 'Leave Workspace' instead." },
        { status: 400 }
      );
    }

    // Check permissions
    if (!canRemoveMembers(userRole, memberToRemove.role as any)) {
      return NextResponse.json(
        { error: "You don't have permission to remove this member" },
        { status: 403 }
      );
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from("workspace_members")
      .delete()
      .eq("id", memberId)
      .eq("workspace_id", workspaceId);

    if (deleteError) {
      console.error("[API] Error removing member:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove member. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("[API] Error in remove-member:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
