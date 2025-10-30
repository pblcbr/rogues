/**
 * Perplexity AI Client
 * https://docs.perplexity.ai/
 */

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

export interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Create a Perplexity client instance
 */
export function createPerplexityClient(apiKey: string) {
  if (!apiKey) {
    throw new Error("Perplexity API key is required");
  }

  return {
    /**
     * Send a chat completion request to Perplexity
     */
    async chat(request: PerplexityRequest): Promise<PerplexityResponse> {
      const response = await fetch(PERPLEXITY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Perplexity API error (${response.status}): ${error}`);
      }

      return response.json();
    },
  };
}

/**
 * Singleton instance
 */
let perplexityInstance: ReturnType<typeof createPerplexityClient> | null = null;

export function getPerplexityClient() {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error(
      "PERPLEXITY_API_KEY is not configured in environment variables"
    );
  }

  if (!perplexityInstance) {
    perplexityInstance = createPerplexityClient(apiKey);
  }

  return perplexityInstance;
}
