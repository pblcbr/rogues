import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { ResultsFilters } from "@/components/dashboard/results/results-filters";
import { ResultsGrid } from "@/components/dashboard/results/results-grid";
import { TrendingUp, Target, Award, BarChart3 } from "lucide-react";
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

  // Fetch workspace
  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", session.user.id)
    .single();

  // Mock results data (in production, fetch from results table)
  const stats = {
    totalResults: 1247,
    avgMentionRate: 68,
    topSource: "ChatGPT-4",
    avgPosition: 2.3,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Results & Analysis</h1>
        <p className="mt-2 text-gray-600">
          Analyze how AI engines respond to your monitoring prompts
        </p>
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
            {stats.totalResults.toLocaleString()}
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
            {stats.avgMentionRate}%
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">
              Top Source
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-gray-900">
            {stats.topSource}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">
              Avg. Position
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            #{stats.avgPosition}
          </p>
        </div>
      </div>

      {/* Filters */}
      <ResultsFilters />

      {/* Results Grid */}
      <ResultsGrid />
    </div>
  );
}
