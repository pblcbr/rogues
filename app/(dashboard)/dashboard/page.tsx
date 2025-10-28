import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AEVTrendChart } from "@/components/dashboard/aev-trend-chart";
import { TopPromptsTable } from "@/components/dashboard/top-prompts-table";
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

  // Fetch workspace and current region
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  const currentWorkspaceId = profile?.current_workspace_id;
  const currentRegionId = profile?.current_workspace_region_id;

  // Fetch prompts (filter by region if selected)
  let promptsQuery = supabase
    .from("monitoring_prompts")
    .select("*")
    .eq("workspace_id", currentWorkspaceId || "");

  if (currentRegionId) {
    promptsQuery = promptsQuery.eq("workspace_region_id", currentRegionId);
  }

  const { data: prompts } = await promptsQuery.limit(5);

  // Fetch competitors for quick view (filter by region if selected)
  let competitorsQuery = supabase
    .from("competitors")
    .select("name, domain")
    .eq("workspace_id", currentWorkspaceId || "");

  if (currentRegionId) {
    competitorsQuery = competitorsQuery.eq(
      "workspace_region_id",
      currentRegionId
    );
  }

  const { data: competitors } = await competitorsQuery.limit(5);

  // Compute aggregates from latest snapshots/results/citations
  let aevScore = 0;
  let trustScore = 0;
  let sovPercent = 0;
  let totalMentions = 0;
  let activePromptsCount = 0;
  try {
    // Count active prompts (filter by region if selected)
    let activeCountQuery = supabase
      .from("monitoring_prompts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", currentWorkspaceId || "")
      .eq("is_active", true);

    if (currentRegionId) {
      activeCountQuery = activeCountQuery.eq(
        "workspace_region_id",
        currentRegionId
      );
    }

    activePromptsCount = (await activeCountQuery).count || 0;

    // Fetch snapshots (filter by region if selected)
    let snapsQuery = supabase
      .from("snapshots")
      .select("id")
      .eq("workspace_id", currentWorkspaceId || "");

    if (currentRegionId) {
      snapsQuery = snapsQuery.eq("workspace_region_id", currentRegionId);
    }

    const { data: snaps } = await snapsQuery
      .order("captured_at", { ascending: false })
      .limit(20);

    const snapIds = (snaps || []).map((s: any) => s.id);
    let results: any[] = [];
    if (snapIds.length > 0) {
      const { data } = await supabase
        .from("results")
        .select("id, mention_present, sentiment, prominence, alignment")
        .in("snapshot_id", snapIds);
      results = data || [];
    }

    const resultIds = results.map((r) => r.id);
    let citations: any[] = [];
    if (resultIds.length > 0) {
      const { data } = await supabase
        .from("citations")
        .select("authority_cached")
        .in("result_id", resultIds);
      citations = data || [];
    }

    const total = results.length;
    const mentionCount = results.filter((r) => r.mention_present).length;
    const avgProminence =
      total > 0
        ? results.reduce(
            (s, r) => s + (typeof r.prominence === "number" ? r.prominence : 0),
            0
          ) / total
        : 0;
    const avgSentiment =
      total > 0
        ? results.reduce(
            (s, r) => s + (typeof r.sentiment === "number" ? r.sentiment : 0),
            0
          ) /
          (results.filter((r) => typeof r.sentiment === "number").length || 1)
        : 0;
    const avgAlignment =
      total > 0
        ? results.reduce(
            (s, r) => s + (typeof r.alignment === "number" ? r.alignment : 0),
            0
          ) / total
        : 0;
    const citationAuthority = (() => {
      const vals = citations
        .map((c) =>
          typeof c.authority_cached === "number" ? c.authority_cached : null
        )
        .filter((v) => v !== null) as number[];
      if (vals.length === 0) return 0;
      return vals.reduce((s, v) => s + v, 0) / vals.length;
    })();

    const mentionRate = total > 0 ? mentionCount / total : 0;
    // Composite VisibilityScore per spec
    const V =
      0.4 * mentionRate +
      0.25 * avgProminence +
      0.2 * citationAuthority +
      0.15 * avgAlignment;
    aevScore = Math.round(100 * V);
    totalMentions = mentionCount;

    // TrustScore = 0.50 * Authority + 0.30 * Sentiment_normalized + 0.20 * Prominence
    const sentNorm = (avgSentiment + 1) / 2; // [-1,1] -> [0,1]
    const T = 0.5 * citationAuthority + 0.3 * sentNorm + 0.2 * avgProminence;
    trustScore = Math.round(100 * T);

    // Share of Voice (approx): brand touches / (brand touches + competitor touches)
    const compTouches = results.filter(
      (r) =>
        (typeof r.competitor_mentions === "number"
          ? r.competitor_mentions
          : 0) > 0
    ).length;
    const denominator = mentionCount + compTouches;
    sovPercent =
      denominator > 0 ? Math.round((mentionCount / denominator) * 100) : 0;
  } catch (e) {
    aevScore = 0;
    trustScore = 0;
    sovPercent = 0;
    totalMentions = 0;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
        <p className="mt-2 text-gray-600">
          Here's how your brand is performing in AI search engines
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="AEV Score"
          value={aevScore.toString()}
          change={0}
          icon={TrendingUp}
          description="Answer Engine Visibility"
          trend="up"
          tooltip="Measures your brand's visibility across AI-powered search engines. Combines mention rate, prominence, citation authority, and content alignment."
        />
        <MetricCard
          title="Brand Mentions"
          value={totalMentions}
          change={0}
          icon={Target}
          description="Across all prompts"
          trend="up"
          tooltip="Total number of times your brand is mentioned in AI-generated responses across all monitoring prompts."
        />
        <MetricCard
          title="Active Prompts"
          value={activePromptsCount}
          change={0}
          icon={Zap}
          description="Monitoring queries"
          trend="up"
          tooltip="Number of active monitoring queries being tracked for your brand visibility."
        />
        <MetricCard
          title="Trust Score"
          value={trustScore.toString()}
          change={0}
          icon={Eye}
          description={`SoV ${sovPercent}%`}
          trend="up"
          tooltip="Measures brand credibility and positive sentiment. Calculated from citation authority (50%), sentiment (30%), and prominence (20%). SoV shows your share of voice vs competitors."
        />
      </div>

      {/* Charts & Tables Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* AEV Trend Chart */}
        <div className="col-span-2">
          <AEVTrendChart />
        </div>

        {/* Top Prompts - Full Width */}
        <div className="col-span-2">
          <TopPromptsTable prompts={prompts || []} />
        </div>

        {/* Competitors quick view */}
        <div className="col-span-2 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Competitors
          </h3>
          {(competitors || []).length === 0 ? (
            <p className="text-sm text-gray-500">
              No competitors yet. Add them in Settings → Workspace.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {(competitors || []).map((c: any, i: number) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-md border border-gray-100 p-2"
                >
                  <span className="font-medium text-gray-900">{c.name}</span>
                  {c.domain && (
                    <span className="text-gray-500">{c.domain}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
