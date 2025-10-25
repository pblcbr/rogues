"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddWorkspaceDialog } from "./add-workspace-dialog";

interface Workspace {
  id: string;
  company_name: string;
  company_domain: string;
  plan_id: string;
  role: string;
  is_current: boolean;
}

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string;
  isAgency: boolean;
}

/**
 * Workspace Switcher Component
 * Allows agencies to switch between multiple client workspaces
 * Regular companies only see their single workspace
 */
export function WorkspaceSwitcher({
  currentWorkspaceId,
  isAgency,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const supabase = createClient();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentWorkspace = workspaces.find((w) => w.is_current);

  // Fetch workspaces only ONCE on mount - no dependencies to prevent loops
  useEffect(() => {
    fetchWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - fetch only once

  const fetchWorkspaces = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("get_user_workspaces", {
        user_uuid: user.id,
      });

      if (error) throw error;
      setWorkspaces(data || []);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    }
  };

  const switchWorkspace = async (workspaceId: string) => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Update current workspace in profile
      const { error } = await supabase
        .from("profiles")
        .update({ current_workspace_id: workspaceId })
        .eq("id", user.id);

      if (error) throw error;

      // Refresh the page to load new workspace data
      router.refresh();
      setIsOpen(false);
    } catch (error) {
      console.error("Error switching workspace:", error);
      alert("Failed to switch workspace");
    } finally {
      setIsLoading(false);
    }
  };

  // If not an agency, show simple workspace display (no switcher)
  if (!isAgency) {
    return (
      <div className="border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <span className="text-sm font-semibold text-white">
              {currentWorkspace?.company_name?.[0]?.toUpperCase() || "W"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {currentWorkspace?.company_name || "My Workspace"}
            </p>
            <p className="truncate text-xs text-gray-500">
              {currentWorkspace?.plan_id || "starter"} plan
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Agency view: Show workspace switcher
  return (
    <div className="border-b border-gray-200 px-4 py-4">
      <div className="space-y-3">
        {/* Current Workspace Selector */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-50"
        >
          <div className="flex min-w-0 flex-1 items-center space-x-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-sm font-semibold text-white">
                {currentWorkspace?.company_name?.[0]?.toUpperCase() || "W"}
              </span>
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-gray-900">
                {currentWorkspace?.company_name || "Select workspace"}
              </p>
              <p className="truncate text-xs text-gray-500">
                {workspaces.length} workspace
                {workspaces.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 text-gray-400" />
        </button>

        {/* Workspace Dropdown */}
        {isOpen && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="max-h-64 overflow-y-auto p-2">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => switchWorkspace(workspace.id)}
                  disabled={isLoading}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                    workspace.is_current
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center space-x-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                        workspace.is_current ? "bg-blue-600" : "bg-gray-200"
                      )}
                    >
                      <span className="text-xs font-semibold text-white">
                        {workspace.company_name[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {workspace.company_name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {workspace.plan_id} • {workspace.role}
                      </p>
                    </div>
                  </div>
                  {workspace.is_current && (
                    <Check className="h-4 w-4 flex-shrink-0 text-blue-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Add Workspace Button */}
            <div className="border-t border-gray-200 p-2">
              <AddWorkspaceDialog onWorkspaceAdded={fetchWorkspaces}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add workspace
                </Button>
              </AddWorkspaceDialog>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
