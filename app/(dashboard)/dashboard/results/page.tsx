import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { ResultsFilters } from "@/components/dashboard/results/results-filters";
import { ResultsList } from "@/components/dashboard/results/results-list";
import { ResultsAnalytics } from "@/components/dashboard/results/results-analytics";
import type { Database } from "@/lib/supabase/types";

interface ResultsPageProps {
  searchParams: {
    search?: string;
    date_from?: string;
    date_to?: string;
    brand_filter?: string;
    llm_providers?: string;
    relevancy_min?: string;
    relevancy_max?: string;
    sort_by?: string;
    sort_order?: string;
    page?: string;
  };
}

/**
 * Results Page - Central hub for viewing and analyzing all LLM responses
 */
export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  // Get current workspace and region
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id, current_workspace_region_id")
    .eq("id", session.user.id)
    .single();

  const currentWorkspaceId = profile?.current_workspace_id;
  const currentRegionId = profile?.current_workspace_region_id;

  if (!currentWorkspaceId) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">No workspace selected</p>
      </div>
    );
  }

  // Get workspace brand name
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("brand_name")
    .eq("id", currentWorkspaceId)
    .single();

  const brandName = workspace?.brand_name || "Your Brand";

  // Parse filters from search params
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const searchTerm = searchParams.search || "";
  const dateFrom = searchParams.date_from || "";
  const dateTo = searchParams.date_to || "";
  const brandFilter = searchParams.brand_filter || "all";
  const llmProviders = searchParams.llm_providers
    ? searchParams.llm_providers.split(",")
    : [];
  const relevancyMin = searchParams.relevancy_min
    ? parseInt(searchParams.relevancy_min)
    : 0;
  const relevancyMax = searchParams.relevancy_max
    ? parseInt(searchParams.relevancy_max)
    : 100;
  const sortBy = searchParams.sort_by || "date";
  const sortOrder = searchParams.sort_order || "desc";

  // Build query for results
  let resultsQuery = supabase
    .from("results")
    .select(
      `
      *,
      monitoring_prompts!inner(
        id,
        prompt_text,
        workspace_id,
        workspace_region_id,
        topics(name)
      )
    `,
      { count: "exact" }
    )
    .eq("monitoring_prompts.workspace_id", currentWorkspaceId);

  // Filter by region if selected
  if (currentRegionId) {
    resultsQuery = resultsQuery.eq(
      "monitoring_prompts.workspace_region_id",
      currentRegionId
    );
  }

  // Apply search filter
  if (searchTerm) {
    resultsQuery = resultsQuery.ilike("response_text", `%${searchTerm}%`);
  }

  // Apply date range filter
  if (dateFrom) {
    resultsQuery = resultsQuery.gte("created_at", dateFrom);
  }
  if (dateTo) {
    resultsQuery = resultsQuery.lte("created_at", dateTo);
  }

  // Apply brand filter
  if (brandFilter === "mentioned") {
    resultsQuery = resultsQuery.eq("our_brand_mentioned", true);
  } else if (brandFilter === "not_mentioned") {
    resultsQuery = resultsQuery.eq("our_brand_mentioned", false);
  }

  // Apply LLM provider filter
  if (llmProviders.length > 0) {
    resultsQuery = resultsQuery.in("llm_provider", llmProviders);
  }

  // Apply relevancy filter
  resultsQuery = resultsQuery
    .gte("relevancy_score", relevancyMin)
    .lte("relevancy_score", relevancyMax);

  // Apply sorting
  const sortColumn =
    sortBy === "relevancy"
      ? "relevancy_score"
      : sortBy === "position"
        ? "our_brand_position"
        : "created_at";

  resultsQuery = resultsQuery.order(sortColumn, {
    ascending: sortOrder === "asc",
    nullsFirst: false,
  });

  // Apply pagination
  resultsQuery = resultsQuery.range(offset, offset + limit - 1);

  const { data: results, count, error } = await resultsQuery;

  if (error) {
    console.error("Error fetching results:", error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Results</h1>
          <p className="mt-2 text-gray-600">
            View and analyze all LLM responses across your monitoring prompts
          </p>
        </div>
        <div className="flex h-96 flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50">
          <div className="mb-4 rounded-full bg-red-100 p-4">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Error Loading Results
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            {error.message || "An error occurred while loading results"}
          </p>
          <p className="text-xs text-gray-500">
            Please contact support if this error persists
          </p>
        </div>
      </div>
    );
  }

  // Fetch citations for all results
  const resultIds = results?.map((r) => r.id) || [];
  let citations: any[] = [];

  if (resultIds.length > 0) {
    const { data: citationsData } = await supabase
      .from("citations")
      .select("result_id, url, title, domain, favicon_url, position")
      .in("result_id", resultIds)
      .order("position", { ascending: true });

    citations = citationsData || [];
  }

  // Group citations by result_id
  const citationsByResult = citations.reduce(
    (acc, citation) => {
      if (!acc[citation.result_id]) {
        acc[citation.result_id] = [];
      }
      acc[citation.result_id].push(citation);
      return acc;
    },
    {} as Record<string, any[]>
  );

  // Enrich results with citations and prompt data
  const enrichedResults =
    results?.map((result) => ({
      id: result.id,
      response_text: result.response_text,
      brands_mentioned: result.brands_mentioned,
      brand_positions: result.brand_positions,
      our_brand_mentioned: result.our_brand_mentioned,
      our_brand_position: result.our_brand_position,
      relevancy_score: result.relevancy_score,
      created_at: result.created_at,
      llm_provider: result.llm_provider,
      llm_model: result.llm_model,
      prompt: {
        id: result.monitoring_prompts?.id,
        text: result.monitoring_prompts?.prompt_text,
        topic: result.monitoring_prompts?.topics?.name,
      },
      citations: citationsByResult[result.id] || [],
    })) || [];

  const totalPages = count ? Math.ceil(count / limit) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Results</h1>
        <p className="mt-2 text-gray-600">
          View and analyze all LLM responses across your monitoring prompts
        </p>
      </div>

      {/* Analytics Summary */}
      <ResultsAnalytics
        workspaceId={currentWorkspaceId}
        regionId={currentRegionId}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />

      {/* Filters & Search */}
      <ResultsFilters
        currentFilters={{
          search: searchTerm,
          dateFrom,
          dateTo,
          brandFilter,
          llmProviders,
          relevancyMin,
          relevancyMax,
          sortBy,
          sortOrder,
        }}
      />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {count !== null && count !== undefined ? (
            <>
              Showing {offset + 1} - {Math.min(offset + limit, count)} of{" "}
              {count} results
            </>
          ) : (
            "Loading results..."
          )}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
          </div>
        )}
      </div>

      {/* Results List */}
      <ResultsList
        results={enrichedResults}
        brandName={brandName}
        currentPage={page}
        totalPages={totalPages}
        totalCount={count || 0}
      />
    </div>
  );
}
