"use client";

import { useEffect } from "react";
import { useRegistrationStore } from "@/stores/registration";
import { StepEmail } from "./step-email";
import { StepCompany } from "./step-company";
import { StepAccount } from "./step-account";
import { StepVerification } from "./step-verification";
import { StepPrompts } from "./step-prompts";
import { StepPricing } from "./step-pricing";
import { StepPayment } from "./step-payment";
import { StepWelcome } from "./step-welcome";

/**
 * Registration Wizard - Main orchestrator component
 * Manages the 8-step registration flow
 */
export function RegistrationWizard() {
  const currentStep = useRegistrationStore((state) => state.currentStep);

  // Reset to step 1 on mount if needed
  useEffect(() => {
    // You can add logic here to restore progress from localStorage
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepEmail />;
      case 2:
        return <StepCompany />;
      case 3:
        return <StepAccount />;
      case 4:
        return <StepVerification />;
      case 5:
        return <StepPrompts />;
      case 6:
        return <StepPricing />;
      case 7:
        return <StepPayment />;
      case 8:
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
