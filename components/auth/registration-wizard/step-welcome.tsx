"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRegistrationStore } from "@/stores/registration";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

/**
 * Step 8: Welcome
 * Final step showing success and onboarding checklist
 */
export function StepWelcome() {
  const { firstName, reset } = useRegistrationStore();
  const router = useRouter();

  // ===== MVP: WORKSPACE INITIALIZATION DISABLED =====
  // Workspace should ONLY be created after successful payment via Stripe webhook
  // Do NOT create workspace without payment verification

  // useEffect(() => {
  //   // Create workspace and initialize prompts in background
  //   initializeWorkspace();
  // }, []);

  // const initializeWorkspace = async () => {
  //   try {
  //     await fetch("/api/workspace/initialize", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //     });
  //   } catch (error) {
  //     console.error("Error initializing workspace:", error);
  //   }
  // };

  const handleContinue = () => {
    // Clear registration state
    reset();
    // Redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to Rogues{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="text-muted-foreground">
          Your account has been created successfully
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-6 text-left">
        <h3 className="mb-4 font-semibold">Getting Started with AEO</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full border-2 border-muted-foreground" />
            <span className="text-muted-foreground">
              Watch a product overview
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full border-2 border-muted-foreground" />
            <span className="text-muted-foreground">
              Review your visibility scores
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full border-2 border-muted-foreground" />
            <span className="text-muted-foreground">
              Review top page citations
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full border-2 border-muted-foreground" />
            <span className="text-muted-foreground">
              Create content to improve visibility
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full border-2 border-muted-foreground" />
            <span className="text-muted-foreground">Activate monitoring</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full border-2 border-muted-foreground" />
            <span className="text-muted-foreground">Set up team access</span>
          </div>
        </div>
      </div>

      <Button onClick={handleContinue} className="w-full" size="lg">
        Go to Dashboard
      </Button>
    </div>
  );
}
