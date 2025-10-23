"use client";

import { useState } from "react";
import { useRegistrationStore } from "@/stores/registration";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "../progress-indicator";
import { getPlanById } from "@/lib/stripe/plans";

/**
 * Step 7: Payment
 * Stripe checkout integration
 */
export function StepPayment() {
  const { selectedPlan, email, nextStep } = useRegistrationStore();
  const [isLoading, setIsLoading] = useState(false);

  const plan = getPlanById(selectedPlan || "growth");

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // Create Stripe checkout session
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan,
          email,
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Redirect to Stripe Checkout
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  // If plan has free trial, skip payment
  if (plan?.trialDays && plan.trialDays > 0) {
    // Auto-proceed to welcome
    setTimeout(() => nextStep(), 100);
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p>Setting up your trial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={7} totalSteps={8} />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Complete your purchase
        </h1>
        <p className="text-muted-foreground">
          Secure payment powered by Stripe
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-semibold">{plan?.name} Plan</span>
          <span className="text-2xl font-bold">${plan?.price}/month</span>
        </div>

        <div className="space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${plan?.price}.00</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total today</span>
            <span>${plan?.price}.00</span>
          </div>
        </div>
      </div>

      <Button onClick={handlePayment} className="w-full" disabled={isLoading}>
        {isLoading ? "Processing..." : "Proceed to Payment"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
