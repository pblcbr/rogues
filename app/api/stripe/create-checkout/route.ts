import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { getPlanById } from "@/lib/stripe/plans";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/stripe/create-checkout
 * Creates a Stripe Checkout session for plan subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, email } = body;

    if (!planId || !email) {
      return NextResponse.json(
        { error: "Plan ID and email are required" },
        { status: 400 }
      );
    }

    const plan = getPlanById(planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!plan.stripePriceId) {
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
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Create Stripe Checkout Session using the real Price ID
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
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
            }
          : undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?step=8&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?step=6`,
      metadata: {
        userId: user.id,
        planId,
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Checkout creation error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
