"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/use-toast";
import {
  Users,
  Mail,
  Loader2,
  Crown,
  ShieldCheck,
  Eye,
  Trash2,
  AlertCircle,
  Plus,
} from "lucide-react";
import type { WorkspaceRole } from "@/lib/utils/permissions";
import { canInviteMembers, canManageTeam } from "@/lib/utils/permissions";

interface WorkspaceTeamTabProps {
  workspace: any;
  user: any;
  userRole?: WorkspaceRole | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: WorkspaceRole;
  email: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Workspace Team Tab
 * Manage workspace team members
 */
export function WorkspaceTeamTab({
  workspace,
  user,
  userRole,
}: WorkspaceTeamTabProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("analyst");
  const [isInviting, setIsInviting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const supabase = createClient();
  const { success, error: showError } = useToast();

  const canManage = canManageTeam(userRole);
  const plan = workspace?.plan || "starter";
  const maxMembers = plan === "starter" ? 1 : plan === "growth" ? 3 : 999;
  const canInvite = canInviteMembers(userRole) && members.length < maxMembers;

  useEffect(() => {
    fetchMembers();
  }, [workspace?.id]);

  const fetchMembers = async () => {
    if (!workspace?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("workspace_members")
        .select(
          `
          id,
          user_id,
          role,
          profiles:user_id (
            email,
            first_name,
            last_name
          )
        `
        )
        .eq("workspace_id", workspace.id);

      if (error) throw error;

      const formattedMembers: TeamMember[] =
        data?.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          email: m.profiles?.email || "Unknown",
          first_name: m.profiles?.first_name,
          last_name: m.profiles?.last_name,
        })) || [];

      setMembers(formattedMembers);
    } catch (err: any) {
      showError("Error", err.message || "Failed to load team members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !canManage) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      showError("Invalid Email", "Please enter a valid email address");
      return;
    }

    setIsInviting(true);
    try {
      const response = await fetch("/api/workspace/invite-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace.id,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to invite member");
      }

      setInviteEmail("");
      setInviteRole("analyst");
      await fetchMembers();
      success("Invitation Sent", `Invitation sent to ${inviteEmail}`);
    } catch (err: any) {
      showError("Invitation Failed", err.message || "Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (
    memberId: string,
    memberRole: WorkspaceRole,
    memberEmail: string
  ) => {
    if (!canManage) return;

    if (memberRole === "owner" && userRole !== "owner") {
      showError("Permission Denied", "Only owners can remove other owners");
      return;
    }

    setRemovingMemberId(memberId);

    try {
      const response = await fetch("/api/workspace/remove-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace.id,
          memberId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to remove member");
      }

      await fetchMembers();
      success(
        "Member Removed",
        `${memberEmail} has been removed from the workspace`
      );
    } catch (err: any) {
      showError("Error", err.message || "Failed to remove member");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const getRoleIcon = (role: WorkspaceRole) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3.5 w-3.5" />;
      case "admin":
        return <ShieldCheck className="h-3.5 w-3.5" />;
      case "analyst":
        return <Eye className="h-3.5 w-3.5" />;
    }
  };

  const getRoleBadgeColor = (role: WorkspaceRole) => {
    switch (role) {
      case "owner":
        return "border-yellow-200 bg-yellow-50 text-yellow-700";
      case "admin":
        return "border-blue-200 bg-blue-50 text-blue-700";
      case "analyst":
        return "border-gray-200 bg-gray-50 text-gray-700";
    }
  };

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          No Workspace Selected
        </h3>
        <p className="max-w-md text-sm text-gray-500">
          Please select or create a workspace to manage team members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member Count Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Team Members</h3>
          <p className="mt-1 text-sm text-gray-500">
            {members.length} of {maxMembers === 999 ? "unlimited" : maxMembers}{" "}
            members
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-purple-200 bg-purple-50 text-purple-700"
        >
          {plan} plan
        </Badge>
      </div>

      {/* Plan Limits Notice */}
      {members.length >= maxMembers && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Member Limit Reached
              </p>
              <p className="mt-1 text-sm text-amber-700">
                You've reached the member limit for your {plan} plan. Upgrade to
                add more team members.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invite Form */}
      {canInvite && (
        <form
          onSubmit={handleInvite}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              Invite Team Member
            </h3>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="invite-email" className="sr-only">
                Email Address
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                disabled={isInviting}
                required
              />
            </div>

            {userRole === "owner" && (
              <div className="w-32">
                <Label htmlFor="invite-role" className="sr-only">
                  Role
                </Label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as WorkspaceRole)
                  }
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isInviting}
                >
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <Button type="submit" disabled={isInviting || !inviteEmail}>
              {isInviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Invite
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Members List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">No team members yet</p>
            <p className="mt-1 text-xs text-gray-500">
              Invite colleagues to collaborate on this workspace
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                    {member.first_name
                      ? member.first_name[0].toUpperCase()
                      : member.email[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {member.first_name && member.last_name
                        ? `${member.first_name} ${member.last_name}`
                        : member.email}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-3">
                  <Badge
                    variant="outline"
                    className={getRoleBadgeColor(member.role)}
                  >
                    <span className="mr-1.5">{getRoleIcon(member.role)}</span>
                    {member.role}
                  </Badge>

                  {canManage &&
                    userRole === "owner" &&
                    member.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRemoveMember(
                            member.id,
                            member.role,
                            member.email
                          )
                        }
                        disabled={removingMemberId === member.id}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {removingMemberId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Information */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">
          Role Permissions
        </h4>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <Crown className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-600" />
            <div>
              <span className="font-medium text-gray-900">Owner:</span> Full
              access including billing and member management
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
            <div>
              <span className="font-medium text-gray-900">Admin:</span> Can edit
              workspace settings and invite members
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-600" />
            <div>
              <span className="font-medium text-gray-900">Analyst:</span>{" "}
              View-only access to workspace data
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
