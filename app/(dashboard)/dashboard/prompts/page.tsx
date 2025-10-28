import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { PromptsTable } from "@/components/dashboard/prompts/prompts-table";
import { AddPromptDialog } from "@/components/dashboard/prompts/add-prompt-dialog";
import { GeneratePromptsButton } from "@/components/dashboard/prompts/generate-prompts-button";
import { Tooltip } from "@/components/ui/tooltip";
import { Plus, Target, HelpCircle } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

/**
 * Prompts Management Page
 * CRUD interface for monitoring prompts
 */
export default async function PromptsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  // Fetch workspace and current region
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id, current_workspace_region_id")
    .eq("id", session.user.id)
    .single();

  const currentWorkspaceId = profile?.current_workspace_id;
  const currentRegionId = profile?.current_workspace_region_id;

  // Fetch all prompts with topic data (filter by region if selected)
  let promptsQuery = supabase
    .from("monitoring_prompts")
    .select("*, topics(name)")
    .eq("workspace_id", currentWorkspaceId || "");

  // Only filter by region if a specific region is selected (not "All Regions")
  if (currentRegionId) {
    promptsQuery = promptsQuery.eq("workspace_region_id", currentRegionId);
  }

  const { data: prompts } = await promptsQuery.order("created_at", {
    ascending: false,
  });

  // Fetch plan to show cap
  const { data: ws } = await supabase
    .from("workspaces")
    .select("plan")
    .eq("id", currentWorkspaceId || "")
    .single();
  const plan = ws?.plan || "growth";
  const cap = plan === "starter" ? 50 : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Monitoring Prompts
            </h1>
            <p className="mt-2 text-gray-600">
              Manage queries to track your brand visibility in AI responses
            </p>
          </div>
          <Tooltip
            content="Replace mode is enabled. When the cap is reached, the oldest active prompts are deactivated to free slots. Pinned prompts are preserved."
            side="right"
            sideOffset={-8}
          >
            <HelpCircle className="h-5 w-5 flex-shrink-0 cursor-help text-gray-400 hover:text-gray-600" />
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <GeneratePromptsButton workspaceId={currentWorkspaceId || ""} />
          <AddPromptDialog workspaceId={currentWorkspaceId || ""}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Prompt
            </Button>
          </AddPromptDialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Active</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {(prompts?.filter((p) => p.is_active).length || 0).toString()}
            <span className="ml-1 text-sm font-medium text-gray-500">
              / {cap}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-gray-600">Active</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {prompts?.filter((p) => p.is_active).length || 0}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-gray-400"></div>
            <span className="text-sm font-medium text-gray-600">Inactive</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {prompts?.filter((p) => !p.is_active).length || 0}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">
              Avg. Mentions
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">32</p>
        </div>
      </div>

      {/* Prompts Table */}
      <PromptsTable prompts={prompts || []} />
    </div>
  );
}
