import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe/client";
import { getPlanById } from "@/lib/stripe/plans";
import { generateTopicsForDomain } from "@/lib/openai/topic-generator";
import { generatePromptsForTopics } from "@/lib/openai/prompt-from-topic";

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

    // Get or create Stripe customer BEFORE creating workspace
    // Customer ID is the same for all workspaces of a user
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = userProfile?.stripe_customer_id;

    if (!customerId) {
      // Try to find an existing Stripe customer by email to reuse saved PMs
      console.log(
        "[API] No customer ID in profile, searching for existing customer by email..."
      );
      const existing = await stripe.customers.list({
        email: user.email || undefined,
        limit: 1,
      });

      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
        console.log("[API] Found existing customer:", customerId);

        // Save to profile for future use
        await supabase
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id);
      } else {
        // Create new Stripe customer
        console.log("[API] Creating new Stripe customer...");
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });
        customerId = customer.id;
        console.log("[API] Created new customer:", customerId);

        // Save customer ID to profile
        await supabase
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id);
      }
    } else {
      console.log("[API] Using existing customer ID from profile:", customerId);
    }

    // Create workspace with customer_id (same for all workspaces)
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
        stripe_customer_id: customerId!, // Always save customer_id (same for all workspaces)
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
      const { data: insertedRegion, error: regionError } = await supabase
        .from("workspace_regions")
        .insert({
          workspace_id: workspace.id,
          region: region,
          language: language,
          is_default: true,
        })
        .select()
        .single();

      if (regionError) {
        console.error("[API] Region insert error:", regionError);
        throw regionError;
      }

      if (insertedRegion) {
        defaultRegionId = insertedRegion.id;
        console.log("[API] Default region created:", insertedRegion.id);
      }
    } catch (e) {
      console.error("[API] Error creating region:", e);
      return NextResponse.json(
        {
          error: "Failed to create workspace region",
          details: e instanceof Error ? e.message : String(e),
        },
        { status: 500 }
      );
    }

    // Create Stripe subscription for this workspace
    // Each workspace gets its own subscription, but shares the same customer
    console.log("[API] Creating Stripe subscription for workspace...");
    const planConfig = getPlanById(selectedPlan);
    if (!planConfig || !planConfig.stripePriceId) {
      console.error("[API] Plan not found or missing Stripe Price ID");
      return NextResponse.json(
        { error: "Invalid plan configuration" },
        { status: 400 }
      );
    }

    // Check for existing payment method
    const pms = await stripe.paymentMethods.list({
      customer: customerId!,
      type: "card",
    });

    if (pms.data.length > 0) {
      // Use saved payment method to create subscription
      const pmId = pms.data[0].id;
      console.log("[API] Using saved payment method:", pmId);

      await stripe.customers.update(customerId!, {
        invoice_settings: { default_payment_method: pmId },
      });

      const subscription = await stripe.subscriptions.create({
        customer: customerId!,
        items: [{ price: planConfig.stripePriceId }],
        default_payment_method: pmId,
        collection_method: "charge_automatically",
        payment_behavior: "allow_incomplete",
        metadata: {
          userId: user.id,
          workspaceId: workspace.id,
          planId: selectedPlan,
        },
      });

      // Update workspace with subscription_id (customer_id already set)
      await supabase
        .from("workspaces")
        .update({
          stripe_subscription_id: subscription.id,
        })
        .eq("id", workspace.id);

      console.log("[API] Subscription created:", subscription.id);
    } else {
      // No saved PM - use Checkout
      console.log(
        "[API] No saved payment method, creating Checkout session..."
      );
      const origin =
        request.headers.get("origin") ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";
      const successUrl = `${origin}/payment-processing?workspaceId=${workspace.id}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/dashboard?cancel=1`;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_collection: "always",
        customer: customerId!,
        line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
        payment_method_options: {
          card: {
            setup_future_usage: "off_session",
          },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: workspace.id,
        subscription_data: {
          metadata: {
            userId: user.id,
            workspaceId: workspace.id,
            planId: selectedPlan,
          },
        },
        metadata: {
          userId: user.id,
          workspaceId: workspace.id,
          planId: selectedPlan,
        },
        allow_promotion_codes: true,
      });

      console.log("[API] Checkout session created:", session.id);

      return NextResponse.json({
        success: true,
        workspace,
        topics_count: 0,
        prompts_count: 0,
        checkout_url: session.url,
      });
    }

    // Add user as owner (trigger will do this automatically, but we ensure it)
    console.log("[API] Inserting into workspace_members...");
    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      // Log the error but don't fail if it's a duplicate (trigger may have already created it)
      if (memberError.message.includes("duplicate")) {
        console.log(
          "[API] Workspace member already exists (likely created by trigger)"
        );
      } else {
        console.error("[API] Workspace member error:", memberError);
        console.error(
          "[API] Full error details:",
          JSON.stringify(memberError, null, 2)
        );

        // Only fail if it's a table not found error (very unlikely)
        // Check for the specific error pattern: "relation \"table_name\" does not exist"
        if (
          memberError.message.includes("does not exist") &&
          memberError.message.includes("relation") &&
          memberError.message.includes("workspace_members")
        ) {
          return NextResponse.json(
            {
              error:
                "workspace_members table not found. Please check your database setup.",
            },
            { status: 500 }
          );
        }

        // For other errors (RLS, permissions, etc), log but continue
        // The workspace creation should not fail because of workspace_members insertion
        // A trigger may have already handled it, or it can be fixed later
        console.warn(
          "[API] Workspace member insertion failed, but continuing with workspace creation. Error:",
          memberError.message
        );
      }
    } else {
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

    // Return immediately, then trigger async generation
    // Execute generation in background (non-blocking)
    (async () => {
      try {
        console.log(
          "[API] Starting async topic/prompt generation for new workspace..."
        );

        const domain = brand_website || brand_name || "";
        const brandName = brand_name || "";
        const brandDescription = brand_description || "";

        console.log("[API] Generating topics for domain:", domain);
        console.log("[API] Brand:", brandName);
        console.log("[API] Description:", brandDescription);

        // Generate topics using OpenAI
        const topicsResult = await generateTopicsForDomain(domain, {
          brandHint:
            brandDescription || `${brandName} - ${brandDescription || ""}`,
          context: {
            regions_languages: `${region}, ${language}`,
          },
          count: 10, // Generate 10 topics
        });

        const topics = topicsResult.topics || [];
        console.log(`[API] Generated ${topics.length} topics`);

        if (topics.length > 0 && defaultRegionId) {
          // Insert topics
          const { error: topicsError } = await supabase.from("topics").insert(
            topics.map((t) => ({
              workspace_id: workspace.id,
              workspace_region_id: defaultRegionId,
              name: t.name,
              is_selected: true,
              source: "ai_generated",
            }))
          );

          if (topicsError) {
            console.error("[API] Topics insert error:", topicsError);
          } else {
            console.log(`[API] Inserted ${topics.length} topics`);

            // Fetch inserted topics to get IDs
            const { data: insertedTopics } = await supabase
              .from("topics")
              .select("id, name")
              .eq("workspace_id", workspace.id)
              .eq("workspace_region_id", defaultRegionId)
              .eq("is_selected", true);

            if (insertedTopics && insertedTopics.length > 0) {
              // Generate prompts from topics
              console.log("[API] Generating prompts from topics...");
              console.log("[API] Using language:", language, "region:", region);
              const topicsWithFullData = topics.filter((t) =>
                insertedTopics.some((td) => td.name === t.name)
              );

              const prompts = await generatePromptsForTopics(
                topicsWithFullData,
                8, // 8 prompts per topic
                language, // Pass language explicitly
                region // Pass region explicitly
              );
              console.log(
                `[API] Generated ${prompts.length} prompts for ${language}`
              );

              const topicMap = new Map(
                insertedTopics.map((t) => [t.name, t.id])
              );

              const rows = prompts.map((p) => ({
                workspace_id: workspace.id,
                workspace_region_id: defaultRegionId,
                prompt_text: p.text,
                topic_id: p.topic ? topicMap.get(p.topic) || null : null,
                is_active: true,
                source: "ai_generated",
              }));

              if (rows.length > 0) {
                // Cap at 50 prompts for starter plan, 100 for growth
                const maxPrompts = selectedPlan === "starter" ? 50 : 100;
                const { error: promptsError } = await supabase
                  .from("monitoring_prompts")
                  .insert(rows.slice(0, maxPrompts));

                if (promptsError) {
                  console.error("[API] Prompts insert error:", promptsError);
                } else {
                  console.log(
                    `[API] Inserted ${rows.slice(0, maxPrompts).length} prompts`
                  );
                }
              }
            }
          }
        } else {
          console.warn(
            "[API] No topics generated or no region, skipping prompt generation"
          );
        }

        console.log("[API] ✅ Async generation completed successfully");
      } catch (error) {
        console.error("[API] ❌ Async generation error:", error);
      }
    })();

    return NextResponse.json({
      success: true,
      workspace,
      regionId: defaultRegionId,
      generating: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
