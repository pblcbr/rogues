import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe/client";

/**
 * POST /api/stripe/create-portal-session
 * Create a Stripe Customer Portal session for managing billing
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[STRIPE PORTAL] Creating portal session...");
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("[STRIPE PORTAL] User not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[STRIPE PORTAL] User authenticated:", user.id);

    let customerId: string | null = null;

    // Find workspace with stripe_customer_id (search all workspaces where user is owner)
    // Usually the first/default workspace has the customer ID
    const { data: workspaces, error: workspacesError } = await supabase
      .from("workspaces")
      .select("id, name, stripe_customer_id, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    if (workspacesError) {
      console.error("[STRIPE PORTAL] Workspaces error:", workspacesError);
    }

    console.log("[STRIPE PORTAL] Found workspaces:", workspaces?.length || 0);

    // Find the workspace with stripe_customer_id (usually the first/default one)
    if (workspaces && workspaces.length > 0) {
      const workspaceWithCustomer = workspaces.find(
        (w) => w.stripe_customer_id !== null && w.stripe_customer_id !== ""
      );

      if (workspaceWithCustomer?.stripe_customer_id) {
        customerId = workspaceWithCustomer.stripe_customer_id;
        console.log(
          "[STRIPE PORTAL] Found customer ID in workspace:",
          workspaceWithCustomer.name,
          customerId
        );
      } else {
        console.log(
          "[STRIPE PORTAL] No workspace with stripe_customer_id found"
        );
      }
    }

    // Fallback: check profile stripe_customer_id
    if (!customerId) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("[STRIPE PORTAL] Profile error:", profileError);
      }

      if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id;
        console.log(
          "[STRIPE PORTAL] Found customer ID in profile:",
          customerId
        );
      }
    }

    if (!customerId) {
      console.error(
        "[STRIPE PORTAL] No customer ID found in any workspace or profile"
      );
      return NextResponse.json(
        { error: "No Stripe customer found. Please create a workspace first." },
        { status: 404 }
      );
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?section=account&tab=billing`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error("[API] Error creating portal session:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
