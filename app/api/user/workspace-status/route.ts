import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/user/workspace-status
 * Checks if current user has a workspace (payment completed)
 */
export async function GET() {
  try {
    console.log("[WORKSPACE STATUS] Checking workspace...");
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("[WORKSPACE STATUS] ❌ No user found:", userError?.message);
      return NextResponse.json({ hasWorkspace: false });
    }

    console.log("[WORKSPACE STATUS] ✓ User authenticated:", user.id);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[WORKSPACE STATUS] ❌ Profile error:", profileError);
      return NextResponse.json({ hasWorkspace: false }, { status: 500 });
    }

    console.log("[WORKSPACE STATUS] Profile data:", {
      userId: user.id,
      workspaceId: profile?.workspace_id,
      hasWorkspace: !!profile?.workspace_id,
    });

    return NextResponse.json({
      hasWorkspace: !!profile?.workspace_id,
      workspaceId: profile?.workspace_id || null,
    });
  } catch (error) {
    console.error("[WORKSPACE STATUS] 💥 Unexpected error:", error);
    return NextResponse.json({ hasWorkspace: false }, { status: 500 });
  }
}
