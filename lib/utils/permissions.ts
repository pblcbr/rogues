/**
 * Permission and Role Utilities
 * Helper functions to check user roles and permissions
 */

export type WorkspaceRole = "owner" | "admin" | "analyst";

export interface WorkspaceMember {
  user_id: string;
  role: WorkspaceRole;
}

/**
 * Check if user has a specific role in a workspace
 */
export function hasRole(
  userRole: WorkspaceRole | null | undefined,
  requiredRole: WorkspaceRole
): boolean {
  if (!userRole) return false;

  const roleHierarchy: Record<WorkspaceRole, number> = {
    owner: 3,
    admin: 2,
    analyst: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if user can edit workspace settings
 */
export function canEditWorkspace(
  userRole: WorkspaceRole | null | undefined
): boolean {
  return hasRole(userRole, "admin");
}

/**
 * Check if user can manage team members
 */
export function canManageTeam(
  userRole: WorkspaceRole | null | undefined
): boolean {
  return hasRole(userRole, "admin");
}

/**
 * Check if user can access billing
 */
export function canAccessBilling(
  userRole: WorkspaceRole | null | undefined
): boolean {
  return userRole === "owner";
}

/**
 * Check if user can invite members
 */
export function canInviteMembers(
  userRole: WorkspaceRole | null | undefined
): boolean {
  return hasRole(userRole, "admin");
}

/**
 * Check if user can remove members
 */
export function canRemoveMembers(
  userRole: WorkspaceRole | null | undefined,
  targetRole?: WorkspaceRole
): boolean {
  if (!hasRole(userRole, "admin")) return false;

  // Only owner can remove other owners
  if (targetRole === "owner") {
    return userRole === "owner";
  }

  return true;
}

/**
 * Check if user can change roles
 */
export function canChangeRoles(
  userRole: WorkspaceRole | null | undefined
): boolean {
  // Only owner can assign owner role
  return userRole === "owner";
}

/**
 * Check if user can delete workspace
 */
export function canDeleteWorkspace(
  userRole: WorkspaceRole | null | undefined
): boolean {
  return userRole === "owner";
}

/**
 * Check if user can view content (analyst can view, cannot edit)
 */
export function canViewContent(
  userRole: WorkspaceRole | null | undefined
): boolean {
  return !!userRole; // Any role can view
}
