import { NextRequest } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getKPICalculator as getOpenAICalculator } from "@/lib/openai/kpi-calculator";
import { PerplexityKPICalculator } from "@/lib/perplexity/kpi-calculator";
import { AnthropicKPICalculator } from "@/lib/anthropic/kpi-calculator";
import type { Database } from "@/lib/supabase/types";
import type { BaseKPICalculator } from "@/lib/llm/kpi-calculator";

/**
 * Get the appropriate KPI calculator for the given LLM provider
 */
function getKPICalculator(llmProviderId: string): BaseKPICalculator {
  switch (llmProviderId) {
    case "openai":
      return getOpenAICalculator("openai");
    case "perplexity":
      return new PerplexityKPICalculator();
    case "claude":
      return new AnthropicKPICalculator();
    default:
      throw new Error(`Unsupported LLM provider: ${llmProviderId}`);
  }
}

/**
 * Get the LLM model name for database storage
 */
function getLLMModel(llmProviderId: string): string {
  switch (llmProviderId) {
    case "openai":
      return "gpt-4o";
    case "perplexity":
      return "sonar-medium-online";
    case "claude":
      return "claude-sonnet-4-20250514";
    case "gemini":
      return "gemini-pro";
    default:
      return "unknown";
  }
}

/**
 * Get the legacy model ID for the snapshots table
 */
function getLegacyModelId(llmProviderId: string): string {
  switch (llmProviderId) {
    case "openai":
      return "chatgpt";
    case "perplexity":
      return "perplexity";
    case "claude":
      return "claude";
    default:
      return "chatgpt"; // Fallback
  }
}

/**
 * POST /api/measure/daily-stream
 * Streams real-time progress of daily KPI calculations using Server-Sent Events (SSE)
 * Each prompt calculation sends a progress update to the client
 */
