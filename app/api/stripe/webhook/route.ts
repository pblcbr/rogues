import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Create Supabase client with service_role for webhooks (bypasses RLS)
const createServiceClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role has full access
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events (payment success, subscription changes, etc.)
 */
export async function POST(request: NextRequest) {
  console.log("\n" + "=".repeat(70));
  console.log("[STRIPE WEBHOOK] Received event");
  console.log("=".repeat(70));

  try {
    const body = await request.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      console.error("[STRIPE WEBHOOK] ❌ No signature found");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("[STRIPE WEBHOOK] ✓ Signature verified");
      console.log("[STRIPE WEBHOOK] Event type:", event.type);
      console.log("[STRIPE WEBHOOK] Event ID:", event.id);
    } catch (err) {
      console.error("[STRIPE WEBHOOK] ❌ Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Use service role client to bypass RLS (webhooks aren't authenticated as users)
    const supabase = createServiceClient();

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("[STRIPE WEBHOOK] 💳 Checkout session completed");
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("[STRIPE WEBHOOK] Session details:", {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          clientReferenceId: session.client_reference_id,
          metadata: session.metadata,
        });

        const userId = session.client_reference_id || session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId) {
          console.error("[STRIPE WEBHOOK] ❌ No userId in session");
          return NextResponse.json(
            { error: "No userId in session" },
            { status: 400 }
          );
        }

        console.log("[STRIPE WEBHOOK] Creating workspace for user:", userId);
        console.log("[STRIPE WEBHOOK] Plan:", planId);

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError || !profile) {
          console.error("[STRIPE WEBHOOK] ❌ Profile not found:", profileError);
          return NextResponse.json(
            { error: "Profile not found" },
            { status: 404 }
          );
        }

        console.log("[STRIPE WEBHOOK] ✓ Profile found:", profile.email);

        // Create workspace
        const { data: workspace, error: workspaceError } = await supabase
          .from("workspaces")
          .insert({
            name: `${profile.first_name}'s Workspace`,
            domain: profile.company_domain,
            owner_id: userId,
            plan: planId || "growth",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .select()
          .single();

        if (workspaceError) {
          console.error(
            "[STRIPE WEBHOOK] ❌ Workspace creation failed:",
            workspaceError
          );
          return NextResponse.json(
            { error: "Failed to create workspace" },
            { status: 500 }
          );
        }

        console.log("[STRIPE WEBHOOK] ✓ Workspace created:", workspace.id);

        // Update profile with workspace_id
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            workspace_id: workspace.id,
            onboarding_completed: true,
          })
          .eq("id", userId);

        if (updateError) {
          console.error(
            "[STRIPE WEBHOOK] ⚠️ Failed to update profile:",
            updateError
          );
          // Don't fail the webhook, workspace is created
        } else {
          console.log("[STRIPE WEBHOOK] ✓ Profile updated with workspace_id");
        }

        // Note: Topics will be saved by the frontend after payment-processing page
        // via /api/workspace/initialize endpoint, which has access to Zustand store
        console.log(
          "[STRIPE WEBHOOK] ℹ️ Topics will be saved by frontend after redirect"
        );

        console.log(
          "[STRIPE WEBHOOK] ✅ Checkout completed successfully for user:",
          userId
        );
        break;
      }

      case "customer.subscription.updated": {
        console.log("[STRIPE WEBHOOK] 🔄 Subscription updated");
        const subscription = event.data.object as Stripe.Subscription;

        // Update workspace plan if subscription changed
        const { error } = await supabase
          .from("workspaces")
          .update({
            plan: subscription.metadata?.planId || "growth",
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error(
            "[STRIPE WEBHOOK] ❌ Failed to update workspace:",
            error
          );
        } else {
          console.log("[STRIPE WEBHOOK] ✓ Workspace plan updated");
        }
        break;
      }

      case "customer.subscription.deleted": {
        console.log("[STRIPE WEBHOOK] ❌ Subscription canceled");
        const subscription = event.data.object as Stripe.Subscription;

        // Mark workspace as inactive or downgrade to free tier
        const { error } = await supabase
          .from("workspaces")
          .update({
            plan: "free", // or set active: false
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error(
            "[STRIPE WEBHOOK] ❌ Failed to update workspace:",
            error
          );
        } else {
          console.log("[STRIPE WEBHOOK] ✓ Workspace downgraded");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        console.log("[STRIPE WEBHOOK] ✅ Payment succeeded");
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[STRIPE WEBHOOK] Invoice ID:", invoice.id);
        console.log("[STRIPE WEBHOOK] Amount:", invoice.amount_paid / 100);
        // You can log this to a payments table if needed
        break;
      }

      case "invoice.payment_failed": {
        console.log("[STRIPE WEBHOOK] ⚠️ Payment failed");
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[STRIPE WEBHOOK] Invoice ID:", invoice.id);
        // You can send a notification email to the user
        break;
      }

      default:
        console.log("[STRIPE WEBHOOK] ℹ️ Unhandled event type:", event.type);
    }

    console.log("=".repeat(70));
    console.log("[STRIPE WEBHOOK] Event processed successfully");
    console.log("=".repeat(70) + "\n");

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("=".repeat(70));
    console.error("[STRIPE WEBHOOK] 💥 Unexpected error:", error);
    console.error("=".repeat(70) + "\n");

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
