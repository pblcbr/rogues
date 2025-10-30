/**
 * POST /api/measure/daily
 * Calculate and store daily KPIs for all active prompts
 * This endpoint should be called daily via a cron job or scheduler
 * Body: { workspaceId?: string } - optional, if not provided processes all workspaces
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getKPICalculator } from "@/lib/openai/kpi-calculator";

export async function POST(request: NextRequest) {
  console.log(
    "[Daily KPI] ========== Daily KPI calculation started =========="
  );

  try {
    const supabase = createClient();

    // Authenticate (or allow service account for cron)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("[Daily KPI] User authenticated:", user?.id || "none");

    // Allow unauthenticated requests for cron jobs (check secret token)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "";
    const isCronRequest = authHeader === `Bearer ${cronSecret}`;

    console.log("[Daily KPI] Is cron request:", isCronRequest);
    console.log("[Daily KPI] Has user:", !!user);

    if (!user && !isCronRequest) {
      console.error(
        "[Daily KPI] Unauthorized - no user and no valid cron secret"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[Daily KPI] Request body:", body);

    const { workspaceId, force } = body;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Process specific workspace or all workspaces
    let workspaceQuery = supabase
      .from("workspaces")
      .select("id, brand_name, brand_website, region, language");

    if (workspaceId) {
      workspaceQuery = workspaceQuery.eq("id", workspaceId);
    }

    const { data: workspaces, error: wsError } = await workspaceQuery;

    if (wsError || !workspaces || workspaces.length === 0) {
      return NextResponse.json(
        { error: "No workspaces found", details: wsError?.message },
        { status: 404 }
      );
    }

    const results = {
      processed: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        workspaceId: string;
        promptId: string;
        status: string;
        error?: string;
      }>,
    };

    // Process each workspace
    for (const workspace of workspaces) {
      console.log(`[Daily KPI] Processing workspace: ${workspace.id}`);

      try {
        // Get active prompts for this workspace
        const { data: prompts, error: promptsError } = await supabase
          .from("monitoring_prompts")
          .select("id, prompt_text, workspace_region_id")
          .eq("workspace_id", workspace.id)
          .eq("is_active", true);

        console.log(
          `[Daily KPI] Active prompts found: ${prompts?.length || 0}`
        );

        if (promptsError) {
          console.error(`[Daily KPI] Error fetching prompts:`, promptsError);
        }

        if (promptsError || !prompts || prompts.length === 0) {
          console.log(
            `[Daily KPI] No active prompts for workspace ${workspace.id}, skipping`
          );
          continue; // No active prompts, skip
        }

        // Get workspace region info for context
        let region = workspace.region || "United States";
        let language = workspace.language || "English";

        // Try to get region from workspace_regions if available
        if (prompts[0]?.workspace_region_id) {
          const { data: regionData } = await supabase
            .from("workspace_regions")
            .select("region, language")
            .eq("id", prompts[0].workspace_region_id)
            .single();

          if (regionData) {
            region = regionData.region || region;
            language = regionData.language || language;
          }
        }

        // Get brand context
        const brandContext = {
          name: workspace.brand_name || undefined,
          website: workspace.brand_website || undefined,
          description: undefined, // Could be fetched from profile if needed
        };

        // Get brand description from workspace or profile if needed
        // For now, we'll skip it as it's not in workspace table

        // Initialize KPI calculator (default to OpenAI)
        const calculator = getKPICalculator("openai");

        // Process each prompt
        for (const prompt of prompts) {
          console.log(
            `[Daily KPI] Processing prompt: ${prompt.id.substring(0, 8)}...`
          );

          try {
            // Check if snapshot already exists for today (unless forcing)
            if (!force) {
              const { data: existing } = await supabase
                .from("prompt_kpi_snapshots")
                .select("id")
                .eq("prompt_id", prompt.id)
                .eq("snapshot_date", today)
                .single();

              if (existing) {
                console.log(
                  `[Daily KPI] Snapshot already exists for prompt ${prompt.id.substring(0, 8)}..., skipping`
                );
                results.skipped++;
                results.details.push({
                  workspaceId: workspace.id,
                  promptId: prompt.id,
                  status: "skipped",
                });
                continue;
              }
            }

            console.log(
              `[Daily KPI] Calculating KPIs for prompt ${prompt.id.substring(0, 8)}...`
            );

            // Calculate KPIs
            const kpiResult = await calculator.calculateKPIs(
              prompt.prompt_text,
              brandContext,
              {
                numSamples: 3, // Query 3 times for average
                region,
                language,
              }
            );

            console.log(
              `[Daily KPI] KPI calculation complete. Samples: ${kpiResult.metrics.length}`
            );

            // Aggregate metrics
            const metrics = kpiResult.metrics;
            const total = metrics.length;
            const mentionCount = metrics.filter((m) => m.mentionPresent).length;

            console.log(
              `[Daily KPI] Aggregated: mentions=${mentionCount}/${total}, citations=${metrics.reduce((sum, m) => sum + m.citationsCount, 0)}`
            );
            const mentionRate =
              total > 0 ? Math.round((mentionCount / total) * 100) : 0;

            const citationCount = metrics.reduce(
              (sum, m) => sum + m.citationsCount,
              0
            );
            const citationRate =
              total > 0
                ? Math.round(
                    (metrics.filter((m) => m.citationsCount > 0).length /
                      total) *
                      100
                  )
                : 0;

            const avgSentiment =
              total > 0
                ? metrics.reduce((sum, m) => sum + (m.sentiment || 0), 0) /
                  total
                : 0;

            const avgProminence =
              total > 0
                ? metrics.reduce((sum, m) => sum + (m.prominence || 0), 0) /
                  total
                : 0;

            const avgAlignment =
              total > 0
                ? metrics.reduce((sum, m) => sum + (m.alignment || 0), 0) /
                  total
                : 0;

            // Calculate citation authority (placeholder for now)
            const avgCitationAuthority = 0.5; // TODO: Calculate from actual citation domains

            // Calculate composite visibility score
            const visibilityScore = Math.round(
              100 *
                (0.4 * (mentionRate / 100) +
                  0.25 * (1 - avgProminence) + // Invert prominence (lower = better)
                  0.2 * avgCitationAuthority +
                  0.15 * avgAlignment)
            );

            console.log(
              `[Daily KPI] Inserting snapshot for prompt ${prompt.id.substring(0, 8)}...`
            );

            // Insert snapshot
            const { error: insertError } = await supabase
              .from("prompt_kpi_snapshots")
              .insert({
                prompt_id: prompt.id,
                workspace_id: workspace.id,
                snapshot_date: today,
                visibility_score: visibilityScore,
                mention_rate: mentionRate,
                citation_rate: citationRate,
                avg_position: avgProminence,
                total_measurements: total,
                mention_count: mentionCount,
                citation_count: citationCount,
                avg_sentiment: avgSentiment,
                avg_prominence: avgProminence,
                avg_alignment: avgAlignment,
                avg_citation_authority: avgCitationAuthority,
                llm_provider: kpiResult.llmProvider,
                llm_model: kpiResult.llmModel,
                calculated_at: new Date().toISOString(),
              });

            if (insertError) {
              console.error(
                `[Daily KPI] Insert error for prompt ${prompt.id}:`,
                insertError
              );
              throw insertError;
            }

            console.log(
              `[Daily KPI] ✓ Successfully saved snapshot for prompt ${prompt.id.substring(0, 8)}...`
            );

            results.processed++;
            results.details.push({
              workspaceId: workspace.id,
              promptId: prompt.id,
              status: "success",
            });
          } catch (error) {
            results.errors++;
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            console.error(
              `[Daily KPI] ✗ Error processing prompt ${prompt.id}:`,
              errorMessage
            );
            results.details.push({
              workspaceId: workspace.id,
              promptId: prompt.id,
              status: "error",
              error: errorMessage,
            });
          }
        }
      } catch (error) {
        console.error(
          `[Daily KPI] Error processing workspace ${workspace.id}:`,
          error
        );
        results.errors++;
      }
    }

    const response = {
      success: true,
      date: today,
      summary: {
        workspacesProcessed: workspaces.length,
        promptsProcessed: results.processed,
        promptsSkipped: results.skipped,
        errors: results.errors,
      },
      details: results.details,
    };

    console.log(
      "[Daily KPI] ========== Daily KPI calculation completed =========="
    );
    console.log("[Daily KPI] Summary:", response.summary);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Daily KPI] ========== FATAL ERROR ==========");
    console.error("[Daily KPI] Error:", error);
    console.error(
      "[Daily KPI] Stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    return NextResponse.json(
      {
        error: "Failed to calculate daily KPIs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
