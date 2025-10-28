"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddWorkspaceDialog } from "./add-workspace-dialog";

interface Workspace {
  workspace_id: string;
  workspace_name: string;
  workspace_domain: string | null;
  workspace_plan: string;
  user_role: string;
  is_current: boolean;
  // Legacy fields for compatibility with direct fetch
  id?: string;
  name?: string;
  domain?: string | null;
  plan?: string;
  role?: string;
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
  const [isFetching, setIsFetching] = useState(true);
  const hasFetchedDirectly = useRef(false);

  const currentWorkspace = workspaces.find((w) => w.is_current);

  // Fetch workspaces on mount
  useEffect(() => {
    // Always try RPC first
    fetchWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - fetch only once

  const fetchWorkspaceDirectly = async (currentWorkspaceId: string) => {
    setIsFetching(true);
    try {
      // Get all workspaces where user is owner
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      console.log(
        "[WorkspaceSwitcher] Fetching all user workspaces via owner_id"
      );

      const { data, error } = await supabase
        .from("workspaces")
        .select("id, name, domain, plan")
        .eq("owner_id", user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        console.log("[WorkspaceSwitcher] Direct workspaces fetch:", data);
        const allWorkspaces: Workspace[] = data.map((ws) => ({
          workspace_id: ws.id,
          workspace_name: ws.name || "Workspace",
          workspace_domain: ws.domain,
          workspace_plan: ws.plan || "starter",
          user_role: "owner",
          is_current: ws.id === currentWorkspaceId,
          // Add legacy fields for compatibility
          id: ws.id,
          name: ws.name || "Workspace",
          domain: ws.domain,
          plan: ws.plan || "starter",
          role: "owner",
        }));

        console.log("[WorkspaceSwitcher] Setting workspaces:", allWorkspaces);
        setWorkspaces(allWorkspaces);
      } else {
        console.log("[WorkspaceSwitcher] No workspaces found");
        setWorkspaces([]);
      }
    } catch (error) {
      console.error(
        "[WorkspaceSwitcher] Error fetching workspaces directly:",
        error
      );
      setWorkspaces([]);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchWorkspaces = async () => {
    setIsFetching(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log("[WorkspaceSwitcher] No user found");
        setWorkspaces([]);
        return;
      }

      console.log("[WorkspaceSwitcher] Fetching workspaces for user:", user.id);

      const { data, error } = await supabase.rpc("get_user_workspaces", {
        user_uuid: user.id,
      });

      if (error) {
        console.error("[WorkspaceSwitcher] Error calling RPC:", error);
        throw error;
      }

      console.log("[WorkspaceSwitcher] Workspaces fetched from RPC:", data);

      // If RPC returns empty but we have currentWorkspaceId, fetch directly as fallback
      if ((!data || data.length === 0) && currentWorkspaceId) {
        console.log(
          "[WorkspaceSwitcher] RPC returned empty, using direct fetch as fallback"
        );
        fetchWorkspaceDirectly(currentWorkspaceId);
        return;
      }

      // Remove duplicates by workspace_id (not id!)
      const uniqueWorkspaces = (data || []).filter(
        (w, index, self) =>
          index ===
          self.findIndex(
            (ws) => (ws.workspace_id || ws.id) === (w.workspace_id || w.id)
          )
      );
      console.log(
        "[WorkspaceSwitcher] Setting workspaces from RPC:",
        uniqueWorkspaces.length
      );
      setWorkspaces(uniqueWorkspaces);
    } catch (error) {
      console.error("[WorkspaceSwitcher] Error fetching workspaces:", error);
      // Set empty array to prevent crashes
      setWorkspaces([]);
    } finally {
      setIsFetching(false);
    }
  };

  const switchWorkspace = async (workspaceId: string) => {
    setIsLoading(true);
    try {
      console.log("[WorkspaceSwitcher] Switching to workspace:", workspaceId);

      // Use API endpoint instead of direct Supabase update
      const response = await fetch("/api/workspace/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to switch workspace");
      }

      console.log("[WorkspaceSwitcher] Workspace switched successfully");

      // Force full page reload to ensure all data updates
      window.location.reload();
    } catch (error) {
      console.error("Error switching workspace:", error);
      alert("Failed to switch workspace");
    } finally {
      setIsLoading(false);
    }
  };

  // Show workspace switcher for everyone
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
                {currentWorkspace?.workspace_name?.[0]?.toUpperCase() ||
                  currentWorkspace?.name?.[0]?.toUpperCase() ||
                  "W"}
              </span>
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-gray-900">
                {isFetching
                  ? "Loading..."
                  : currentWorkspace?.workspace_name ||
                    currentWorkspace?.name ||
                    "No workspace"}
              </p>
              <p className="truncate text-xs text-gray-500">
                {isFetching
                  ? "..."
                  : `${workspaces.length} workspace${workspaces.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 text-gray-400" />
        </button>

        {/* Workspace Dropdown */}
        {isOpen && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="max-h-64 overflow-y-auto p-2">
              {console.log(
                "[WorkspaceSwitcher] Rendering dropdown with workspaces:",
                workspaces.length,
                workspaces
              )}
              {workspaces.map((workspace, index) => {
                console.log(
                  `[WorkspaceSwitcher] Rendering workspace ${index}:`,
                  {
                    id: workspace.workspace_id || workspace.id,
                    name: workspace.workspace_name || workspace.name,
                    is_current: workspace.is_current,
                  }
                );
                return (
                  <button
                    key={workspace.workspace_id || workspace.id}
                    onClick={() =>
                      switchWorkspace(
                        workspace.workspace_id || workspace.id || ""
                      )
                    }
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
                          {workspace.workspace_name?.[0]?.toUpperCase() ||
                            workspace.name?.[0]?.toUpperCase() ||
                            "W"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {workspace.workspace_name ||
                            workspace.name ||
                            "Unknown"}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {workspace.workspace_plan || workspace.plan} •{" "}
                          {workspace.user_role || workspace.role}
                        </p>
                      </div>
                    </div>
                    {workspace.is_current && (
                      <Check className="h-4 w-4 flex-shrink-0 text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Add Workspace Button */}
            <div className="border-t border-gray-200 p-2">
              <AddWorkspaceDialog
                onWorkspaceAdded={() => {
                  console.log(
                    "[WorkspaceSwitcher] Workspace added, refreshing..."
                  );
                  // Just refresh from RPC
                  fetchWorkspaces();
                }}
              >
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
