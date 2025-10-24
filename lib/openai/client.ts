import OpenAI from "openai";

/**
 * OpenAI client instance
 * Used for generating prompts based on company domain analysis
 * Lazy-initialized to avoid errors when API key is not configured
 */
let _openai: OpenAI | null = null;

export const openai = new Proxy({} as OpenAI, {
  get(target, prop) {
    if (!_openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          "OPENAI_API_KEY is not configured. Please add it to your .env.local file."
        );
      }
      _openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return (_openai as any)[prop];
  },
});