export async function POST(request: NextRequest) {
  console.log("[Daily KPI Stream] Stream started");

  const supabase = createServerComponentClient<Database>({ cookies });

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.error("[Daily KPI Stream] Unauthorized - no session");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { workspaceId?: string; regionId?: string; force?: boolean } = {};
  try {
    body = await request.json();
  } catch (e) {
    console.error("[Daily KPI Stream] Error parsing body:", e);
  }

  const { workspaceId, regionId, force = false } = body;
  console.log("[Daily KPI Stream] Params:", { workspaceId, regionId, force });

  if (!workspaceId) {
    return new Response(JSON.stringify({ error: "workspaceId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify user has access to this workspace
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id, current_workspace_region_id")
    .eq("id", session.user.id)
    .single();

  if (profile?.current_workspace_id !== workspaceId) {
    console.error("[Daily KPI Stream] Unauthorized - workspace mismatch");
    return new Response(JSON.stringify({ error: "Unauthorized workspace" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        // Fetch workspace details including active LLMs
        const { data: workspace } = await supabase
          .from("workspaces")
          .select(
            "brand_name, brand_website, region, language, active_llms, plan"
          )
          .eq("id", workspaceId)
          .single();

        if (!workspace) {
          sendEvent({
            type: "error",
            error: "Workspace not found",
          });
          controller.close();
          return;
        }

        // Get active LLMs (default to OpenAI if not set)
        const activeLLMs = workspace.active_llms || ["openai"];
        console.log("[Daily KPI Stream] Workspace:", workspace);
        console.log("[Daily KPI Stream] Active LLMs:", activeLLMs);

        // Fetch active prompts (filtered by region if specified)
        let promptsQuery = supabase
          .from("monitoring_prompts")
          .select("id, prompt_text, topic_id, workspace_region_id")
          .eq("workspace_id", workspaceId)
          .eq("is_active", true);

        // Filter by region if provided
        if (regionId) {
          promptsQuery = promptsQuery.eq("workspace_region_id", regionId);
          console.log("[Daily KPI Stream] Filtering by region:", regionId);
        }

        const { data: prompts } = await promptsQuery;

        if (!prompts || prompts.length === 0) {
          sendEvent({
            type: "complete",
            summary: {
              total: 0,
              processed: 0,
              skipped: 0,
              errors: 0,
            },
          });
          controller.close();
          return;
        }

        const totalTasks = prompts.length * activeLLMs.length;
        console.log(
          `[Daily KPI Stream] Found ${prompts.length} active prompts x ${activeLLMs.length} LLMs = ${totalTasks} total tasks`
        );
        sendEvent({
          type: "start",
          total: totalTasks,
          promptCount: prompts.length,
          llmCount: activeLLMs.length,
        });

        const today = new Date().toISOString().split("T")[0];
        let processed = 0;
        let skipped = 0;
        let errors = 0;

        // Process each prompt with each active LLM
        for (const prompt of prompts) {
          try {
            console.log(
              `[Daily KPI Stream] Processing prompt ${prompt.id}: "${prompt.prompt_text}"`
            );

            // Fetch topic to get competitors list (once per prompt)
            let topicCompetitors: string[] = [];
            if (prompt.topic_id) {
              const { data: topic } = await supabase
                .from("topics")
                .select("competitors")
                .eq("id", prompt.topic_id)
                .single();

              if (topic && topic.competitors) {
                topicCompetitors = topic.competitors as string[];
                console.log(
                  `[Daily KPI Stream] Found ${topicCompetitors.length} competitors for topic:`,
                  topicCompetitors
                );
              }
            }

            // Fetch region details for this prompt (once per prompt)
            const { data: promptRegion } = await supabase
              .from("workspace_regions")
              .select("region, language")
              .eq("id", prompt.workspace_region_id)
              .single();

            const regionToUse =
              promptRegion?.region || workspace.region || "US";
            const languageToUse =
              promptRegion?.language || workspace.language || "English";

            // Process this prompt with each active LLM
            for (const llmId of activeLLMs) {
              try {
                console.log(
                  `[Daily KPI Stream] Calculating KPIs for prompt ${prompt.id} with ${llmId} (region: ${regionToUse}, language: ${languageToUse})`
                );

                sendEvent({
                  type: "progress",
                  promptId: prompt.id,
                  promptText: prompt.prompt_text,
                  llmProvider: llmId,
                  current: processed + skipped + errors + 1,
                  total: totalTasks,
                });

                // Check if already calculated today for this LLM (unless force=true)
                if (!force) {
                  const { data: existing } = await supabase
                    .from("prompt_kpi_snapshots")
                    .select("id")
                    .eq("prompt_id", prompt.id)
                    .eq("snapshot_date", today)
                    .eq("llm_provider", llmId)
                    .single();

                  if (existing) {
                    console.log(
                      `[Daily KPI Stream] Snapshot already exists for prompt ${prompt.id} on ${today} with ${llmId}, skipping`
                    );
                    skipped++;
                    sendEvent({
                      type: "skipped",
                      promptId: prompt.id,
                      promptText: prompt.prompt_text,
                      llmProvider: llmId,
                      reason: `Already calculated today with ${llmId}`,
                    });
                    continue;
                  }
                }

                // Get KPI calculator for this LLM
                const calculator = getKPICalculator(llmId);

                // Debug: Log brand context
                console.log(
                  `[Daily KPI Stream] Brand context:`,
                  JSON.stringify({
                    brandName: workspace.brand_name || "",
                    brandWebsite: workspace.brand_website || "",
                    competitors: topicCompetitors,
                    competitorsCount: topicCompetitors.length,
                  })
                );

                // Calculate KPIs with enhanced brand context
                const kpiResult = await calculator.calculateKPIs(
                  prompt.prompt_text,
                  {
                    name: workspace.brand_name || "",
                    website: workspace.brand_website || "",
                    competitors: topicCompetitors,
                  },
                  {
                    numSamples: 3,
                    region: regionToUse,
                    language: languageToUse,
                  }
                );

                const kpiResults = kpiResult.metrics;

                console.log(
                  `[Daily KPI Stream] Got ${kpiResults.length} KPI samples for prompt ${prompt.id}`
                );

                // Aggregate metrics (using BOTH legacy and new fields)
                const totalMeasurements = kpiResults.length;

                // Legacy metrics
                const mentionCount = kpiResults.filter(
                  (r) => r.mentionPresent || r.ourBrandMentioned
                ).length;
                const citationCount = kpiResults.filter(
                  (r) => r.citationsCount > 0
                ).length;

                const avgSentiment =
                  totalMeasurements > 0
                    ? kpiResults.reduce((s, r) => s + r.sentiment, 0) /
                      totalMeasurements
                    : 0;
                const avgProminence =
                  totalMeasurements > 0
                    ? kpiResults.reduce((s, r) => s + r.prominence, 0) /
                      totalMeasurements
                    : 0;
                const avgAlignment =
                  totalMeasurements > 0
                    ? kpiResults.reduce((s, r) => s + r.alignment, 0) /
                      totalMeasurements
                    : 0;
                const avgCitationAuthority = 0; // Legacy field

                const mentionRate =
                  totalMeasurements > 0 ? mentionCount / totalMeasurements : 0;
                const citationRate =
                  totalMeasurements > 0 ? citationCount / totalMeasurements : 0;

                // NEW: Calculate average brand position (from brand analysis)
                const brandPositions = kpiResults
                  .map((r) => r.ourBrandPosition)
                  .filter((p): p is number => p !== null && p !== undefined);

                const avgBrandPosition =
                  brandPositions.length > 0
                    ? brandPositions.reduce((sum, pos) => sum + pos, 0) /
                      brandPositions.length
                    : null;

                // Calculate visibility score (0-100)
                const visibilityScore =
                  0.4 * mentionRate +
                  0.25 * avgProminence +
                  0.2 * citationRate +
                  0.15 * avgAlignment;

                const avgPosition = avgBrandPosition || avgProminence;

                console.log(
                  `[Daily KPI Stream] Aggregated metrics for prompt ${prompt.id}:`,
                  {
                    visibilityScore: Math.round(100 * visibilityScore),
                    mentionRate: Math.round(100 * mentionRate),
                    citationRate: Math.round(100 * citationRate),
                    avgPosition: avgPosition ? avgPosition.toFixed(2) : "N/A",
                    brandPositions: brandPositions.length,
                  }
                );

                // STEP 1: Create a snapshot record in the `snapshots` table
                // This is needed because results.snapshot_id references snapshots(id)
                let snapshotId: string;

                // Get model reference for this LLM
                const modelId = getLegacyModelId(llmId);
                const { data: model } = await supabase
                  .from("models")
                  .select("id")
                  .eq("id", modelId)
                  .single();

                if (!model) {
                  console.error(
                    `[Daily KPI Stream] Model ${modelId} not found, skipping prompt ${prompt.id} with ${llmId}`
                  );
                  errors++;
                  sendEvent({
                    type: "error",
                    promptId: prompt.id,
                    promptText: prompt.prompt_text,
                    llmProvider: llmId,
                    error: "LLM model not configured in database",
                  });
                  continue;
                }

                if (force) {
                  // Delete existing data for today if force=true
                  console.log(
                    `[Daily KPI Stream] Force mode: Deleting existing data for prompt ${prompt.id} on ${today} with ${llmId}`
                  );

                  // Find existing prompt_kpi_snapshot for today with this LLM
                  const { data: existingKpiSnapshot } = await supabase
                    .from("prompt_kpi_snapshots")
                    .select("id")
                    .eq("prompt_id", prompt.id)
                    .eq("snapshot_date", today)
                    .eq("llm_provider", llmId)
                    .single();

                  if (existingKpiSnapshot) {
                    // Delete prompt_kpi_snapshot (will cascade delete related data)
                    await supabase
                      .from("prompt_kpi_snapshots")
                      .delete()
                      .eq("id", existingKpiSnapshot.id);
                  }
                }

                // Create a snapshot in the `snapshots` table (required for results FK)
                const { data: createdSnapshot, error: snapshotError } =
                  await supabase
                    .from("snapshots")
                    .insert({
                      workspace_id: workspaceId,
                      model_id: modelId,
                      captured_at: new Date().toISOString(),
                      notes: `KPI calculation for prompt ${prompt.id} with ${llmId}`,
                    })
                    .select("id")
                    .single();

                if (snapshotError || !createdSnapshot) {
                  console.error(
                    `[Daily KPI Stream] Error creating snapshot:`,
                    snapshotError
                  );
                  errors++;
                  sendEvent({
                    type: "error",
                    promptId: prompt.id,
                    promptText: prompt.prompt_text,
                    llmProvider: llmId,
                    error: "Failed to create snapshot",
                  });
                  continue;
                }

                snapshotId = createdSnapshot.id;
                console.log(
                  `[Daily KPI Stream] Created snapshot ${snapshotId} in snapshots table for ${llmId}`
                );

                // STEP 2: Create KPI snapshot for aggregated metrics
                const { data: insertedKpiSnapshot, error: kpiSnapshotError } =
                  await supabase
                    .from("prompt_kpi_snapshots")
                    .insert({
                      prompt_id: prompt.id,
                      workspace_id: workspaceId,
                      snapshot_date: today,
                      visibility_score: Math.round(100 * visibilityScore),
                      mention_rate: Math.round(100 * mentionRate),
                      citation_rate: Math.round(100 * citationRate),
                      avg_position: avgPosition
                        ? parseFloat(avgPosition.toFixed(2))
                        : null,
                      total_measurements: totalMeasurements,
                      mention_count: mentionCount,
                      citation_count: citationCount,
                      avg_sentiment: parseFloat(avgSentiment.toFixed(2)),
                      avg_prominence: parseFloat(avgProminence.toFixed(2)),
                      avg_alignment: parseFloat(avgAlignment.toFixed(2)),
                      avg_citation_authority: parseFloat(
                        avgCitationAuthority.toFixed(2)
                      ),
                      llm_provider: llmId,
                      llm_model: getLLMModel(llmId),
                    })
                    .select("id")
                    .single();

                if (kpiSnapshotError || !insertedKpiSnapshot) {
                  console.error(
                    `[Daily KPI Stream] Error inserting KPI snapshot for prompt ${prompt.id} with ${llmId}:`,
                    kpiSnapshotError
                  );
                  errors++;
                  sendEvent({
                    type: "error",
                    promptId: prompt.id,
                    promptText: prompt.prompt_text,
                    llmProvider: llmId,
                    error:
                      kpiSnapshotError?.message ||
                      "Failed to create KPI snapshot",
                  });
                  continue; // Skip this LLM
                }

                console.log(
                  `[Daily KPI Stream] Created KPI snapshot ${insertedKpiSnapshot.id} for prompt ${prompt.id} with ${llmId}`
                );

                // STEP 3: Save individual results to `results` table with snapshot_id (from snapshots table)
                console.log(
                  `[Daily KPI Stream] Saving ${kpiResults.length} individual results for prompt ${prompt.id}`
                );

                for (const result of kpiResults) {
                  try {
                    // Debug: Log brand analysis data
                    console.log(
                      `[Daily KPI Stream] Brand analysis:`,
                      JSON.stringify({
                        hasBrandAnalysis: !!result.brandAnalysis,
                        brandsDetectedCount:
                          result.brandAnalysis?.brandsDetected?.length || 0,
                        brandNames: result.brandAnalysis?.brandsDetected?.map(
                          (b: any) => b.brandName
                        ),
                        responsePreview: result.responseText?.substring(0, 150),
                      })
                    );

                    // Extract brand names as simple array
                    const brandNames = result.brandAnalysis?.brandsDetected
                      ? result.brandAnalysis.brandsDetected.map(
                          (b: any) => b.brandName
                        )
                      : [];

                    // Extract brand positions as object {brandName: position}
                    const brandPositions: Record<string, number[]> = {};
                    if (result.brandAnalysis?.brandsDetected) {
                      for (const brand of result.brandAnalysis.brandsDetected) {
                        if (!brandPositions[brand.brandName]) {
                          brandPositions[brand.brandName] = [];
                        }
                        brandPositions[brand.brandName].push(brand.position);
                      }
                    }

                    console.log(
                      `[Daily KPI Stream] Will save:`,
                      JSON.stringify({
                        brandNames,
                        brandPositionsCount: Object.keys(brandPositions).length,
                      })
                    );

                    // Insert result into results table with snapshot_id
                    const { data: insertedResult, error: resultError } =
                      await supabase
                        .from("results")
                        .insert({
                          prompt_id: prompt.id,
                          snapshot_id: snapshotId, // Link to the snapshot we just created
                          prompt_text: prompt.prompt_text, // Add the prompt text (required field)
                          response_text: result.responseText || null,
                          brands_mentioned:
                            brandNames.length > 0
                              ? JSON.stringify(brandNames)
                              : null,
                          brand_positions:
                            Object.keys(brandPositions).length > 0
                              ? JSON.stringify(
                                  Object.entries(brandPositions).map(
                                    ([brand, positions]) => ({
                                      brand,
                                      positions,
                                    })
                                  )
                                )
                              : null,
                          our_brand_mentioned:
                            result.ourBrandMentioned || false,
                          our_brand_position: result.ourBrandPosition || null,
                          relevancy_score: result.relevancyScore || null,
                          mention_present: result.mentionPresent || false,
                          prominence: result.prominence || 0,
                          alignment: result.alignment || 0,
                          sentiment: result.sentiment || 0,
                          llm_provider: llmId,
                          llm_model: getLLMModel(llmId),
                        })
                        .select("id")
                        .single();

                    if (resultError) {
                      console.error(
                        `[Daily KPI Stream] Error inserting result:`,
                        resultError
                      );
                      continue;
                    }

                    // Save citations if we have them
                    if (
                      insertedResult &&
                      result.citations &&
                      result.citations.length > 0
                    ) {
                      const citationsToInsert = result.citations.map(
                        (citation) => ({
                          result_id: insertedResult.id,
                          url: citation.url,
                          title: citation.title || null,
                          domain: citation.domain || null,
                          favicon_url: citation.favicon_url || null,
                          position: citation.position || 0,
                        })
                      );

                      const { error: citationsError } = await supabase
                        .from("citations")
                        .insert(citationsToInsert);

                      if (citationsError) {
                        console.error(
                          `[Daily KPI Stream] Error inserting citations:`,
                          citationsError
                        );
                      } else {
                        console.log(
                          `[Daily KPI Stream] Saved ${citationsToInsert.length} citations`
                        );
                      }
                    }
                  } catch (err) {
                    console.error(
                      `[Daily KPI Stream] Error saving individual result:`,
                      err
                    );
                  }
                }

                // STEP 4: Send success event for this LLM
                processed++;
                sendEvent({
                  type: "success",
                  promptId: prompt.id,
                  promptText: prompt.prompt_text,
                  llmProvider: llmId,
                  kpis: {
                    visibilityScore: Math.round(100 * visibilityScore),
                    mentionRate: Math.round(100 * mentionRate),
                    citationRate: Math.round(100 * citationRate),
                    avgPosition: avgPosition ? avgPosition.toFixed(2) : "0.00",
                  },
                });
              } catch (error: any) {
                // Error processing this prompt with this LLM
                console.error(
                  `[Daily KPI Stream] Error processing prompt ${prompt.id} with ${llmId}:`,
                  error
                );
                errors++;
                sendEvent({
                  type: "error",
                  promptId: prompt.id,
                  promptText: prompt.prompt_text,
                  llmProvider: llmId,
                  error: error.message || "Unknown error",
                });
              }
            } // End of LLM loop
          } catch (error: any) {
            // Error processing this prompt (outer catch)
            console.error(
              `[Daily KPI Stream] Error processing prompt ${prompt.id}:`,
              error
            );
            errors++;
            sendEvent({
              type: "error",
              promptId: prompt.id,
              promptText: prompt.prompt_text,
              error: error.message || "Unknown error",
            });
          }
        } // End of prompts loop

        // Send completion event
        sendEvent({
          type: "complete",
          summary: {
            total: totalTasks,
            promptCount: prompts.length,
            llmCount: activeLLMs.length,
            processed,
            skipped,
            errors,
          },
        });

        console.log("[Daily KPI Stream] Stream completed", {
          totalTasks,
          prompts: prompts.length,
          llms: activeLLMs.length,
          processed,
          skipped,
          errors,
        });
        controller.close();
      } catch (error: any) {
        console.error("[Daily KPI Stream] Fatal error:", error);
        sendEvent({
          type: "error",
          error: error.message || "Unknown error",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
