/**
 * Application-wide constants
 */

// Available LLM providers for AEO monitoring
export const AVAILABLE_LLMS = [
  {
    id: "openai",
    name: "ChatGPT",
    provider: "OpenAI",
    model: "gpt-4o",
    icon: "https://cdn.oaistatic.com/_next/static/media/apple-touch-icon.82af6fe1.png",
    requiresApiKey: true,
    envVar: "OPENAI_API_KEY",
    comingSoon: false,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    provider: "Perplexity AI",
    model: "sonar-medium-online",
    icon: "/llm/perplexity.svg",
    requiresApiKey: true,
    envVar: "PERPLEXITY_API_KEY",
    comingSoon: false,
  },
  {
    id: "claude",
    name: "Claude",
    provider: "Anthropic",
    model: "claude-sonnet-4-20250514",
    icon: "https://www.anthropic.com/images/icons/apple-touch-icon.png",
    requiresApiKey: true,
    envVar: "ANTHROPIC_API_KEY",
    comingSoon: false,
  },
  {
    id: "gemini",
    name: "Gemini",
    provider: "Google",
    model: "gemini-pro",
    icon: "https://www.gstatic.com/lamda/images/favicon_v1_150160cddff7f294ce30.svg",
    requiresApiKey: true,
    envVar: "GOOGLE_API_KEY",
    comingSoon: true,
  },
] as const;

export type LLMProviderId = "openai" | "perplexity" | "claude" | "gemini";

/**
 * Get LLM providers that are currently available (not coming soon)
 */
export function getActiveLLMProviders() {
  return AVAILABLE_LLMS.filter((llm) => !llm.comingSoon);
}

/**
 * Get LLM configuration by ID
 */
export function getLLMById(id: LLMProviderId) {
  return AVAILABLE_LLMS.find((llm) => llm.id === id);
}

/**
 * Get available LLMs based on plan limits
 */
export function getAvailableLLMsForPlan(maxEngines: number) {
  // Filter out "coming soon" LLMs
  const activeLLMs = AVAILABLE_LLMS.filter((llm) => !llm.comingSoon);

  if (maxEngines === -1) {
    // Unlimited (Enterprise)
    return activeLLMs;
  }

  // Return up to the limit
  return activeLLMs.slice(0, maxEngines);
}
