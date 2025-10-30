/**
 * Anthropic Claude Client
 * https://docs.anthropic.com/
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature?: number;
  system?: string;
}

export interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Create an Anthropic client instance
 */
export function createAnthropicClient(apiKey: string) {
  if (!apiKey) {
    throw new Error("Anthropic API key is required");
  }

  return {
    /**
     * Send a message request to Claude
     */
    async messages(request: AnthropicRequest): Promise<AnthropicResponse> {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error (${response.status}): ${error}`);
      }

      return response.json();
    },
  };
}

/**
 * Singleton instance
 */
let anthropicInstance: ReturnType<typeof createAnthropicClient> | null = null;

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured in environment variables"
    );
  }

  if (!anthropicInstance) {
    anthropicInstance = createAnthropicClient(apiKey);
  }

  return anthropicInstance;
}
