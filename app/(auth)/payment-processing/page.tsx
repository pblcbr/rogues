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
  const [isHydrated, setIsHydrated] = useState(false);

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

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Don't run until store is hydrated
    if (!isHydrated) return;

    const createWorkspace = async () => {
      if (!sessionId) {
        console.error("❌ No session ID");
        router.push("/register?step=6&error=no_session");
        return;
      }

      try {
        // Get plan from registration store or default to growth
        const planId =
          (sessionStorage.getItem("selected_plan") as string) || "growth";

        console.log("🚀 Creating workspace with session:", sessionId);

        // Try to get registration data from sessionStorage as fallback
        let registrationData = null;
        try {
          const storedData = sessionStorage.getItem("registration_data");
          if (storedData) {
            registrationData = JSON.parse(storedData);
            console.log(
              "📦 Registration data from sessionStorage:",
              registrationData
            );
          }
        } catch (e) {
          console.log("No registration data in sessionStorage");
        }

        console.log("📦 Registration data from store:", {
          brandWebsite,
          brandDescription,
          region,
          language,
          hasVisibilityAnalysis: !!visibilityAnalysis,
          hasGeneratedTopics: !!generatedTopics,
          hasSelectedTopics: !!selectedTopics,
        });

        // Use sessionStorage data as fallback if store data is missing
        const finalBrandWebsite =
          brandWebsite || registrationData?.brandWebsite;
        const finalBrandDescription =
          brandDescription || registrationData?.brandDescription;
        const finalRegion = region || registrationData?.region;
        const finalLanguage = language || registrationData?.language;
        const finalVisibilityAnalysis =
          visibilityAnalysis || registrationData?.visibilityAnalysis;
        const finalGeneratedTopics =
          generatedTopics || registrationData?.generatedTopics;
        const finalSelectedTopics =
          selectedTopics || registrationData?.selectedTopics;
        const finalCustomTopics =
          customTopics || registrationData?.customTopics;

        // Create workspace immediately (don't wait for webhook)
        const response = await fetch("/api/workspace/create-from-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            planId,
            region: finalRegion,
            language: finalLanguage,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("❌ Failed to create workspace:", data);
          // Still redirect to dashboard - webhook may have created it
          router.push("/dashboard");
          return;
        }

        console.log("✅ Workspace created:", data.workspaceId);

        // Now initialize with registration data
        try {
          console.log("📝 Sending registration data to initialize:", {
            workspaceId: data.workspaceId,
            finalBrandWebsite,
            finalBrandDescription,
            finalRegion,
            finalLanguage,
          });

          const initResponse = await fetch("/api/workspace/initialize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceId: data.workspaceId,
              brandWebsite: finalBrandWebsite,
              brandDescription: finalBrandDescription,
              region: finalRegion,
              language: finalLanguage,
              visibilityAnalysis: finalVisibilityAnalysis,
              generatedTopics: finalGeneratedTopics,
              selectedTopics: finalSelectedTopics,
              customTopics: finalCustomTopics,
            }),
          });

          const initResult = await initResponse.json();

          if (initResponse.ok) {
            console.log("✅ Registration data saved:", initResult);
          } else {
            console.error("⚠️ Failed to save registration data:", initResult);
          }
        } catch (e) {
          console.error("❌ Error saving registration data:", e);
        }

        // Clear registration data and redirect
        resetRegistration();
        router.push("/dashboard?payment=success");
      } catch (error) {
        console.error("❌ Error creating workspace:", error);
        // Redirect to dashboard anyway
        router.push("/dashboard");
      }
    };

    // Wait 1 second for Stripe to finalize the payment
    setTimeout(createWorkspace, 1000);
  }, [
    isHydrated,
    router,
    sessionId,
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
