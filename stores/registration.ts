import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeneratedTopic } from "@/lib/openai/topic-generator";
import type { VisibilityAnalysis } from "@/lib/openai/visibility-analyzer";

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

  // Step 4: Verification (MVP: disabled)
  isEmailVerified: boolean;
  userId: string | null;

  // Step 5: Brand Information
  brandWebsite: string | null;
  brandDescription: string | null;

  // Step 6: Region & Language
  region: string | null;
  language: string | null;

  // Step 7: Visibility Analysis
  visibilityAnalysis: VisibilityAnalysis | null;
  isAnalyzingVisibility: boolean;

  // Step 8: Topics
  generatedTopics: GeneratedTopic[];
  selectedTopics: string[];
  customTopics: string[];
  isGeneratingTopics: boolean;

  // Step 9: Plan
  selectedPlan: string | null;

  // Step 10: Payment
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;

  // Actions
  setStep: (step: number) => void;
  setEmail: (email: string) => void;
  setCompanyInfo: (size: string, isAgency: boolean) => void;
  setAccountInfo: (firstName: string, lastName: string) => void;
  setBrandInfo: (website: string, description: string) => void;
  setRegionLanguage: (region: string, language: string) => void;
  setVisibilityAnalysis: (analysis: VisibilityAnalysis) => void;
  setAnalyzingVisibility: (isAnalyzing: boolean) => void;
  setEmailVerified: (userId: string) => void;
  setGeneratedTopics: (topics: GeneratedTopic[]) => void;
  setSelectedTopics: (topics: string[]) => void;
  addCustomTopic: (topic: string) => void;
  removeCustomTopic: (topic: string) => void;
  setGeneratingTopics: (isGenerating: boolean) => void;
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
  brandWebsite: null,
  brandDescription: null,
  region: null,
  language: null,
  isEmailVerified: false,
  userId: null,
  visibilityAnalysis: null,
  isAnalyzingVisibility: false,
  generatedTopics: [],
  selectedTopics: [],
  customTopics: [],
  isGeneratingTopics: false,
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

      setBrandInfo: (website, description) =>
        set({ brandWebsite: website, brandDescription: description }),

      setRegionLanguage: (region, language) => set({ region, language }),

      setVisibilityAnalysis: (analysis) =>
        set({ visibilityAnalysis: analysis }),

      setAnalyzingVisibility: (isAnalyzing) =>
        set({ isAnalyzingVisibility: isAnalyzing }),

      setEmailVerified: (userId) => set({ isEmailVerified: true, userId }),

      setGeneratedTopics: (topics) => set({ generatedTopics: topics }),

      setSelectedTopics: (topics) => set({ selectedTopics: topics }),

      addCustomTopic: (topic) =>
        set((state) => ({
          customTopics: [...state.customTopics, topic],
        })),

      removeCustomTopic: (topic) =>
        set((state) => ({
          customTopics: state.customTopics.filter((t) => t !== topic),
        })),

      setGeneratingTopics: (isGenerating) =>
        set({ isGeneratingTopics: isGenerating }),

      setSelectedPlan: (plan) => set({ selectedPlan: plan }),

      setStripeInfo: (customerId, subscriptionId) =>
        set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 11),
        })),

      previousStep: () =>
        set((state) => {
          // Don't allow going back after email verification (step 4)
          // This prevents users from getting stuck or re-doing auth steps
          if (state.isEmailVerified && state.currentStep <= 8) {
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
        brandWebsite: state.brandWebsite,
        brandDescription: state.brandDescription,
        region: state.region,
        language: state.language,
        generatedTopics: state.generatedTopics,
        selectedTopics: state.selectedTopics,
        customTopics: state.customTopics,
        selectedPlan: state.selectedPlan,
      }),
    }
  )
);
