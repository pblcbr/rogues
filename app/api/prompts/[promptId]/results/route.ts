import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/prompts/[promptId]/results
 *
 * Fetches detailed results for a specific prompt, including:
 * - Response text
 * - Brand mentions and positions
 * - Citations with metadata
 * - Relevancy scores
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { promptId: string } }
) {
  try {
    const supabase = createClient();
    const { promptId } = params;

    // Get date filters from query params
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("from"); // YYYY-MM-DD
    const dateTo = searchParams.get("to"); // YYYY-MM-DD

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify prompt exists and user has access
    const { data: prompt, error: promptError } = await supabase
      .from("monitoring_prompts")
      .select(
        `
        id,
        workspace_id,
        workspaces!inner (
          id,
          workspace_members!inner (
            user_id
          )
        )
      `
      )
      .eq("id", promptId)
      .eq("workspaces.workspace_members.user_id", user.id)
      .single();

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: "Prompt not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch results with snapshots (for timestamp)
    // Note: results table doesn't have created_at, so we join with snapshots
    const { data: results, error: resultsError } = await supabase
      .from("results")
      .select(
        `
        id,
        prompt_text,
        response_text,
        brands_mentioned,
        brand_positions,
        our_brand_mentioned,
        our_brand_position,
        relevancy_score,
        llm_provider,
        llm_model,
        mention_present,
        prominence,
        alignment,
        sentiment,
        snapshot_id,
        snapshots!inner(
          id,
          captured_at
        )
      `
      )
      .eq("prompt_id", promptId)
      .limit(50);

    if (resultsError) {
      console.error("Error fetching results:", resultsError);
      console.error("Error details:", JSON.stringify(resultsError, null, 2));

      // If it's a column doesn't exist error, return helpful message
      if (
        resultsError.message?.includes("column") ||
        resultsError.code === "42703"
      ) {
        return NextResponse.json(
          {
            error: "Database schema outdated",
            message:
              "Please ensure migration 014 has been applied. Some required columns are missing.",
            results: [],
          },
          { status: 200 } // Return 200 with empty results instead of 500
        );
      }

      // For other errors, return empty results instead of failing
      console.warn("Returning empty results due to error");
      return NextResponse.json({
        results: [],
        warning: "Could not fetch results data",
      });
    }

    // If no results found, return empty array (not an error)
    if (!results || results.length === 0) {
      return NextResponse.json({
        results: [],
      });
    }

    // Fetch citations for all results
    const resultIds = results?.map((r) => r.id) || [];
    let citations: any[] = [];

    if (resultIds.length > 0) {
      const { data: citationsData, error: citationsError } = await supabase
        .from("citations")
        .select("result_id, url, title, domain, favicon_url, position")
        .in("result_id", resultIds)
        .order("position", { ascending: true });

      if (citationsError) {
        console.error("Error fetching citations:", citationsError);
      } else {
        citations = citationsData || [];
      }
    }

    // Group citations by result_id
    const citationsByResult = citations.reduce(
      (acc, citation) => {
        if (!acc[citation.result_id]) {
          acc[citation.result_id] = [];
        }
        acc[citation.result_id].push({
          url: citation.url,
          title: citation.title,
          domain: citation.domain,
          favicon_url: citation.favicon_url,
          position: citation.position,
        });
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Combine results with their citations
    const mappedResults =
      results?.map((result: any) => ({
        id: result.id,
        response_text: result.response_text,
        brands_mentioned: result.brands_mentioned,
        brand_positions: result.brand_positions,
        our_brand_mentioned: result.our_brand_mentioned,
        our_brand_position: result.our_brand_position,
        relevancy_score: result.relevancy_score,
        created_at: result.snapshots?.captured_at || null,
        llm_provider: result.llm_provider,
        llm_model: result.llm_model,
        citations: citationsByResult[result.id] || [],
      })) || [];

    // Group by date and keep only the most recent result per day
    const resultsByDate = new Map<string, any>();

    for (const result of mappedResults) {
      if (!result.created_at) continue;

      // Extract date (YYYY-MM-DD)
      const date = new Date(result.created_at).toISOString().split("T")[0];

      // Apply date filters if provided
      if (dateFrom && date < dateFrom) continue;
      if (dateTo && date > dateTo) continue;

      // Keep only the most recent result for each date
      const existing = resultsByDate.get(date);
      if (
        !existing ||
        new Date(result.created_at) > new Date(existing.created_at)
      ) {
        resultsByDate.set(date, result);
      }
    }

    // Convert back to array and sort by date (most recent first)
    const enrichedResults = Array.from(resultsByDate.values()).sort((a, b) => {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return NextResponse.json({
      results: enrichedResults,
    });
  } catch (error) {
    console.error("Error in GET /api/prompts/[promptId]/results:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
