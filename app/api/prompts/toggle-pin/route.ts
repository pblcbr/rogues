import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/prompts/toggle-pin
 * Body: { promptId: string, isPinned: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { promptId, isPinned } = await request.json();
    if (!promptId || typeof isPinned !== "boolean") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { error } = await supabase
      .from("monitoring_prompts")
      .update({ is_pinned: isPinned })
      .eq("id", promptId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
