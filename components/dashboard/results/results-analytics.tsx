import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import {
  BarChart3,
  TrendingUp,
  Target,
  Link2,
  FileText,
  Award,
} from "lucide-react";
import type { Database } from "@/lib/supabase/types";

interface ResultsAnalyticsProps {
  workspaceId: string;
  regionId?: string | null;
  dateFrom?: string;
  dateTo?: string;
}

export async function ResultsAnalytics({
  workspaceId,
  regionId,
  dateFrom,
  dateTo,
}: ResultsAnalyticsProps) {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Build base query
  let queryBuilder = supabase
    .from("results")
    .select(
      `
      id,
      our_brand_mentioned,
      our_brand_position,
      relevancy_score,
      created_at,
      monitoring_prompts!inner(workspace_id, workspace_region_id)
    `
    )
    .eq("monitoring_prompts.workspace_id", workspaceId);

  if (regionId) {
    queryBuilder = queryBuilder.eq(
      "monitoring_prompts.workspace_region_id",
      regionId
    );
  }

  if (dateFrom) {
    queryBuilder = queryBuilder.gte("created_at", dateFrom);
  }

  if (dateTo) {
    queryBuilder = queryBuilder.lte("created_at", dateTo);
  }

  const { data: results, error: resultsError } = await queryBuilder;

  // Handle errors gracefully - return empty state
  if (resultsError) {
    console.error("Error fetching results for analytics:", resultsError);
    return (
      <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
        {/* Show empty state cards */}
        {[
          { icon: FileText, label: "Results", color: "text-blue-600" },
          { icon: Target, label: "Mention Rate", color: "text-green-600" },
          { icon: Award, label: "Avg Position", color: "text-purple-600" },
          {
            icon: TrendingUp,
            label: "Avg Relevancy",
            color: "text-orange-600",
          },
          { icon: Link2, label: "Citations", color: "text-cyan-600" },
          { icon: BarChart3, label: "Prompts", color: "text-indigo-600" },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className={`h-5 w-5 ${card.color}`} />
                <span className="text-sm font-medium text-gray-600">
                  {card.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-400">—</p>
            </div>
          );
        })}
      </div>
    );
  }

  // Fetch citations count
  const resultIds = results?.map((r) => r.id) || [];
  let citationsCount = 0;

  if (resultIds.length > 0) {
    const { count } = await supabase
      .from("citations")
      .select("id", { count: "exact", head: true })
      .in("result_id", resultIds);

    citationsCount = count || 0;
  }

  // Fetch unique prompts count
  let uniquePromptsQuery = supabase
    .from("monitoring_prompts")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (regionId) {
    uniquePromptsQuery = uniquePromptsQuery.eq("workspace_region_id", regionId);
  }

  const { count: uniquePrompts } = await uniquePromptsQuery;

  // Calculate metrics
  const totalResults = results?.length || 0;
  const brandMentions =
    results?.filter((r) => r.our_brand_mentioned).length || 0;
  const brandMentionRate =
    totalResults > 0 ? (brandMentions / totalResults) * 100 : 0;

  const positionsArray = results
    ?.filter((r) => r.our_brand_mentioned && r.our_brand_position !== null)
    .map((r) => r.our_brand_position) as number[];

  const avgPosition =
    positionsArray && positionsArray.length > 0
      ? positionsArray.reduce((a, b) => a + b, 0) / positionsArray.length
      : null;

  const relevancyScores = results
    ?.filter((r) => r.relevancy_score !== null)
    .map((r) => r.relevancy_score) as number[];

  const avgRelevancy =
    relevancyScores && relevancyScores.length > 0
      ? relevancyScores.reduce((a, b) => a + b, 0) / relevancyScores.length
      : null;

  const citationRate =
    totalResults > 0 ? (citationsCount / totalResults) * 100 : 0;

  return (
    <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
      {/* Total Results */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-600">Results</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{totalResults}</p>
      </div>

      {/* Brand Mention Rate */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-gray-600">
            Mention Rate
          </span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {brandMentionRate.toFixed(0)}%
        </p>
        <p className="mt-1 text-xs text-gray-500">{brandMentions} mentions</p>
      </div>

      {/* Avg Position */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-medium text-gray-600">
            Avg Position
          </span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {avgPosition !== null ? `#${avgPosition.toFixed(1)}` : "—"}
        </p>
      </div>

      {/* Avg Relevancy */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium text-gray-600">
            Avg Relevancy
          </span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {avgRelevancy !== null ? `${avgRelevancy.toFixed(0)}%` : "—"}
        </p>
      </div>

      {/* Citation Rate */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-cyan-600" />
          <span className="text-sm font-medium text-gray-600">Citations</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{citationsCount}</p>
        <p className="mt-1 text-xs text-gray-500">
          {citationRate.toFixed(0)}% rate
        </p>
      </div>

      {/* Unique Prompts */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <span className="text-sm font-medium text-gray-600">Prompts</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{uniquePrompts || 0}</p>
      </div>
    </div>
  );
}
