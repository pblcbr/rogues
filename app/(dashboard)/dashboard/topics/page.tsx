import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { type Database } from "@/lib/supabase/types";
import { TopicsTableWrapper } from "@/components/dashboard/topics/topics-table-wrapper";

/**
 * Topics Page
 * View and manage monitoring topics selected during onboarding
 */
export default async function TopicsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  // Fetch workspace and current region with all necessary info
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "current_workspace_id, current_workspace_region_id, brand_website, brand_description"
    )
    .eq("id", session.user.id)
    .single();

  const currentWorkspaceId = profile?.current_workspace_id;
  const currentRegionId = profile?.current_workspace_region_id;

  // Fetch current region details if available
  let currentRegion = null;
  if (currentRegionId) {
    const { data: regionData } = await supabase
      .from("workspace_regions")
      .select("region, language")
      .eq("id", currentRegionId)
      .single();

    currentRegion = regionData;
  }

  // Fetch topics with prompt counts (filter by region if selected)
  let topicsQuery = supabase
    .from("topics")
    .select("*")
    .eq("workspace_id", currentWorkspaceId || "");

  // Only filter by region if a specific region is selected (not "All Regions")
  if (currentRegionId) {
    topicsQuery = topicsQuery.eq("workspace_region_id", currentRegionId);
  }

  const { data: topics } = await topicsQuery.order("created_at", {
    ascending: false,
  });

  // Fetch prompt counts per topic
  const topicIds = topics?.map((t) => t.id) || [];
  const promptCounts: Record<string, number> = {};

  if (topicIds.length > 0) {
    let promptsQuery = supabase
      .from("monitoring_prompts")
      .select("topic_id")
      .in("topic_id", topicIds);

    // Filter prompts by region if a specific region is selected
    if (currentRegionId) {
      promptsQuery = promptsQuery.eq("workspace_region_id", currentRegionId);
    }

    const { data: prompts } = await promptsQuery;

    (prompts || []).forEach((p: { topic_id: string | null }) => {
      if (p.topic_id) {
        promptCounts[p.topic_id] = (promptCounts[p.topic_id] || 0) + 1;
      }
    });
  }

  // Fetch latest KPI snapshots for topics (today or most recent)
  type KPISnapshot = Database["public"]["Tables"]["topic_kpi_snapshots"]["Row"];
  const topicKPIs: Record<string, KPISnapshot> = {};

  if (topicIds.length > 0) {
    const { data: kpiSnapshots } = await supabase
      .from("topic_kpi_snapshots")
      .select("*")
      .in("topic_id", topicIds)
      .order("snapshot_date", { ascending: false });

    // Get the latest snapshot for each topic
    (kpiSnapshots || []).forEach((snapshot) => {
      if (!topicKPIs[snapshot.topic_id]) {
        topicKPIs[snapshot.topic_id] = snapshot;
      }
    });
  }

  // Add prompt count and KPIs to each topic
  const topicsWithData = (topics || []).map((topic) => ({
    ...topic,
    promptCount: promptCounts[topic.id] || 0,
    kpis: topicKPIs[topic.id] || null,
  }));

  const selectedCount = topicsWithData.filter((t) => t.is_selected).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Monitoring Topics
          </h1>
          <p className="mt-2 text-gray-600">
            Topics that generate monitoring prompts for your brand visibility
          </p>
        </div>
      </div>

      {/* Topics Table with Aggregated KPIs */}
      <TopicsTableWrapper
        topics={topicsWithData}
        workspaceId={currentWorkspaceId || ""}
        regionId={currentRegionId}
      />
    </div>
  );
}
