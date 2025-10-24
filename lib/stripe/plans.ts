/**
 * Stripe pricing plans configuration
 * These match the plans shown in the registration flow
 */

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  stripePriceId?: string; // Will be added after creating in Stripe dashboard
  features: string[];
  limits: {
    prompts: number;
    engines: number;
    seats: number;
    articles?: number;
  };
  popular?: boolean;
  trialDays?: number;
}

export const PLANS: Record<string, PricingPlan> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 99,
    interval: "month",
    stripePriceId: "price_1SLSzGLlfnJ045i4EQxm8k8X",
    features: ["50 unique prompts", "1 answer engine — ChatGPT", "1 seat"],
    limits: {
      prompts: 50,
      engines: 1,
      seats: 1,
    },
    trialDays: 0, // No trial for Starter
  },
  "starter-yearly": {
    id: "starter-yearly",
    name: "Starter",
    price: 990, // $99 x 10 (2 months free)
    interval: "year",
    stripePriceId: "price_1SLhORLlfnJ045i4nZIKOWkS",
    features: ["50 unique prompts", "1 answer engine — ChatGPT", "1 seat"],
    limits: {
      prompts: 50,
      engines: 1,
      seats: 1,
    },
    trialDays: 0,
  },
  growth: {
    id: "growth",
    name: "Growth",
    price: 399,
    interval: "month",
    stripePriceId: "price_1SLSzULlfnJ045i472fRK92l",
    features: [
      "100 unique prompts",
      "3 answer engines — ChatGPT, Perplexity, Google AI",
      "3 seats",
      "6 optimized articles per month",
    ],
    limits: {
      prompts: 100,
      engines: 3,
      seats: 3,
      articles: 6,
    },
    popular: true,
    trialDays: 7,
  },
  "growth-yearly": {
    id: "growth-yearly",
    name: "Growth",
    price: 3990, // $399 x 10 (2 months free)
    interval: "year",
    stripePriceId: "price_1SLhOsLlfnJ045i4vMz8eD0E",
    features: [
      "100 unique prompts",
      "3 answer engines — ChatGPT, Perplexity, Google AI",
      "3 seats",
      "6 optimized articles per month",
    ],
    limits: {
      prompts: 100,
      engines: 3,
      seats: 3,
      articles: 6,
    },
    popular: true,
    trialDays: 7,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 0, // Custom pricing
    interval: "month",
    features: [
      "Unlimited prompts",
      "All answer engines",
      "Unlimited seats",
      "Unlimited optimized articles",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    limits: {
      prompts: -1, // -1 = unlimited
      engines: -1,
      seats: -1,
      articles: -1,
    },
    trialDays: 14,
  },
};

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): PricingPlan | undefined {
  return PLANS[planId];
}

/**
 * Calculate trial end date
 */
export function calculateTrialEnd(planId: string): Date | null {
  const plan = getPlanById(planId);
  if (!plan || !plan.trialDays) return null;

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + plan.trialDays);
  return trialEnd;
}
