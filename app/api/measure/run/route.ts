import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  detectMention,
  extractCitations,
  sentimentScore,
  prominenceScore,
} from "@/lib/measure/heuristics";
import { embedTexts, cosine } from "@/lib/measure/embeddings";

/**
 * POST /api/measure/run
 * Minimal runner: creates a snapshot for allowed models (cap by plan),
 * and records results with heuristics. For now, accepts optional raw answers
 * to exercise the pipeline.
 * Body: { workspaceId: string, modelIds?: string[], rawAnswers?: { [promptId: string]: string } }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, modelIds, rawAnswers } = await request.json();
    if (!workspaceId)
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );

    // Resolve plan and cap models
    const { data: ws } = await supabase
      .from("workspaces")
      .select("plan")
      .eq("id", workspaceId)
      .single();
    const plan = ws?.plan || "growth";
    const modelCap = plan === "starter" ? 1 : plan === "growth" ? 3 : 99;

    // Get selected/allowed models from settings if present, else default
    const { data: wsSettings } = await supabase
      .from("workspaces")
      .select("settings")
      .eq("id", workspaceId)
      .single();
    const allowed: string[] = (wsSettings?.settings
      ?.allowed_models as string[]) || ["chatgpt"];

    // Final model list = intersection with requested (if provided), truncated to cap
    const req =
      Array.isArray(modelIds) && modelIds.length > 0 ? modelIds : allowed;
    const finalModels = req
      .filter((m) => allowed.includes(m))
      .slice(0, modelCap);
    if (finalModels.length === 0) {
      return NextResponse.json(
        { success: false, reason: "no_models_allowed" },
        { status: 200 }
      );
    }

    // Create a prompt_set if none exists (MVP shortcut)
    const { data: ps } = await supabase
      .from("prompt_sets")
      .select("id")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .maybeSingle();

    const promptSetId = ps?.id || null;

    const createdSnapshots: string[] = [];
    for (const modelId of finalModels) {
      // Create snapshot
      const { data: snap, error: snapErr } = await supabase
        .from("snapshots")
        .insert({
          workspace_id: workspaceId,
          model_id: modelId,
          prompt_set_id: promptSetId,
        })
        .select("id")
        .single();
      if (snapErr) continue;
      createdSnapshots.push(snap.id);

      // Fetch active prompts
      const { data: prompts } = await supabase
        .from("monitoring_prompts")
        .select("id, prompt_text")
        .eq("workspace_id", workspaceId)
        .eq("is_active", true);

      // Prepare topics keywords for a simple alignment proxy
      const { data: topics } = await supabase
        .from("topics")
        .select("keywords")
        .eq("workspace_id", workspaceId)
        .eq("is_selected", true);
      const topicKw = Array.from(
        new Set(
          (topics || [])
            .flatMap((t: any) => (Array.isArray(t.keywords) ? t.keywords : []))
            .filter(Boolean)
        )
      ).map((k: any) => String(k).toLowerCase());

      // If no rawAnswers passed, attempt ChatGPT calls for this model
      const answers: Record<string, string> = { ...(rawAnswers || {}) };
      if (
        (!rawAnswers || Object.keys(rawAnswers).length === 0) &&
        modelId === "chatgpt"
      ) {
        try {
          const { openai } = await import("@/lib/openai/client");
          const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

          async function callOnce(promptText: string): Promise<string> {
            const res = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: "Answer succinctly for evaluation.",
                },
                { role: "user", content: promptText },
              ],
              temperature: 0.1,
              max_tokens: 600,
            });
            return res.choices[0].message.content || "";
          }

          async function callWithRetry(
            promptText: string,
            tries = 2
          ): Promise<string> {
            for (let i = 0; i < tries; i++) {
              try {
                return await callOnce(promptText);
              } catch (e) {
                await sleep(300 * Math.pow(2, i));
                if (i === tries - 1) throw e;
              }
            }
            return "";
          }

          const CONCURRENCY = 3;
          for (let i = 0; i < (prompts || []).length; i += CONCURRENCY) {
            const batch = (prompts || []).slice(i, i + CONCURRENCY);
            const results = await Promise.all(
              batch.map(async (p) => {
                try {
                  const content = await callWithRetry(p.prompt_text, 2);
                  return { id: p.id, content };
                } catch {
                  return { id: p.id, content: "" };
                }
              })
            );
            results.forEach((r) => (answers[r.id] = r.content));
            await sleep(250);
          }
        } catch {
          // No API key or error: skip and keep answers empty
        }
      }

      // Simple lexical alignment: Jaccard between prompt tokens and topic keywords
      function jaccardAlignment(promptText: string): number | null {
        try {
          const a = new Set(
            (promptText || "")
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, " ")
              .split(/\s+/)
              .filter(Boolean)
          );
          const b = new Set(topicKw);
          if (a.size === 0 || b.size === 0) return 0;
          let inter = 0;
          a.forEach((t) => {
            if (b.has(t)) inter++;
          });
          const union = a.size + b.size - inter;
          return union > 0 ? inter / union : 0;
        } catch {
          return null;
        }
      }

      // Optional embeddings-based alignment: compute cosine(query, topics summary)
      let embAlignments: Record<string, number> = {};
      try {
        if (topicKw.length > 0) {
          const topicSummary = topicKw.join(" ");
          const queries = (prompts || []).map((p) => p.prompt_text);
          const embs = await embedTexts([topicSummary, ...queries]);
          if (embs.length === 1 + (prompts?.length || 0)) {
            const topicEmb = embs[0];
            for (let i = 0; i < (prompts || []).length; i++) {
              const qEmb = embs[i + 1];
              const c = cosine(topicEmb, qEmb);
              if (typeof c === "number")
                embAlignments[(prompts as any[])[i].id] = c;
            }
          }
        }
      } catch {}

      // Build results using heuristics and (optional) answers
      // Fetch competitors to compute SoV later and count mentions
      const { data: competitors } = await supabase
        .from("competitors")
        .select("name, domain, brand_terms")
        .eq("workspace_id", workspaceId);
      const compTokens: string[] = (competitors || [])
        .flatMap((c: any) => [
          c.name,
          c.domain,
          ...(Array.isArray(c.brand_terms) ? c.brand_terms : []),
        ])
        .filter(Boolean)
        .map((s: any) => String(s).toLowerCase());

      const rows = (prompts || []).map((p) => {
        const answer = (answers[p.id] || "").toLowerCase();
        const citations = extractCitations(answer);
        const align =
          typeof embAlignments[p.id] === "number"
            ? embAlignments[p.id]
            : jaccardAlignment(p.prompt_text);
        // Competitor mentions (very simple): count tokens found in answer
        let competitorMentions = 0;
        compTokens.forEach((t) => {
          if (t && answer.includes(t)) competitorMentions += 1;
        });
        return {
          snapshot_id: snap.id,
          prompt_id: p.id,
          prompt_text: p.prompt_text,
          mention_present: detectMention(answer, undefined, undefined),
          citations_count: citations.length,
          sentiment: sentimentScore(answer),
          prominence: prominenceScore(answer, undefined, undefined),
          alignment: align,
          competitor_mentions: competitorMentions,
          raw_answer: answer ? { text: answer } : null,
        };
      });
      if (rows.length > 0) {
        await supabase.from("results").insert(rows);
      }

      // Insert citations (from answers if present)
      if (Object.keys(answers).length > 0 && prompts && prompts.length > 0) {
        const { data: inserted } = await supabase
          .from("results")
          .select("id, prompt_id")
          .eq("snapshot_id", snap.id);
        const promptIdToResultId = new Map<string, string>();
        (inserted || []).forEach((r: any) =>
          promptIdToResultId.set(r.prompt_id, r.id)
        );

        const citationRows: any[] = [];
        for (const p of prompts || []) {
          const ans = answers[p.id];
          if (!ans) continue;
          const cites = extractCitations(ans);
          const resultId = promptIdToResultId.get(p.id);
          cites.forEach((c) => {
            const d = c.domain || "";
            // Very rough authority placeholder; will replace later
            const base = 0.3;
            const tldBonus = /\.(gov|edu)$/i.test(d) ? 0.3 : 0;
            const shortBonus = d.replace(/\./g, "").length < 12 ? 0.1 : 0;
            const authority = Math.max(
              0,
              Math.min(1, base + tldBonus + shortBonus)
            );
            citationRows.push({
              result_id: resultId,
              domain: d,
              url: c.url || null,
              authority_cached: authority,
            });
          });
        }
        if (citationRows.length > 0) {
          await supabase.from("citations").insert(citationRows);
          const uniq = Array.from(new Set(citationRows.map((r) => r.domain)));
          for (const d of uniq) {
            const row = citationRows.find((r) => r.domain === d);
            await supabase.from("authority_cache").upsert(
              {
                domain: d,
                authority: row?.authority_cached ?? null,
                refreshed_at: new Date().toISOString(),
              },
              { onConflict: "domain" }
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      snapshots: createdSnapshots,
      models: finalModels,
      modelCap,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
