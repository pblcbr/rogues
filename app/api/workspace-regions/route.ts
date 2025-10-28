import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * GET /api/workspace-regions
 * List all regions for a workspace
 * Query params: workspaceId
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Get all regions for this workspace
    const { data: regions, error } = await supabase
      .from("workspace_regions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ regions: regions || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspace-regions
 * Create a new region for a workspace
 * Body: { workspaceId, region, language }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, region, language } = await request.json();

    if (!workspaceId || !region || !language) {
      return NextResponse.json(
        { error: "workspaceId, region, and language are required" },
        { status: 400 }
      );
    }

    // Verify user owns this workspace
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("owner_id", user.id)
      .single();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or unauthorized" },
        { status: 403 }
      );
    }

    // Create new region
    const { data: newRegion, error } = await supabase
      .from("workspace_regions")
      .insert({
        workspace_id: workspaceId,
        region,
        language,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ region: newRegion });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
