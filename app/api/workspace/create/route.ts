import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { generatePromptsForTopics } from "@/lib/openai/prompt-from-topic";
import { stripe } from "@/lib/stripe/client";
import { getPlanById } from "@/lib/stripe/plans";

/**
 * POST /api/workspace/create
 * Create a new workspace with brand, region, and language
 * Body: { brand_name: string, brand_website: string, region: string, language: string }
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[API] Creating workspace...");
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    console.log("[API] User authenticated:", user.id);

    const {
      brand_name,
      brand_website,
      brand_description,
      region,
      language,
      plan,
    } = await request.json();

    console.log("[API] Request body:", {
      brand_name,
      brand_website,
      region,
      language,
      plan,
    });

    if (!brand_name || !brand_website || !region || !language) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use provided plan or default to starter
    const selectedPlan = plan || "starter";

    // Create workspace
    console.log("[API] Inserting workspace into database...");
    console.log("[API] Using plan:", selectedPlan);
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        name: brand_name,
        domain: brand_website,
        brand_name: brand_name,
        brand_website: brand_website,
        region: region,
        language: language,
        owner_id: user.id,
        plan: selectedPlan,
      })
      .select()
      .single();

    if (workspaceError) {
      console.error("[API] Workspace error:", workspaceError);
      return NextResponse.json(
        { error: workspaceError.message },
        { status: 500 }
      );
    }

    console.log("[API] Workspace created:", workspace.id);

    // Create default workspace region
    let defaultRegionId: string | null = null;
    try {
      const { data: region } = await supabase
        .from("workspace_regions")
        .insert({
          workspace_id: workspace.id,
          region: region,
          language: language,
          is_default: true,
        })
        .select()
        .single();

      if (region) {
        defaultRegionId = region.id;
        console.log("[API] Default region created:", region.id);
      }
    } catch (e) {
      console.error("[API] Error creating region:", e);
      return NextResponse.json(
        { error: "Failed to create workspace region" },
        { status: 500 }
      );
    }

    // Create Stripe subscription for this workspace
    console.log("[API] Creating Stripe subscription for workspace...");
    const plan = getPlanById(selectedPlan);
    if (!plan || !plan.stripePriceId) {
      console.error("[API] Plan not found or missing Stripe Price ID");
      return NextResponse.json(
        { error: "Invalid plan configuration" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = userProfile?.stripe_customer_id;

    if (!customerId) {
      // Create Stripe customer
      console.log("[API] Creating Stripe customer...");
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Create subscription
    console.log("[API] Creating Stripe subscription...");
    const subscription = await stripe.subscriptions.create({
      customer: customerId!,
      items: [{ price: plan.stripePriceId }],
      metadata: {
        userId: user.id,
        workspaceId: workspace.id,
        planId: selectedPlan,
      },
    });

    console.log("[API] Subscription created:", subscription.id);

    // Update workspace with Stripe IDs
    await supabase
      .from("workspaces")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
      })
      .eq("id", workspace.id);

    console.log("[API] Workspace updated with Stripe IDs");

    // Add user as owner (trigger will do this automatically, but we ensure it)
    console.log("[API] Inserting into workspace_members...");
    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError && !memberError.message.includes("duplicate")) {
      console.error("[API] Workspace member error:", memberError);
      // If the table doesn't exist, provide helpful error
      if (
        memberError.message.includes("does not exist") ||
        memberError.message.includes("relation")
      ) {
        return NextResponse.json(
          {
            error:
              "workspace_members table not found. Please run MANUAL_MIGRATION_workspace_members.sql in Supabase",
          },
          { status: 500 }
        );
      }
      // Check for RLS policy errors
      if (
        memberError.message.includes("new row violates row-level security") ||
        memberError.message.includes("policy")
      ) {
        return NextResponse.json(
          {
            error:
              "Row Level Security policy violation. Check that the user is authenticated and policies are set correctly.",
          },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    if (!memberError) {
      console.log("[API] Successfully added user to workspace_members");
    }

    // Set as current workspace and current region
    console.log("[API] Updating current_workspace_id in profile...");
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        current_workspace_id: workspace.id,
        current_workspace_region_id: defaultRegionId,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("[API] Profile update error:", profileError);
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }
    console.log("[API] Profile updated successfully");

    // Generate topics for this workspace (similar to onboarding)
    const topics = await generateTopicsForWorkspace(
      brand_name,
      brand_description,
      region,
      language
    );

    if (topics.length > 0) {
      const { error: topicsError } = await supabase.from("topics").insert(
        topics.map((t) => ({
          workspace_id: workspace.id,
          name: t.name,
          is_selected: true,
          source: "ai_generated",
        }))
      );

      if (topicsError) {
        console.error("Error inserting topics:", topicsError);
      }
    }

    // Generate prompts from topics
    const topicIds = await supabase
      .from("topics")
      .select("id, name")
      .eq("workspace_id", workspace.id)
      .eq("is_selected", true);

    let promptsCount = 0;
    if (topicIds.data && topicIds.data.length > 0) {
      const prompts = await generatePromptsForTopics(
        topicIds.data,
        8,
        language,
        region
      );

      const topicMap = new Map(topicIds.data.map((t) => [t.name, t.id]));

      const rows = prompts.map((p) => ({
        workspace_id: workspace.id,
        prompt_text: p.text,
        topic_id: p.topic ? topicMap.get(p.topic) || null : null,
        is_active: true,
        source: "ai_generated",
      }));

      if (rows.length > 0) {
        const { error: promptsError } = await supabase
          .from("monitoring_prompts")
          .insert(rows.slice(0, 50)); // Cap at 50 for starter plan

        if (promptsError) {
          console.error("Error inserting prompts:", promptsError);
        } else {
          promptsCount = rows.slice(0, 50).length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      workspace,
      topics_count: topics.length,
      prompts_count: promptsCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * Generate topics for a workspace based on brand, region, and language
 */
async function generateTopicsForWorkspace(
  brandName: string,
  brandDescription: string | undefined,
  region: string,
  language: string
): Promise<Array<{ name: string }>> {
  // For now, return seeded topics (can be enhanced with AI later)
  const topics = [
    { name: "Brand Awareness & Recognition" },
    { name: "Product Offerings & Features" },
    { name: "Pricing & Plans" },
    { name: "Customer Support & Service" },
    { name: "Integration & Compatibility" },
    { name: "Security & Compliance" },
    { name: "Customer Success Stories" },
    { name: "Competitive Comparisons" },
  ];

  return topics;
}
