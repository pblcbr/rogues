import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/workspace/initialize
 * Initializes workspace and monitoring prompts after registration
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        name: `${profile.first_name}'s Workspace`,
        domain: profile.company_domain,
        owner_id: user.id,
        plan: "growth", // Default plan
      })
      .select()
      .single();

    if (workspaceError) {
      console.error("Workspace creation error:", workspaceError);
      return NextResponse.json(
        { error: "Failed to create workspace" },
        { status: 500 }
      );
    }

    // TODO: Create monitoring prompts from registration store
    // This would need to be passed in the request body

    // Update profile onboarding status
    await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_step: 8,
      })
      .eq("id", user.id);

    return NextResponse.json({
      workspace,
      message: "Workspace initialized successfully",
    });
  } catch (error) {
    console.error("Workspace initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize workspace" },
      { status: 500 }
    );
  }
}
