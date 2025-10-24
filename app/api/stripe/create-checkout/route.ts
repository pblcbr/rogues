import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { getPlanById } from "@/lib/stripe/plans";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/stripe/create-checkout
 * Creates a Stripe Checkout session for plan subscription
 */
export async function POST(request: NextRequest) {
  console.log("\n" + "=".repeat(70));
  console.log("[CHECKOUT] 🛒 Creating checkout session");
  console.log("=".repeat(70));

  try {
    const body = await request.json();
    const {
      planId,
      email,
      registrationData, // All registration data from Zustand store
    } = body;

    console.log("[CHECKOUT] Plan ID:", planId);
    console.log("[CHECKOUT] Email:", email);
    console.log("[CHECKOUT] Has registration data:", !!registrationData);

    if (!planId || !email) {
      console.error("[CHECKOUT] ❌ Missing planId or email");
      return NextResponse.json(
        { error: "Plan ID and email are required" },
        { status: 400 }
      );
    }

    const plan = getPlanById(planId);
    if (!plan) {
      console.error("[CHECKOUT] ❌ Invalid plan ID:", planId);
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    console.log("[CHECKOUT] ✓ Plan found:", plan.name);
    console.log("[CHECKOUT] ✓ Stripe Price ID:", plan.stripePriceId);

    if (!plan.stripePriceId) {
      console.error("[CHECKOUT] ❌ Plan missing Stripe Price ID");
      return NextResponse.json(
        { error: "Plan does not have a Stripe Price ID configured" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("[CHECKOUT] ❌ User not authenticated");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    console.log("[CHECKOUT] ✓ User authenticated:", user.id);

    // Save registration data to profile before creating checkout
    // This ensures we have the data even if webhook fails
    if (registrationData) {
      console.log("[CHECKOUT] Saving registration data to profile...");
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          brand_website: registrationData.brandWebsite,
          brand_description: registrationData.brandDescription,
          region: registrationData.region,
          language: registrationData.language,
          visibility_analysis: registrationData.visibilityAnalysis,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error(
          "[CHECKOUT] ⚠️ Failed to save registration data:",
          updateError
        );
        // Continue anyway, we'll try again in webhook
      } else {
        console.log("[CHECKOUT] ✓ Registration data saved to profile");
      }
    }

    console.log("[CHECKOUT] Creating Stripe session...");

    // Create Stripe Checkout Session using the real Price ID
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      client_reference_id: user.id, // Also send userId here (backup)
      line_items: [
        {
          price: plan.stripePriceId, // Use the actual Stripe Price ID
          quantity: 1,
        },
      ],
      subscription_data:
        plan.trialDays && plan.trialDays > 0
          ? {
              trial_period_days: plan.trialDays,
              metadata: {
                userId: user.id,
                planId,
              },
            }
          : {
              metadata: {
                userId: user.id,
                planId,
              },
            },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-processing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?step=6&payment=cancelled`,
      metadata: {
        userId: user.id,
        planId,
        // Store registration data as JSON string (Stripe metadata has 500 char limit per key)
        // We'll store it in the database immediately after workspace creation
        hasRegistrationData: registrationData ? "true" : "false",
      },
    });

    console.log("[CHECKOUT] ✅ Stripe session created successfully");
    console.log("[CHECKOUT] Session ID:", session.id);
    console.log("[CHECKOUT] Checkout URL:", session.url);
    console.log("=".repeat(70) + "\n");

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("=".repeat(70));
    console.error("[CHECKOUT] 💥 Error creating checkout session:");
    console.error("[CHECKOUT] Error:", error);
    if (error instanceof Error) {
      console.error("[CHECKOUT] Message:", error.message);
      console.error("[CHECKOUT] Stack:", error.stack);
    }
    console.error("=".repeat(70));

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
