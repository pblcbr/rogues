"use client";

import { useState } from "react";
import { useRegistrationStore } from "@/stores/registration";
import { Button } from "@/components/ui/button";
import { PLANS, getPlanById } from "@/lib/stripe/plans";
import { Check, X, Sparkles } from "lucide-react";

/**
 * Step 6: Plan Selection
 * Full-screen modal with unique pricing design
 */
export function StepPricing() {
  const {
    email,
    brandWebsite,
    brandDescription,
    region,
    language,
    visibilityAnalysis,
    generatedTopics,
    selectedTopics,
    customTopics,
    setSelectedPlan,
    nextStep,
    previousStep,
  } = useRegistrationStore();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [isLoading, setIsLoading] = useState(false);

  // Get the correct plan IDs based on billing interval
  const getActivePlanId = (basePlan: "starter" | "growth") => {
    return billingInterval === "yearly" ? `${basePlan}-yearly` : basePlan;
  };

  const starterPlan = getPlanById(getActivePlanId("starter"));
  const growthPlan = getPlanById(getActivePlanId("growth"));

  const handleSelectPlan = async (
    basePlan: "starter" | "growth" | "enterprise"
  ) => {
    const planId =
      basePlan === "enterprise" ? "enterprise" : getActivePlanId(basePlan);
    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      // Enterprise goes to welcome/contact page
      if (planId === "enterprise") {
        nextStep();
        nextStep(); // Skip payment step
        return;
      }

      // For Starter and Growth, go directly to Stripe
      console.log("Creating Stripe checkout session for:", planId);

      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          email,
          registrationData: {
            brandWebsite,
            brandDescription,
            region,
            language,
            visibilityAnalysis,
            generatedTopics,
            selectedTopics,
            customTopics,
          },
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Redirect to Stripe Checkout
      if (result.url) {
        console.log("Redirecting to Stripe:", result.url);
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to start checkout. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="relative h-full w-full overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl pt-12">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-5xl font-bold tracking-tight">
              Select a Plan
            </h1>
          </div>

          {/* Billing Toggle */}
          <div className="mb-12 flex justify-center">
            <div className="inline-flex rounded-xl bg-white p-1 shadow-sm dark:bg-slate-800">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`rounded-lg px-6 py-2 text-sm font-medium transition-all ${
                  billingInterval === "monthly"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`rounded-lg px-6 py-2 text-sm font-medium transition-all ${
                  billingInterval === "yearly"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Yearly{" "}
                <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                  -2 months free
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
            {/* Starter Plan */}
            <div className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200 transition-all hover:shadow-xl dark:bg-slate-800 dark:ring-slate-700">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="mb-1 text-2xl font-bold">Starter</h3>
                </div>
                {/* ChatGPT icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                  <svg
                    className="h-7 w-7"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 004.981 4.18a5.985 5.985 0 00-3.998 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.26 24a6.056 6.056 0 005.772-4.206 5.99 5.99 0 003.997-2.9 6.056 6.056 0 00-.747-7.073zM13.26 22.43a4.476 4.476 0 01-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 00.392-.681v-6.737l2.02 1.168a.071.071 0 01.038.052v5.583a4.504 4.504 0 01-4.494 4.494zM3.6 18.304a4.47 4.47 0 01-.535-3.014l.142.085 4.783 2.759a.771.771 0 00.78 0l5.843-3.369v2.332a.08.08 0 01-.033.062L9.74 19.95a4.5 4.5 0 01-6.14-1.646zM2.34 7.896a4.485 4.485 0 012.366-1.973V11.6a.766.766 0 00.388.676l5.815 3.355-2.02 1.168a.076.076 0 01-.071 0l-4.83-2.786A4.504 4.504 0 012.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 01.071 0l4.83 2.791a4.494 4.494 0 01-.676 8.105v-5.678a.79.79 0 00-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 00-.785 0L9.409 9.23V6.897a.066.066 0 01.028-.061l4.83-2.787a4.5 4.5 0 016.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 01-.038-.057V6.075a4.5 4.5 0 017.375-3.453l-.142.08L8.704 5.46a.795.795 0 00-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
                  </svg>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight">
                    ${starterPlan?.price}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    /{billingInterval === "yearly" ? "year" : "month"}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  For small companies who want to monitor their brand&apos;s
                  visibility.
                </p>
              </div>

              <Button
                onClick={() => handleSelectPlan("starter")}
                variant="outline"
                size="lg"
                className="mb-8 w-full border-2"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Purchase Plan"}
              </Button>

              <ul className="space-y-3">
                {starterPlan?.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth Plan - Popular */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 shadow-xl ring-2 ring-blue-200 transition-all hover:shadow-2xl dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 dark:ring-blue-800">
              {/* Popular badge */}
              <div className="absolute right-0 top-0 rounded-bl-2xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                Popular
              </div>

              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="mb-1 text-2xl font-bold">Growth</h3>
                </div>
                {/* Multiple engine icons */}
                <div className="flex -space-x-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-2 ring-white dark:bg-slate-800 dark:ring-slate-800">
                    <svg
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 004.981 4.18a5.985 5.985 0 00-3.998 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.26 24a6.056 6.056 0 005.772-4.206 5.99 5.99 0 003.997-2.9 6.056 6.056 0 00-.747-7.073zM13.26 22.43a4.476 4.476 0 01-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 00.392-.681v-6.737l2.02 1.168a.071.071 0 01.038.052v5.583a4.504 4.504 0 01-4.494 4.494zM3.6 18.304a4.47 4.47 0 01-.535-3.014l.142.085 4.783 2.759a.771.771 0 00.78 0l5.843-3.369v2.332a.08.08 0 01-.033.062L9.74 19.95a4.5 4.5 0 01-6.14-1.646zM2.34 7.896a4.485 4.485 0 012.366-1.973V11.6a.766.766 0 00.388.676l5.815 3.355-2.02 1.168a.076.076 0 01-.071 0l-4.83-2.786A4.504 4.504 0 012.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 01.071 0l4.83 2.791a4.494 4.494 0 01-.676 8.105v-5.678a.79.79 0 00-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 00-.785 0L9.409 9.23V6.897a.066.066 0 01.028-.061l4.83-2.787a4.5 4.5 0 016.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 01-.038-.057V6.075a4.5 4.5 0 017.375-3.453l-.142.08L8.704 5.46a.795.795 0 00-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
                    </svg>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-2 ring-white dark:bg-slate-800 dark:ring-slate-800">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-2 ring-white dark:bg-slate-800 dark:ring-slate-800">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.696 14.943c-4.103 4.103-11.433 2.794-11.433 2.794S4.954 10.407 9.057 6.304c2.281-2.281 6.061-2.187 8.45.202s2.483 6.169.189 8.437z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight">
                    ${growthPlan?.price}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    /{billingInterval === "yearly" ? "year" : "month"}
                  </span>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300">
                  For growing companies who want to monitor visibility and
                  create AEO optimized content
                </p>
              </div>

              <Button
                onClick={() => handleSelectPlan("growth")}
                size="lg"
                className="mb-8 w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                disabled={isLoading}
              >
                {isLoading
                  ? "Redirecting to checkout..."
                  : "Try Free for 7 Days"}
              </Button>

              <ul className="space-y-3">
                {growthPlan?.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Enterprise CTA */}
          <div className="mx-auto mt-8 max-w-5xl text-center">
            <button
              onClick={() => handleSelectPlan("enterprise")}
              className="text-sm text-slate-600 underline decoration-dotted underline-offset-4 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Need Enterprise? Contact us →
            </button>
          </div>

          {/* Log out link - bottom left */}
          <div className="absolute bottom-8 left-8">
            <button
              onClick={() => {
                /* handle logout */
              }}
              className="text-sm text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
