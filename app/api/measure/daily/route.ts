import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/measure/daily
 * Daily scheduler endpoint. Runs measurement once for every workspace.
 * Protect with header: x-cron-key: process.env.CRON_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    const cronKey = request.headers.get("x-cron-key");
    const expected = process.env.CRON_SECRET;
    if (!expected || cronKey !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch all workspaces
    const { data: workspaces, error } = await supabase
      .from("workspaces")
      .select("id");
    if (error) throw error;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const results: any[] = [];
    for (const ws of workspaces || []) {
      try {
        const res = await fetch(`${appUrl}/api/measure/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: ws.id }),
        });
        const json = await res.json();
        results.push({ workspaceId: ws.id, ok: res.ok, json });
        await sleep(300); // small pacing between workspaces
      } catch (e: any) {
        results.push({ workspaceId: ws.id, ok: false, error: e?.message });
      }
    }

    return NextResponse.json({ success: true, runs: results.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
