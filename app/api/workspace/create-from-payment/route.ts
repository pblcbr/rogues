import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe/client";
import { generatePromptsForTopics } from "@/lib/openai/prompt-from-topic";

/**
 * POST /api/workspace/create-from-payment
 * Creates workspace immediately after payment, without waiting for webhook
 * Body: { sessionId: string, planId: string }
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[CREATE WORKSPACE] Starting workspace creation...");
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, planId } = await request.json();

    // Verify Stripe session is paid
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      console.error("[CREATE WORKSPACE] Session not paid");
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    console.log("[CREATE WORKSPACE] Session verified:", session.id);

    // Check if workspace already exists (webhook may have created it)
    const { data: existingWorkspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .eq("stripe_subscription_id", session.subscription as string)
      .single();

    if (existingWorkspace) {
      console.log(
        "[CREATE WORKSPACE] Workspace already exists:",
        existingWorkspace.id
      );
      return NextResponse.json({
        success: true,
        workspaceId: existingWorkspace.id,
        alreadyExisted: true,
      });
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

    console.log("[CREATE WORKSPACE] Creating workspace for user:", user.id);

    // Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        name: `${profile.first_name || profile.email}'s Workspace`,
        domain: profile.company_domain || "",
        owner_id: user.id,
        plan: planId || "growth",
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        // Add brand info (if columns exist)
        brand_name: profile.first_name
          ? `${profile.first_name} ${profile.last_name}`
          : profile.email,
        brand_website: profile.brand_website || "",
        region: profile.region || "",
        language: profile.language || "",
      })
      .select()
      .single();

    if (workspaceError) {
      console.error("[CREATE WORKSPACE] Error:", workspaceError);
      return NextResponse.json(
        { error: workspaceError.message },
        { status: 500 }
      );
    }

    console.log("[CREATE WORKSPACE] ✓ Workspace created:", workspace.id);

    // Try to add to workspace_members (if table exists)
    try {
      await supabase.from("workspace_members").insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
      });
      console.log("[CREATE WORKSPACE] ✓ Added to workspace_members");
    } catch (e) {
      console.log(
        "[CREATE WORKSPACE] ⚠️ Could not add to workspace_members (table may not exist)"
      );
    }

    // Create default workspace region
    let defaultRegionId: string | null = null;
    try {
      const { data: region } = await supabase
        .from("workspace_regions")
        .insert({
          workspace_id: workspace.id,
          region: profile.region || "United States",
          language: profile.language || "English",
          is_default: true,
        })
        .select()
        .single();

      if (region) {
        defaultRegionId = region.id;
        console.log("[CREATE WORKSPACE] ✓ Default region created:", region.id);
      }
    } catch (e) {
      console.log(
        "[CREATE WORKSPACE] ⚠️ Could not create region (table may not exist)"
      );
    }

    // Try to update profile (if columns exist)
    try {
      await supabase
        .from("profiles")
        .update({
          workspace_id: workspace.id,
          current_workspace_id: workspace.id,
          current_workspace_region_id: defaultRegionId,
          onboarding_completed: true,
        })
        .eq("id", user.id);
      console.log("[CREATE WORKSPACE] ✓ Profile updated");
    } catch (e) {
      console.log("[CREATE WORKSPACE] ⚠️ Could not update profile");
    }

    return NextResponse.json({
      success: true,
      workspaceId: workspace.id,
    });
  } catch (error) {
    console.error("[CREATE WORKSPACE] 💥 Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
