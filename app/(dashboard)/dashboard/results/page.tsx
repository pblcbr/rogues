import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { ResultsFilters } from "@/components/dashboard/results/results-filters";
import { ResultsGrid } from "@/components/dashboard/results/results-grid";
import { TrendingUp, Target, Award, BarChart3 } from "lucide-react";
import { RunMeasurement } from "@/components/dashboard/results/run-measurement";
import type { Database } from "@/lib/supabase/types";

/**
 * Results Analysis Page
 * View and analyze LLM responses, brand mentions, and citations
 */
export default async function ResultsPage() {
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

  // Fetch latest snapshots aggregates (simple MVP) - filter by region if selected
  let snapsQuery = supabase
    .from("snapshots")
    .select("id, model_id, captured_at")
    .eq("workspace_id", currentWorkspaceId || "");

  if (currentRegionId) {
    snapsQuery = snapsQuery.eq("workspace_region_id", currentRegionId);
  }

  const { data: snaps } = await snapsQuery
    .order("captured_at", { ascending: false })
    .limit(10);

  // Aggregate results across latest snapshots
  let totalResults = 0;
  let mentionSum = 0;
  let sentimentSum = 0;
  let promSum = 0;
  let countForAvg = 0;
  if (snaps && snaps.length > 0) {
    const snapIds = snaps.map((s) => s.id);
    const { data: res } = await supabase
      .from("results")
      .select("mention_present, sentiment, prominence")
      .in("snapshot_id", snapIds);
    const list = res || [];
    totalResults = list.length;
    for (const r of list) {
      if (r.mention_present) mentionSum += 1;
      if (typeof r.sentiment === "number") {
        sentimentSum += r.sentiment;
        countForAvg++;
      }
      if (typeof r.prominence === "number") promSum += r.prominence;
    }
  }
  const avgMentionRate =
    totalResults > 0 ? Math.round((mentionSum / totalResults) * 100) : 0;
  const avgSentiment =
    countForAvg > 0 ? (sentimentSum / countForAvg).toFixed(2) : "0";
  const avgProminence =
    totalResults > 0 ? (promSum / totalResults).toFixed(2) : "0";

  // Build per-snapshot aggregates for a basic list
  let snapshotRows: {
    id: string;
    model: string;
    captured_at: string;
    total: number;
    mentionRate: string;
  }[] = [];
  if (snaps && snaps.length > 0) {
    const snapIds = snaps.map((s) => s.id);
    const { data: res2 } = await supabase
      .from("results")
      .select("snapshot_id, mention_present")
      .in("snapshot_id", snapIds);
    const grouped: Record<string, { total: number; mentions: number }> = {};
    (res2 || []).forEach((r: any) => {
      const g = grouped[r.snapshot_id] || { total: 0, mentions: 0 };
      g.total += 1;
      if (r.mention_present) g.mentions += 1;
      grouped[r.snapshot_id] = g;
    });
    snapshotRows = snaps.map((s) => {
      const g = grouped[s.id] || { total: 0, mentions: 0 };
      const mr =
        g.total > 0 ? `${Math.round((g.mentions / g.total) * 100)}%` : "-";
      return {
        id: s.id,
        model: s.model_id,
        captured_at: new Date(s.captured_at as any).toLocaleString(),
        total: g.total,
        mentionRate: mr,
      };
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Results & Analysis</h1>
        <p className="mt-2 text-gray-600">
          Analyze how AI engines respond to your monitoring prompts
        </p>
      </div>

      {/* Controls + Stats Grid */}
      <div className="flex items-center justify-between">
        <RunMeasurement workspaceId={currentWorkspaceId || ""} />
        <p className="text-sm text-gray-500">Cadence: daily (auto-scheduled)</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">
              Total Results
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {totalResults.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">
              Mention Rate
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {avgMentionRate}%
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">
              Avg. Sentiment
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {avgSentiment}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">
              Avg. Prominence
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {avgProminence}
          </p>
        </div>
      </div>

      {/* Filters */}
      <ResultsFilters />

      {/* Results Grid */}
      <ResultsGrid />

      {/* Citations Explorer */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Citations Explorer
          </h2>
          <p className="text-sm text-gray-500">
            Top cited domains across recent snapshots
          </p>
        </div>
        <div className="p-4">
          {(async function CitationsTable() {
            const snapIds = (snaps || []).map((s) => s.id);
            if (snapIds.length === 0)
              return <p className="text-sm text-gray-500">No citations yet.</p>;
            const { data: resIds } = await supabase
              .from("results")
              .select("id")
              .in("snapshot_id", snapIds);
            const rids = (resIds || []).map((r: any) => r.id);
            if (rids.length === 0)
              return <p className="text-sm text-gray-500">No citations yet.</p>;
            const { data: cits } = await supabase
              .from("citations")
              .select("domain, authority_cached")
              .in("result_id", rids);
            const map: Record<
              string,
              { count: number; authSum: number; authN: number }
            > = {};
            (cits || []).forEach((c: any) => {
              const k = c.domain || "";
              if (!map[k]) map[k] = { count: 0, authSum: 0, authN: 0 };
              map[k].count += 1;
              if (typeof c.authority_cached === "number") {
                map[k].authSum += c.authority_cached;
                map[k].authN += 1;
              }
            });
            const rows = Object.entries(map)
              .map(([domain, v]) => ({
                domain,
                count: v.count,
                authority: v.authN > 0 ? v.authSum / v.authN : 0,
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 20);
            if (rows.length === 0)
              return <p className="text-sm text-gray-500">No citations yet.</p>;
            return (
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2">Domain</th>
                    <th className="py-2">Mentions</th>
                    <th className="py-2">Authority</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.domain} className="border-t border-gray-100">
                      <td className="py-2">{r.domain}</td>
                      <td className="py-2">{r.count}</td>
                      <td className="py-2">{r.authority.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>
      {/* Snapshots list */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Snapshots
          </h2>
          <p className="text-sm text-gray-500">
            Last 10 runs across selected models
          </p>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2">Captured</th>
                <th className="py-2">Model</th>
                <th className="py-2">Total Results</th>
                <th className="py-2">Mention Rate</th>
              </tr>
            </thead>
            <tbody>
              {snapshotRows.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="py-2">{row.captured_at}</td>
                  <td className="py-2 capitalize">{row.model}</td>
                  <td className="py-2">{row.total}</td>
                  <td className="py-2">{row.mentionRate}</td>
                </tr>
              ))}
              {snapshotRows.length === 0 && (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={4}>
                    No snapshots yet. Click "Run measurement" to create your
                    first run.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Model: SoV and TrustScore */}
      {(() => {
        // Aggregate by model using latest 20 snapshots
        async function byModel() {
          const { data: modelList } = await supabase
            .from("models")
            .select("id, name");
          const snapsByModel: Record<string, string[]> = {};
          (snaps || []).forEach((s) => {
            snapsByModel[s.model_id] = snapsByModel[s.model_id] || [];
            snapsByModel[s.model_id].push(s.id);
          });
          const rows: { model: string; sov: number; trust: number }[] = [];
          for (const mid of Object.keys(snapsByModel)) {
            const sid = snapsByModel[mid];
            const { data: res } = await supabase
              .from("results")
              .select(
                "mention_present, sentiment, prominence, competitor_mentions"
              )
              .in("snapshot_id", sid);
            const list = res || [];
            if (list.length === 0) continue;
            const mentionCount = list.filter(
              (r: any) => r.mention_present
            ).length;
            const compTouches = list.filter(
              (r: any) => (r.competitor_mentions || 0) > 0
            ).length;
            const denom = mentionCount + compTouches;
            const sov =
              denom > 0 ? Math.round((mentionCount / denom) * 100) : 0;
            const avgProm =
              list.reduce((s: number, r: any) => s + (r.prominence || 0), 0) /
              list.length;
            const sentVals = list
              .filter((r: any) => typeof r.sentiment === "number")
              .map((r: any) => r.sentiment);
            const avgSent =
              sentVals.length > 0
                ? sentVals.reduce((s: number, v: number) => s + v, 0) /
                  sentVals.length
                : 0;
            const sentNorm = (avgSent + 1) / 2;
            const trust = Math.round(
              100 * (0.5 * 0.5 + 0.3 * sentNorm + 0.2 * avgProm)
            ); // authority placeholder 0.5
            const name =
              (modelList || []).find((m: any) => m.id === mid)?.name || mid;
            rows.push({ model: name, sov, trust });
          }
          return rows;
        }
        return (
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">By Model</h2>
              <p className="text-sm text-gray-500">
                Share of Voice and Trust by model
              </p>
            </div>
            <div className="p-4">
              {(async function Table() {
                const rows = await byModel();
                if (rows.length === 0)
                  return <p className="text-sm text-gray-500">No data yet.</p>;
                return (
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-500">
                      <tr>
                        <th className="py-2">Model</th>
                        <th className="py-2">SoV</th>
                        <th className="py-2">Trust</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.model} className="border-t border-gray-100">
                          <td className="py-2 capitalize">{r.model}</td>
                          <td className="py-2">{r.sov}%</td>
                          <td className="py-2">{r.trust}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
