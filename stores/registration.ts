import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeneratedPrompt } from "@/lib/openai/prompt-generator";

/**
 * Registration flow state management
 * Persists data across page reloads during registration
 */

export interface RegistrationState {
  // Current step (1-8)
  currentStep: number;

  // Step 1: Email
  email: string | null;

  // Step 2: Company info
  companySize: string | null;
  isAgency: boolean;

  // Step 3: Account (password not stored in state for security)
  firstName: string | null;
  lastName: string | null;

  // Step 4: Verification
  isEmailVerified: boolean;
  userId: string | null;

  // Step 5: Prompts
  generatedPrompts: GeneratedPrompt[];
  selectedPrompts: string[];
  customPrompts: string[];
  isGeneratingPrompts: boolean;

  // Step 6: Plan
  selectedPlan: string | null;

  // Step 7: Payment
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;

  // Actions
  setStep: (step: number) => void;
  setEmail: (email: string) => void;
  setCompanyInfo: (size: string, isAgency: boolean) => void;
  setAccountInfo: (firstName: string, lastName: string) => void;
  setEmailVerified: (userId: string) => void;
  setGeneratedPrompts: (prompts: GeneratedPrompt[]) => void;
  setSelectedPrompts: (prompts: string[]) => void;
  addCustomPrompt: (prompt: string) => void;
  removeCustomPrompt: (prompt: string) => void;
  setGeneratingPrompts: (isGenerating: boolean) => void;
  setSelectedPlan: (plan: string) => void;
  setStripeInfo: (customerId: string, subscriptionId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1,
  email: null,
  companySize: null,
  isAgency: false,
  firstName: null,
  lastName: null,
  isEmailVerified: false,
  userId: null,
  generatedPrompts: [],
  selectedPrompts: [],
  customPrompts: [],
  isGeneratingPrompts: false,
  selectedPlan: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      setEmail: (email) => set({ email }),

      setCompanyInfo: (size, isAgency) => set({ companySize: size, isAgency }),

      setAccountInfo: (firstName, lastName) => set({ firstName, lastName }),

      setEmailVerified: (userId) => set({ isEmailVerified: true, userId }),

      setGeneratedPrompts: (prompts) => set({ generatedPrompts: prompts }),

      setSelectedPrompts: (prompts) => set({ selectedPrompts: prompts }),

      addCustomPrompt: (prompt) =>
        set((state) => ({
          customPrompts: [...state.customPrompts, prompt],
        })),

      removeCustomPrompt: (prompt) =>
        set((state) => ({
          customPrompts: state.customPrompts.filter((p) => p !== prompt),
        })),

      setGeneratingPrompts: (isGenerating) =>
        set({ isGeneratingPrompts: isGenerating }),

      setSelectedPlan: (plan) => set({ selectedPlan: plan }),

      setStripeInfo: (customerId, subscriptionId) =>
        set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 8),
        })),

      previousStep: () =>
        set((state) => {
          // Don't allow going back after email verification (step 4)
          // This prevents users from getting stuck or re-doing auth steps
          if (state.isEmailVerified && state.currentStep <= 5) {
            console.warn("Cannot go back after email verification");
            return state;
          }
          return {
            currentStep: Math.max(state.currentStep - 1, 1),
          };
        }),

      reset: () => set(initialState),
    }),
    {
      name: "rogues-registration",
      partialize: (state) => ({
        // Don't persist sensitive data
        currentStep: state.currentStep,
        email: state.email,
        companySize: state.companySize,
        isAgency: state.isAgency,
        firstName: state.firstName,
        lastName: state.lastName,
        generatedPrompts: state.generatedPrompts,
        selectedPrompts: state.selectedPrompts,
        customPrompts: state.customPrompts,
        selectedPlan: state.selectedPlan,
      }),
    }
  )
);
