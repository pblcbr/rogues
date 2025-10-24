"use client";

import { useEffect } from "react";
import { useRegistrationStore } from "@/stores/registration";
import { StepEmail } from "./step-email";
import { StepCompany } from "./step-company";
import { StepAccount } from "./step-account";
import { StepVerification } from "./step-verification";
import { StepBrand } from "./step-brand";
import { StepRegion } from "./step-region";
import { StepVisibility } from "./step-visibility";
import { StepTopics } from "./step-topics";
import { StepPricing } from "./step-pricing";
import { StepPayment } from "./step-payment";
import { StepWelcome } from "./step-welcome";

/**
 * Registration Wizard - Main orchestrator component
 * Manages the 11-step registration flow
 *
 * MVP: Step 4 (Email Verification) is currently skipped
 * The flow goes: 1→2→3→5→6→7→8→9→10→11 (Step 4 bypassed)
 */
export function RegistrationWizard() {
  const { currentStep, email, userId, setStep } = useRegistrationStore();

  // Reset to step 1 if user is in advanced steps without required data
  useEffect(() => {
    // If user is in step 5+ (prompts, pricing, payment, welcome) but has no userId, reset
    if (currentStep >= 5 && !userId) {
      console.log("No userId found, resetting to step 1");
      setStep(1);
    }
    // If user is in step 2+ but has no email, reset
    else if (currentStep >= 2 && !email) {
      console.log("No email found, resetting to step 1");
      setStep(1);
    }
  }, [currentStep, email, userId, setStep]);

  const renderStep = () => {
    // Validate that user has required data for current step
    // If not, force back to step 1 (avoids stuck states from localStorage)
    if (currentStep >= 5 && !userId) {
      console.warn("Step 5+ requires userId, redirecting to step 1");
      return <StepEmail />;
    }
    if (currentStep >= 2 && !email) {
      console.warn("Step 2+ requires email, redirecting to step 1");
      return <StepEmail />;
    }

    switch (currentStep) {
      case 1:
        return <StepEmail />;
      case 2:
        return <StepCompany />;
      case 3:
        return <StepAccount />;
      case 4:
        // MVP: Email verification disabled - users skip this step
        // To re-enable: Just return <StepVerification /> and update step-account.tsx
        return <StepVerification />; // Kept in case someone accesses directly
      case 5:
        return <StepBrand />;
      case 6:
        return <StepRegion />;
      case 7:
        return <StepVisibility />;
      case 8:
        return <StepTopics />;
      case 9:
        return <StepPricing />;
      case 10:
        return <StepPayment />;
      case 11:
        return <StepWelcome />;
      default:
        return <StepEmail />;
    }
  };

  return (
    <div className="w-full">
      {/* Logo */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Rogues</h2>
      </div>

      {/* Current Step */}
      {renderStep()}
    </div>
  );
}
