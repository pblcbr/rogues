import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server";

/**
 * GET /api/results/export
 *
 * Exports results to CSV format based on current filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get workspace
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id, current_workspace_region_id")
      .eq("id", user.id)
      .single();

    const workspaceId = profile?.current_workspace_id;
    const regionId = profile?.current_workspace_region_id;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "No workspace selected" },
        { status: 400 }
      );
    }

    // Get workspace brand name
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("brand_name")
      .eq("id", workspaceId)
      .single();

    const brandName = workspace?.brand_name || "Your Brand";

    // Parse query params (same as main page)
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("date_from") || "";
    const dateTo = searchParams.get("date_to") || "";
    const brandFilter = searchParams.get("brand_filter") || "all";
    const llmProviders = searchParams.get("llm_providers")?.split(",") || [];
    const relevancyMin = parseInt(searchParams.get("relevancy_min") || "0");
    const relevancyMax = parseInt(searchParams.get("relevancy_max") || "100");
    const ids = searchParams.get("ids")?.split(",") || [];

    // Build query
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
      `
      )
      .eq("monitoring_prompts.workspace_id", workspaceId);

    // Filter by region if selected
    if (regionId) {
      resultsQuery = resultsQuery.eq(
        "monitoring_prompts.workspace_region_id",
        regionId
      );
    }

    // If specific IDs provided (bulk export), filter by them
    if (ids.length > 0) {
      resultsQuery = resultsQuery.in("id", ids);
    } else {
      // Apply other filters only if not exporting specific IDs
      if (search) {
        resultsQuery = resultsQuery.ilike("response_text", `%${search}%`);
      }

      if (dateFrom) {
        resultsQuery = resultsQuery.gte("created_at", dateFrom);
      }

      if (dateTo) {
        resultsQuery = resultsQuery.lte("created_at", dateTo);
      }

      if (brandFilter === "mentioned") {
        resultsQuery = resultsQuery.eq("our_brand_mentioned", true);
      } else if (brandFilter === "not_mentioned") {
        resultsQuery = resultsQuery.eq("our_brand_mentioned", false);
      }

      if (llmProviders.length > 0) {
        resultsQuery = resultsQuery.in("llm_provider", llmProviders);
      }

      resultsQuery = resultsQuery
        .gte("relevancy_score", relevancyMin)
        .lte("relevancy_score", relevancyMax);
    }

    // Limit to 1000 results for export
    resultsQuery = resultsQuery
      .limit(1000)
      .order("created_at", { ascending: false });

    const { data: results, error } = await resultsQuery;

    if (error) {
      console.error("Error fetching results for export:", error);
      return NextResponse.json(
        { error: "Failed to fetch results" },
        { status: 500 }
      );
    }

    // Fetch citations for all results
    const resultIds = results?.map((r) => r.id) || [];
    let citations: any[] = [];

    if (resultIds.length > 0) {
      const { data: citationsData } = await supabase
        .from("citations")
        .select("result_id, url")
        .in("result_id", resultIds);

      citations = citationsData || [];
    }

    // Group citations by result_id
    const citationsByResult = citations.reduce(
      (acc, citation) => {
        if (!acc[citation.result_id]) {
          acc[citation.result_id] = [];
        }
        acc[citation.result_id].push(citation.url);
        return acc;
      },
      {} as Record<string, string[]>
    );

    // Generate CSV
    const csvRows: string[] = [];

    // Header row
    csvRows.push(
      [
        "Date",
        "Time",
        "Prompt",
        "Topic",
        "LLM Provider",
        "Model",
        `${brandName} Mentioned`,
        "Position",
        "Relevancy (%)",
        "Competitors",
        "Response Preview",
        "Citations Count",
        "Citation URLs",
      ]
        .map((h) => `"${h}"`)
        .join(",")
    );

    // Data rows
    results?.forEach((result) => {
      const date = new Date(result.created_at);
      const dateStr = date.toISOString().split("T")[0];
      const timeStr = date.toTimeString().split(" ")[0];

      const prompt = result.monitoring_prompts?.prompt_text || "";
      const topic = result.monitoring_prompts?.topics?.name || "";
      const llmProvider = result.llm_provider || "";
      const llmModel = result.llm_model || "";
      const mentioned = result.our_brand_mentioned ? "Yes" : "No";
      const position = result.our_brand_position?.toString() || "";
      const relevancy = result.relevancy_score?.toFixed(0) || "";

      // Get competitors
      const competitors =
        result.brand_positions
          ?.filter(
            (bp: any) => bp.brand.toLowerCase() !== brandName.toLowerCase()
          )
          .map((bp: any) => bp.brand)
          .join(", ") || "";

      const responsePreview = result.response_text
        ? result.response_text.slice(0, 200).replace(/"/g, '""')
        : "";

      const resultCitations = citationsByResult[result.id] || [];
      const citationsCount = resultCitations.length.toString();
      const citationUrls = resultCitations.join(" | ");

      csvRows.push(
        [
          dateStr,
          timeStr,
          `"${prompt.replace(/"/g, '""')}"`,
          `"${topic}"`,
          `"${llmProvider}"`,
          `"${llmModel}"`,
          mentioned,
          position,
          relevancy,
          `"${competitors}"`,
          `"${responsePreview}"`,
          citationsCount,
          `"${citationUrls}"`,
        ].join(",")
      );
    });

    const csvContent = csvRows.join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="results-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/results/export:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
