"use client";

import { useState } from "react";
import { useRegistrationStore } from "@/stores/registration";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "../progress-indicator";
import { PLANS, getPlanById } from "@/lib/stripe/plans";
import { Check } from "lucide-react";

/**
 * Step 6: Plan Selection
 * Displays pricing tiers and allows plan selection
 */
export function StepPricing() {
  const { setSelectedPlan, nextStep } = useRegistrationStore();
  const [selectedPlan, setLocalSelectedPlan] = useState<string>("growth");

  const handleSelectPlan = (planId: string) => {
    setLocalSelectedPlan(planId);
    setSelectedPlan(planId);

    // If plan has trial or is enterprise, go to next step
    // If Starter (no trial), go to payment
    const plan = getPlanById(planId);
    if (plan?.trialDays && plan.trialDays > 0) {
      // Has trial - skip payment for now
      nextStep();
    } else if (planId === "enterprise") {
      // Enterprise - contact sales
      nextStep();
    } else {
      // Starter - needs payment
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={6} totalSteps={8} />

      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Select a Plan</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Starter Plan */}
        <div className="rounded-lg border-2 border-border bg-background p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Starter</h3>
            <div className="mt-2">
              <span className="text-4xl font-bold">${PLANS.starter.price}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              For small companies who want to monitor their brand&apos;s
              visibility
            </p>
          </div>

          <Button
            onClick={() => handleSelectPlan("starter")}
            variant={selectedPlan === "starter" ? "default" : "outline"}
            className="mb-4 w-full"
          >
            Purchase Plan
          </Button>

          <ul className="space-y-3">
            {PLANS.starter.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Growth Plan (Popular) */}
        <div className="relative rounded-lg border-2 border-primary bg-background p-6 shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Popular
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-semibold">Growth</h3>
            <div className="mt-2">
              <span className="text-4xl font-bold">${PLANS.growth.price}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              For growing companies who want to monitor visibility and create
              AEO optimized content
            </p>
          </div>

          <Button
            onClick={() => handleSelectPlan("growth")}
            className="mb-4 w-full"
          >
            Try Free for 7 Days
          </Button>

          <ul className="space-y-3">
            {PLANS.growth.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            /* Handle enterprise contact */
          }}
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
        >
          Need Enterprise? Contact us →
        </button>
      </div>
    </div>
  );
}
