import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { PromptsTableWrapper } from "@/components/dashboard/prompts/prompts-table-wrapper";
import { CalculateKPIsButton } from "@/components/dashboard/prompts/calculate-kpis-button";
import { Tooltip } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
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

  // Fetch plan and brand name to show cap
  const { data: ws } = await supabase
    .from("workspaces")
    .select("plan, brand_name")
    .eq("id", currentWorkspaceId || "")
    .single();
  const plan = ws?.plan || "growth";
  const cap = plan === "starter" ? 50 : 100;
  const brandName = ws?.brand_name || "Your Brand";

  // Fetch latest KPI snapshots for each prompt from prompt_kpi_snapshots table
  // Get the most recent snapshot for each prompt (today or latest available)
  const promptsWithKPIs = await Promise.all(
    (prompts || []).map(async (prompt) => {
      // Get the latest KPI snapshot for this prompt
      const { data: latestSnapshot } = await supabase
        .from("prompt_kpi_snapshots")
        .select(
          "visibility_score, mention_rate, citation_rate, avg_position, snapshot_date"
        )
        .eq("prompt_id", prompt.id)
        .eq("workspace_id", currentWorkspaceId || "")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .single();

      if (!latestSnapshot) {
        return {
          ...prompt,
          visibilityScore: null,
          mentionRate: null,
          citationRate: null,
          avgPosition: null,
          snapshotDate: null,
        };
      }

      return {
        ...prompt,
        visibilityScore: latestSnapshot.visibility_score,
        mentionRate: latestSnapshot.mention_rate,
        citationRate: latestSnapshot.citation_rate,
        avgPosition: latestSnapshot.avg_position?.toFixed(2) || null,
        snapshotDate: latestSnapshot.snapshot_date,
      };
    })
  );

  // Find the most recent snapshot date across all prompts
  const mostRecentSnapshotDate = promptsWithKPIs.reduce(
    (latest, prompt) => {
      if (!prompt.snapshotDate) return latest;
      if (!latest) return prompt.snapshotDate;
      return prompt.snapshotDate > latest ? prompt.snapshotDate : latest;
    },
    null as string | null
  );

  // Calculate days ago
  let lastCalculatedText = "Never";
  let lastCalculatedBadgeColor = "bg-gray-100 text-gray-600";

  if (mostRecentSnapshotDate) {
    const today = new Date().toISOString().split("T")[0];
    const snapshotDate = new Date(mostRecentSnapshotDate);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - snapshotDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      lastCalculatedText = "Today";
      lastCalculatedBadgeColor = "bg-green-100 text-green-700";
    } else if (diffDays === 1) {
      lastCalculatedText = "Yesterday";
      lastCalculatedBadgeColor = "bg-yellow-100 text-yellow-700";
    } else if (diffDays <= 7) {
      lastCalculatedText = `${diffDays} days ago`;
      lastCalculatedBadgeColor = "bg-orange-100 text-orange-700";
    } else {
      lastCalculatedText = `${diffDays} days ago`;
      lastCalculatedBadgeColor = "bg-red-100 text-red-700";
    }
  }

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
        <CalculateKPIsButton
          workspaceId={currentWorkspaceId || ""}
          regionId={currentRegionId}
        />
      </div>

      {/* Prompts Table with KPIs */}
      <PromptsTableWrapper
        prompts={promptsWithKPIs || []}
        cap={cap}
        regionId={currentRegionId}
        workspaceId={currentWorkspaceId || ""}
        brandName={brandName}
      />
    </div>
  );
}
