"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";

interface ProfileBillingTabProps {
  profile: {
    stripe_customer_id?: string | null;
  } | null;
}

/**
 * Profile Billing Tab
 * Manage subscription and payment methods (account-level)
 */
export function ProfileBillingTab({ profile }: ProfileBillingTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { error: showError } = useToast();

  const stripeCustomerId = profile?.stripe_customer_id || null;

  const handleManageBilling = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create portal session");
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      showError(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to open billing portal. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stripe Customer Portal */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h4 className="text-base font-semibold text-gray-900">
            Payment & Subscription Management
          </h4>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Access the Customer Portal to manage your payment method, view billing
          history, download invoices, and update your subscription.
        </p>

        <Button
          onClick={handleManageBilling}
          disabled={isLoading || !stripeCustomerId}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Opening Portal...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-5 w-5" />
              Open Customer Portal
            </>
          )}
        </Button>

        {!stripeCustomerId && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> No billing account found. Create a
              workspace to set up billing.
            </p>
          </div>
        )}
      </div>

      {/* Information */}
    </div>
  );
}
