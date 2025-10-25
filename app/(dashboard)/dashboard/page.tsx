import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AEVTrendChart } from "@/components/dashboard/aev-trend-chart";
import { TopPromptsTable } from "@/components/dashboard/top-prompts-table";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { TrendingUp, Target, Zap, Eye } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

/**
 * Dashboard Overview Page
 * Main entry point showing key metrics and insights
 */
export default async function DashboardPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  // Fetch workspace and prompts
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, workspaces(*)")
    .eq("id", session.user.id)
    .single();

  const { data: prompts } = await supabase
    .from("monitoring_prompts")
    .select("*")
    .eq("workspace_id", profile?.workspace_id || "")
    .limit(5);

  // Mock metrics (in production, calculate from results)
  const metrics = {
    aevScore: 8.2,
    aevChange: 12,
    totalMentions: 247,
    mentionsChange: 18,
    activePrompts: prompts?.length || 0,
    promptsChange: 5,
    impressions: 15420,
    impressionsChange: 24,
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.first_name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's how your brand is performing in AI search engines
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="AEV Score"
          value={metrics.aevScore.toFixed(1)}
          change={metrics.aevChange}
          icon={TrendingUp}
          description="Answer Engine Visibility"
          trend="up"
        />
        <MetricCard
          title="Brand Mentions"
          value={metrics.totalMentions}
          change={metrics.mentionsChange}
          icon={Target}
          description="Across all prompts"
          trend="up"
        />
        <MetricCard
          title="Active Prompts"
          value={metrics.activePrompts}
          change={metrics.promptsChange}
          icon={Zap}
          description="Monitoring queries"
          trend="up"
        />
        <MetricCard
          title="Impressions"
          value={metrics.impressions.toLocaleString()}
          change={metrics.impressionsChange}
          icon={Eye}
          description="Potential reach"
          trend="up"
        />
      </div>

      {/* Charts & Tables Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* AEV Trend Chart */}
        <div className="col-span-2">
          <AEVTrendChart />
        </div>

        {/* Top Prompts */}
        <TopPromptsTable prompts={prompts || []} />

        {/* Recent Activity */}
        <RecentActivityFeed />
      </div>
    </div>
  );
}
