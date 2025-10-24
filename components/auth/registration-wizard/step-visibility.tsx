"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRegistrationStore } from "@/stores/registration";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "../progress-indicator";
import { Loader2 } from "lucide-react";
import type { VisibilityAnalysis } from "@/lib/openai/visibility-analyzer";
import { createPortal } from "react-dom";

/**
 * Step 7: AI Visibility Analysis
 * Shows brand ranking vs competitors in AI search engines
 */
export function StepVisibility() {
  const {
    brandWebsite,
    brandDescription,
    region,
    language,
    visibilityAnalysis,
    isAnalyzingVisibility,
    setVisibilityAnalysis,
    setAnalyzingVisibility,
    nextStep,
  } = useRegistrationStore();

  const [error, setError] = useState<string | null>(null);
  const [rightPanelMounted, setRightPanelMounted] = useState(false);

  const brandName = brandWebsite?.split(".")[0] || "Your brand";
  const capitalizedBrand =
    brandName.charAt(0).toUpperCase() + brandName.slice(1);

  const analyzeVisibility = useCallback(async () => {
    console.log("🔍 [Frontend] Starting visibility analysis...");
    console.log("🔍 [Frontend] Brand Website:", brandWebsite);

    setAnalyzingVisibility(true);
    setError(null);

    try {
      const domain = brandWebsite || "";

      if (!domain) {
        console.error("🔍 [Frontend] ❌ No domain provided");
        throw new Error("Could not get domain from brand website");
      }

      console.log("🔍 [Frontend] Calling API /api/visibility/analyze...");

      const response = await fetch("/api/visibility/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          brandDescription,
          region: region || "Global",
          language: language || "English (en)",
        }),
      });

      console.log("🔍 [Frontend] API response status:", response.status);
      const result = await response.json();
      console.log("🔍 [Frontend] API response body:", result);

      if (result.error) {
        throw new Error(result.error);
      }

      console.log("🔍 [Frontend] ✅ Received analysis");
      console.log("🔍 [Frontend] Client rank:", result.analysis.client_rank);

      setVisibilityAnalysis(result.analysis);
    } catch (err) {
      console.error("🔍 [Frontend] ❌ Error analyzing visibility:", err);
      setError("Failed to analyze visibility. Please try again.");
    } finally {
      setAnalyzingVisibility(false);
    }
  }, [
    brandWebsite,
    brandDescription,
    region,
    language,
    setVisibilityAnalysis,
    setAnalyzingVisibility,
  ]);

  // Auto-analyze on mount if not already done
  useEffect(() => {
    if (!visibilityAnalysis && !isAnalyzingVisibility) {
      analyzeVisibility();
    }
  }, [visibilityAnalysis, isAnalyzingVisibility, analyzeVisibility]);

  // Show right panel with white background
  useEffect(() => {
    document.body.classList.remove("hide-auth-right");
    // Add white background class for this step
    document.body.classList.add("visibility-analysis-step");
    // Set mounted after a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setRightPanelMounted(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      setRightPanelMounted(false);
      document.body.classList.remove("visibility-analysis-step");
    };
  }, []);

  const handleContinue = () => {
    if (!visibilityAnalysis) {
      setError("Please wait for the analysis to complete");
      return;
    }
    nextStep();
  };

  // Render analysis in the right panel
  const AnalysisPanel = () => {
    if (!rightPanelMounted || !visibilityAnalysis) {
      console.log("AnalysisPanel not rendering:", {
        rightPanelMounted,
        hasAnalysis: !!visibilityAnalysis,
      });
      return null;
    }

    const rightPanel = document.querySelector(".auth-right");
    if (!rightPanel) {
      console.log("Right panel not found in DOM");
      return null;
    }

    console.log("Rendering AnalysisPanel with portal");
    return createPortal(
      <div className="visibility-analysis-content absolute inset-0 z-50 flex h-full flex-col items-center justify-center bg-white p-8">
        <div className="w-full max-w-lg space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="mb-4 flex items-center justify-center gap-2"></div>
          </div>

          {/* Competitors Ranking */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              AI Search Visibility Ranking
            </h3>
            <div className="space-y-2">
              {visibilityAnalysis.competitors.map((competitor) => {
                const isClient = competitor.domain === brandWebsite;
                return (
                  <div
                    key={competitor.rank}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      isClient
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold ${
                          competitor.rank === 1
                            ? "bg-yellow-500/20 text-yellow-700"
                            : competitor.rank <= 3
                              ? "bg-muted text-muted-foreground"
                              : "bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        #{competitor.rank}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-medium ${isClient ? "text-primary" : "text-foreground"}`}
                        >
                          {competitor.name}
                          {isClient && (
                            <span className="ml-2 text-xs font-normal text-primary">
                              (You)
                            </span>
                          )}
                        </p>
                        {competitor.domain && (
                          <p className="text-xs text-muted-foreground">
                            {competitor.domain}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>,
      rightPanel
    );
  };

  // Loading state
  if (isAnalyzingVisibility) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium">Analyzing AI visibility...</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Comparing your brand with competitors
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !visibilityAnalysis) {
    return (
      <div className="space-y-6">
        <ProgressIndicator currentStep={7} totalSteps={11} />

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-destructive">
            Analysis Error
          </h1>
          <p className="text-muted-foreground">{error}</p>
        </div>

        <Button onClick={analyzeVisibility} className="w-full">
          Try Again
        </Button>
      </div>
    );
  }

  // Results state - render only if analysis is complete
  if (!visibilityAnalysis) {
    return null;
  }

  return (
    <>
      <AnalysisPanel />
      <div className="space-y-6">
        <ProgressIndicator currentStep={7} totalSteps={11} />

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            AI Visibility Analysis
          </h1>
          <p className="text-muted-foreground">
            We've analyzed how {capitalizedBrand} ranks in AI search engines
            compared to competitors.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Check the analysis on the right panel to see your current ranking
            and opportunities for improvement.
          </p>
          <Button onClick={handleContinue} className="w-full" size="lg">
            Continue
          </Button>
        </div>
      </div>
    </>
  );
}
