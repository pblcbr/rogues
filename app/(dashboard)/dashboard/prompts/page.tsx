import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { PromptsTable } from "@/components/dashboard/prompts/prompts-table";
import { AddPromptDialog } from "@/components/dashboard/prompts/add-prompt-dialog";
import { Plus, Target } from "lucide-react";
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

  // Fetch workspace
  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", session.user.id)
    .single();

  // Fetch all prompts
  const { data: prompts } = await supabase
    .from("monitoring_prompts")
    .select("*")
    .eq("workspace_id", profile?.workspace_id || "")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Monitoring Prompts
          </h1>
          <p className="mt-2 text-gray-600">
            Manage queries to track your brand visibility in AI responses
          </p>
        </div>
        <AddPromptDialog workspaceId={profile?.workspace_id || ""}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Prompt
          </Button>
        </AddPromptDialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">
              Total Prompts
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {prompts?.length || 0}
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
