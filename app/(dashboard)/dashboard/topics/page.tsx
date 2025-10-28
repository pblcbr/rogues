import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { type Database } from "@/lib/supabase/types";
import { TopicsManagement } from "@/components/dashboard/topics/topics-management";

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

  // Fetch workspace and current region
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id, current_workspace_region_id")
    .eq("id", session.user.id)
    .single();

  const currentWorkspaceId = profile?.current_workspace_id;
  const currentRegionId = profile?.current_workspace_region_id;

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
  let promptCounts: Record<string, number> = {};

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

    (prompts || []).forEach((p: any) => {
      if (p.topic_id) {
        promptCounts[p.topic_id] = (promptCounts[p.topic_id] || 0) + 1;
      }
    });
  }

  // Add prompt count to each topic
  const topicsWithCounts = (topics || []).map((topic) => ({
    ...topic,
    promptCount: promptCounts[topic.id] || 0,
  }));

  const selectedCount =
    topicsWithCounts.filter((t) => t.is_selected).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Monitoring Topics</h1>
        <p className="mt-2 text-gray-600">
          Topics that generate monitoring prompts for your brand
        </p>
      </div>

      {/* Topics Grid */}
      <TopicsManagement topics={topicsWithCounts} />
    </div>
  );
}
