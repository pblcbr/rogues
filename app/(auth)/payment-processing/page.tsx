"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useRegistrationStore } from "@/stores/registration";

/**
 * Payment Processing Page
 * Shown after Stripe checkout while webhook processes
 */
export default function PaymentProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [initializationComplete, setInitializationComplete] = useState(false);

  // Get registration data from Zustand store
  const {
    brandWebsite,
    brandDescription,
    region,
    language,
    visibilityAnalysis,
    generatedTopics,
    selectedTopics,
    customTopics,
    reset: resetRegistration,
  } = useRegistrationStore();

  useEffect(() => {
    // Poll for workspace creation (check every 2 seconds for up to 30 seconds)
    let attempts = 0;
    const maxAttempts = 15;

    const checkWorkspace = async () => {
      try {
        const response = await fetch("/api/user/workspace-status");
        const data = await response.json();

        if (data.hasWorkspace && !initializationComplete) {
          console.log(
            "✅ Workspace found, initializing with registration data..."
          );

          // Save registration data to database
          try {
            const initResponse = await fetch("/api/workspace/initialize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                workspaceId: data.workspaceId,
                brandWebsite,
                brandDescription,
                region,
                language,
                visibilityAnalysis,
                generatedTopics,
                selectedTopics,
                customTopics,
              }),
            });

            if (initResponse.ok) {
              console.log("✅ Registration data saved successfully");
              setInitializationComplete(true);
              // Clear registration data from store
              resetRegistration();
              // Redirect to dashboard
              router.push("/dashboard?payment=success");
            } else {
              console.error(
                "⚠️ Failed to save registration data, but continuing..."
              );
              // Continue to dashboard anyway
              router.push("/dashboard?payment=success");
            }
          } catch (error) {
            console.error("Error saving registration data:", error);
            // Continue to dashboard anyway
            router.push("/dashboard?payment=success");
          }
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
  }, [
    router,
    sessionId,
    initializationComplete,
    brandWebsite,
    brandDescription,
    region,
    language,
    visibilityAnalysis,
    generatedTopics,
    selectedTopics,
    customTopics,
    resetRegistration,
  ]);

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
