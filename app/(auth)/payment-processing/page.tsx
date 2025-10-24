"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Payment Processing Page
 * Shown after Stripe checkout while webhook processes
 */
export default function PaymentProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Poll for workspace creation (check every 2 seconds for up to 30 seconds)
    let attempts = 0;
    const maxAttempts = 15;

    const checkWorkspace = async () => {
      try {
        const response = await fetch("/api/user/workspace-status");
        const data = await response.json();

        if (data.hasWorkspace) {
          console.log("✅ Workspace found, redirecting to dashboard");
          router.push("/dashboard?payment=success");
        } else if (attempts >= maxAttempts) {
          console.error("⏰ Timeout waiting for workspace");
          router.push("/register?step=6&error=payment_timeout");
        } else {
          attempts++;
          console.log(
            `⏳ Waiting for workspace... (${attempts}/${maxAttempts})`
          );
          setTimeout(checkWorkspace, 2000);
        }
      } catch (error) {
        console.error("Error checking workspace:", error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkWorkspace, 2000);
        }
      }
    };

    // Start checking after 2 seconds (give webhook time to process)
    setTimeout(checkWorkspace, 2000);
  }, [router, sessionId]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <h1 className="text-2xl font-bold">Processing Payment</h1>
        <p className="text-muted-foreground">
          Please wait while we set up your account...
        </p>
        <p className="text-sm text-muted-foreground">
          This usually takes 5-10 seconds
        </p>
      </div>
    </div>
  );
}
