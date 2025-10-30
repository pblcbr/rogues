import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe/client";
import { generatePromptsForTopics } from "@/lib/openai/prompt-from-topic";
import { generateTopicsForDomain } from "@/lib/openai/topic-generator";

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

    const {
      sessionId,
      planId,
      region: requestRegion,
      language: requestLanguage,
    } = await request.json();

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
      .select("*")
      .eq("owner_id", user.id)
      .eq("stripe_subscription_id", session.subscription as string)
      .single();

    if (existingWorkspace) {
      console.log(
        "[CREATE WORKSPACE] Workspace already exists:",
        existingWorkspace.id
      );

      // Check if topics already exist for this workspace
      const { data: existingTopics } = await supabase
        .from("topics")
        .select("id")
        .eq("workspace_id", existingWorkspace.id)
        .limit(1);

      if (existingTopics && existingTopics.length > 0) {
        console.log(
          "[CREATE WORKSPACE] Topics already exist, skipping generation"
        );
        return NextResponse.json({
          success: true,
          workspaceId: existingWorkspace.id,
          alreadyExisted: true,
        });
      }

      console.log("[CREATE WORKSPACE] No topics found, will generate them");
      // Continue to generate topics below
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

    let workspace;

    if (!existingWorkspace) {
      console.log("[CREATE WORKSPACE] Creating workspace for user:", user.id);

      // Create workspace (only with fields that exist in the table)
      // Use region/language from request body, then defaults
      const workspaceRegion = requestRegion || "United States";
      const workspaceLanguage = requestLanguage || "English";

      // Extract brand name from website (e.g., "taclia.com" -> "Taclia")
      const extractBrandName = (website: string): string => {
        if (!website) return "";
        const domain = website
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .split("/")[0]
          .split(".")[0];
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      };

      const brandWebsite =
        profile.brand_website || profile.company_domain || "";
      const brandName = extractBrandName(brandWebsite);

      const { data: newWorkspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          name: `${profile.first_name || profile.email}'s Workspace`,
          domain: brandWebsite,
          owner_id: user.id,
          plan: planId || "growth",
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          brand_name: brandName, // ✨ Nuevo
          brand_website: brandWebsite,
          region: workspaceRegion,
          language: workspaceLanguage,
        })
        .select()
        .single();

      if (workspaceError || !newWorkspace) {
        console.error("[CREATE WORKSPACE] Error:", workspaceError);
        return NextResponse.json(
          { error: workspaceError?.message || "Failed to create workspace" },
          { status: 500 }
        );
      }

      workspace = newWorkspace;
      console.log("[CREATE WORKSPACE] ✓ Workspace created:", workspace.id);
    } else {
      console.log(
        "[CREATE WORKSPACE] Using existing workspace:",
        existingWorkspace.id
      );
      // Get full workspace data
      const { data: fullWorkspace } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", existingWorkspace.id)
        .single();

      workspace = fullWorkspace;

      if (!workspace) {
        return NextResponse.json(
          { error: "Failed to retrieve workspace" },
          { status: 500 }
        );
      }
    }

    // Add to workspace_members (only if not already a member)
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .single();

    if (!existingMember) {
      const { error: membersError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: "owner",
        });

      if (membersError) {
        console.error(
          "[CREATE WORKSPACE] ❌ Error adding to workspace_members:",
          membersError
        );
      } else {
        console.log("[CREATE WORKSPACE] ✓ Added to workspace_members");
      }
    } else {
      console.log("[CREATE WORKSPACE] ✓ Already a workspace member");
    }

    // Get or create default workspace region
    let defaultRegionId: string | null = null;

    // Check if default region already exists
    const { data: existingRegion } = await supabase
      .from("workspace_regions")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("is_default", true)
      .single();

    let defaultRegionData = existingRegion;

    if (!existingRegion) {
      // Use region/language from request, then workspace, then defaults
      const regionToUse = requestRegion || workspace.region || "United States";
      const languageToUse = requestLanguage || workspace.language || "English";

      console.log("[CREATE WORKSPACE] Creating region with data:", {
        workspace_id: workspace.id,
        region: regionToUse,
        language: languageToUse,
        is_default: true,
      });

      const { data: newRegion, error: regionError } = await supabase
        .from("workspace_regions")
        .insert({
          workspace_id: workspace.id,
          region: regionToUse,
          language: languageToUse,
          is_default: true,
        })
        .select()
        .single();

      defaultRegionData = newRegion;

      if (regionError) {
        console.error(
          "[CREATE WORKSPACE] ❌ Error creating region:",
          regionError
        );
        console.error("[CREATE WORKSPACE] Region error details:", {
          code: regionError.code,
          message: regionError.message,
          details: regionError.details,
        });
      } else if (newRegion) {
        console.log(
          "[CREATE WORKSPACE] ✓ Default region created:",
          newRegion.id
        );
      }
    } else {
      console.log(
        "[CREATE WORKSPACE] ✓ Using existing region:",
        existingRegion.id
      );
    }

    // Ensure we have a valid region before proceeding
    if (!defaultRegionData) {
      console.error("[CREATE WORKSPACE] ❌ No default region available");
      return NextResponse.json(
        { error: "Failed to create or retrieve default region" },
        { status: 500 }
      );
    }

    defaultRegionId = defaultRegionData.id;
    console.log("[CREATE WORKSPACE] Using region ID:", defaultRegionId);

    // Generate topics and prompts automatically for this region
    try {
      console.log("[CREATE WORKSPACE] Generating topics for region...");

      // Step 1: Generate topics
      // Use workspace region/language (they should be set)
      const regionToUse = workspace.region || requestRegion || "United States";
      const languageToUse = workspace.language || requestLanguage || "English";
      const brandWebsiteToUse =
        profile.brand_website ||
        workspace.brand_website ||
        workspace.domain ||
        "";

      const topicsResult = await generateTopicsForDomain(brandWebsiteToUse, {
        brandHint: profile.brand_description || undefined,
        context: {
          regions_languages: `${regionToUse}, ${languageToUse}`,
        },
      });

      if (topicsResult.topics && topicsResult.topics.length > 0) {
        // Save topics to database
        const topicsToInsert = topicsResult.topics.map((topic) => ({
          workspace_id: workspace.id,
          workspace_region_id: defaultRegionData.id,
          name: topic.name,
          source: "ai_generated",
          is_selected: true,
        }));

        const { data: savedTopics } = await supabase
          .from("topics")
          .insert(topicsToInsert)
          .select();

        console.log(
          `[CREATE WORKSPACE] ✓ Generated ${savedTopics?.length || 0} topics`
        );

        // Step 2: Generate prompts from topics
        if (savedTopics && savedTopics.length > 0) {
          const prompts = await generatePromptsForTopics(
            savedTopics.map((t) => ({ name: t.name })),
            6, // 6 prompts per topic
            languageToUse,
            regionToUse
          );

          if (prompts && prompts.length > 0) {
            // Save prompts to database
            const promptsToInsert = prompts.map((prompt) => ({
              workspace_id: workspace.id,
              workspace_region_id: defaultRegionData.id,
              prompt_text: prompt.text,
              topic_id: prompt.topic
                ? savedTopics.find((t) => t.name === prompt.topic)?.id
                : null,
              is_active: true,
              source: "ai_generated",
            }));

            await supabase.from("monitoring_prompts").insert(promptsToInsert);

            console.log(
              `[CREATE WORKSPACE] ✓ Generated ${prompts.length} prompts`
            );
          }
        }
      }
    } catch (error) {
      console.error(
        "[CREATE WORKSPACE] Error generating topics/prompts:",
        error
      );
      // Don't fail the workspace creation if topic/prompt generation fails
    }

    // Update profile with workspace and region info
    // Note: defaultRegionId is guaranteed to be set at this point due to check above
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        workspace_id: workspace.id,
        current_workspace_id: workspace.id,
        current_workspace_region_id: defaultRegionId,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      console.error(
        "[CREATE WORKSPACE] ❌ Error updating profile:",
        profileUpdateError
      );
      // Don't fail completely, but log the error
    } else {
      console.log(
        "[CREATE WORKSPACE] ✓ Profile updated with region:",
        defaultRegionId
      );
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
