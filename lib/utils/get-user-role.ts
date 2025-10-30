/**
 * Utility to get user role in a workspace
 */

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { WorkspaceRole } from "./permissions";

/**
 * Get the current user's role in a specific workspace
 * Falls back to checking workspaces.owner_id if not found in workspace_members
 */
export async function getUserRoleInWorkspace(
  workspaceId: string | null | undefined,
  userId?: string
): Promise<WorkspaceRole | null> {
  if (!workspaceId) return null;

  const supabase = createRouteHandlerClient({ cookies });

  // Get current user if not provided
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return null;

  // First, try to get role from workspace_members
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (data && !error) {
    return data.role as WorkspaceRole;
  }

  // If not found in workspace_members, check if user is owner via workspaces table
  // This is a fallback for cases where workspace_members wasn't properly set up
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .single();

  if (!workspaceError && workspace?.owner_id === userId) {
    // User is owner but not in workspace_members - return owner role
    return "owner";
  }

  return null;
}

/**
 * Get the current user's role in the current workspace
 */
export async function getCurrentUserRole(): Promise<WorkspaceRole | null> {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile?.current_workspace_id) return null;

  return getUserRoleInWorkspace(profile.current_workspace_id, user.id);
}
