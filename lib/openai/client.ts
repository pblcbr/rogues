import OpenAI from "openai";

/**
 * OpenAI client instance
 * Used for generating prompts based on company domain analysis
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
