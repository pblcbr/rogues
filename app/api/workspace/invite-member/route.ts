import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUserRoleInWorkspace } from "@/lib/utils/get-user-role";
import { canInviteMembers } from "@/lib/utils/permissions";
import type { WorkspaceRole } from "@/lib/utils/permissions";

/**
 * POST /api/workspace/invite-member
 * Invite a new member to the workspace
 * Only admins and owners can invite members
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

    const {
      workspaceId,
      email,
      role,
    }: { workspaceId: string; email: string; role: WorkspaceRole } =
      await request.json();

    if (!workspaceId || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields: workspaceId, email, role" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["owner", "admin", "analyst"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user has permission to invite
    const userRole = await getUserRoleInWorkspace(workspaceId, user.id);
    if (!canInviteMembers(userRole)) {
      return NextResponse.json(
        { error: "You don't have permission to invite members" },
        { status: 403 }
      );
    }

    // Only owner can invite as owner
    if (role === "owner" && userRole !== "owner") {
      return NextResponse.json(
        { error: "Only owners can invite other owners" },
        { status: 403 }
      );
    }

    // Get workspace to check plan limits
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("plan, id")
      .eq("id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check current member count
    const { count: memberCount, error: countError } = await supabase
      .from("workspace_members")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    if (countError) {
      return NextResponse.json(
        { error: "Failed to check member count" },
        { status: 500 }
      );
    }

    // Check plan limits: starter = 1, growth = 3
    const maxMembers =
      workspace.plan === "starter" ? 1 : workspace.plan === "growth" ? 3 : 999;

    if ((memberCount || 0) >= maxMembers) {
      return NextResponse.json(
        {
          error: `Member limit reached. ${workspace.plan} plan allows ${maxMembers} member${
            maxMembers > 1 ? "s" : ""
          }.`,
        },
        { status: 400 }
      );
    }

    // Check if user exists by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error:
            "User with this email does not exist. They must sign up first.",
        },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const { data: existingMember, error: existingError } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", profile.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this workspace" },
        { status: 400 }
      );
    }

    // Add member
    const { data: newMember, error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspaceId,
        user_id: profile.id,
        role: role,
      })
      .select()
      .single();

    if (memberError) {
      console.error("[API] Error adding member:", memberError);
      return NextResponse.json(
        { error: "Failed to add member. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: newMember,
      message: "Member added successfully",
    });
  } catch (error) {
    console.error("[API] Error in invite-member:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
