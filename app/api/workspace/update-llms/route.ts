import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/workspace/update-llms
 * Update active LLMs for a workspace
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, activeLLMs } = body;

    if (!workspaceId || !activeLLMs) {
      return NextResponse.json(
        { error: "workspaceId and activeLLMs are required" },
        { status: 400 }
      );
    }

    // Validate activeLLMs is an array
    if (!Array.isArray(activeLLMs)) {
      return NextResponse.json(
        { error: "activeLLMs must be an array" },
        { status: 400 }
      );
    }

    // Verify user has access to this workspace
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", session.user.id)
      .single();

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json(
        { error: "Only workspace owners and admins can update LLM settings" },
        { status: 403 }
      );
    }

    // Get workspace to check plan limits
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("plan")
      .eq("id", workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Validate plan limits
    let maxEngines = 1; // Default to Starter
    const plan = workspace.plan || "starter";

    if (plan.includes("starter")) {
      maxEngines = 1;
    } else if (plan.includes("growth")) {
      maxEngines = 3;
    } else if (plan === "enterprise") {
      maxEngines = -1; // Unlimited
    }

    if (maxEngines !== -1 && activeLLMs.length > maxEngines) {
      return NextResponse.json(
        {
          error: `Your plan allows up to ${maxEngines} LLM engine(s), but ${activeLLMs.length} were selected`,
        },
        { status: 400 }
      );
    }

    // Update workspace with new active LLMs
    const { error: updateError } = await supabase
      .from("workspaces")
      .update({ active_llms: activeLLMs })
      .eq("id", workspaceId);

    if (updateError) {
      console.error("Error updating workspace:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      activeLLMs,
    });
  } catch (error: any) {
    console.error("Error in update-llms:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
