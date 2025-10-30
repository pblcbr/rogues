"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/use-toast";
import { WorkspaceCard } from "./workspace-card";
import { getUserRoleInWorkspace } from "@/lib/utils/get-user-role";
import type { WorkspaceRole } from "@/lib/utils/permissions";

interface WorkspaceMembership {
  workspace: any;
  role: WorkspaceRole;
}

interface WorkspacesSectionProps {
  user: any;
  initialWorkspaces?: any[];
}

/**
 * Workspaces Section
 * Manage all workspaces the user has access to
 */
export function WorkspacesSection({
  user,
  initialWorkspaces = [],
}: WorkspacesSectionProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClient();
  const { error: showError, success } = useToast();

  useEffect(() => {
    loadWorkspaces();
  }, [user?.id]);

  const loadWorkspaces = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get all workspace memberships
      const { data: memberships, error: memberError } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setWorkspaces([]);
        setIsLoading(false);
        return;
      }

      // Get workspace details for each membership
      const workspaceIds = memberships.map((m) => m.workspace_id);
      const { data: workspacesData, error: workspacesError } = await supabase
        .from("workspaces")
        .select(
          "id, brand_name, brand_website, region, language, created_at, plan, active_llms"
        )
        .in("id", workspaceIds);

      if (workspacesError) throw workspacesError;

      // Combine memberships with workspace data
      const workspaceList: WorkspaceMembership[] = memberships
        .map((m) => {
          const workspace = workspacesData?.find(
            (w) => w.id === m.workspace_id
          );
          return {
            workspace: workspace || null,
            role: m.role as WorkspaceRole,
          };
        })
        .filter((w) => w.workspace !== null);

      setWorkspaces(workspaceList);
    } catch (err: any) {
      console.error("Error loading workspaces:", err);
      showError("Error", err.message || "Failed to load workspaces");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = () => {
    // Open the add workspace modal
    const event = new CustomEvent("openAddWorkspaceModal");
    window.dispatchEvent(event);
  };

  return (
    <>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                My Workspaces
              </h2>
              <p className="text-sm text-gray-500">
                Manage all your workspaces and teams
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
            <Building2 className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No Workspaces Yet
            </h3>
            <p className="mb-4 max-w-md text-sm text-gray-500">
              Create your first workspace to start managing your brand's AI
              visibility
            </p>
            <Button onClick={handleCreateWorkspace}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {workspaces.map(({ workspace, role }) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                userRole={role}
                user={user}
                onUpdate={loadWorkspaces}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
