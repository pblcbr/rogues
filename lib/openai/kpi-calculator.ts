/**
 * OpenAI-based KPI Calculator
 * Uses OpenAI API to query prompts and calculate visibility KPIs
 */

import { openai } from "@/lib/openai/client";
import {
  BaseKPICalculator,
  type PromptKPIResult,
  type KPIMetrics,
} from "@/lib/llm/kpi-calculator";

export class OpenAIKPICalculator extends BaseKPICalculator {
  name = "openai";

  private readonly DEFAULT_MODEL = "gpt-4o";
  private readonly DEFAULT_NUM_SAMPLES = 3;
  private readonly MAX_TOKENS = 800;
  private readonly TEMPERATURE = 0.3; // Lower for more consistent results

  async calculateKPIs(
    promptText: string,
    brandContext: {
      name?: string;
      website?: string;
      description?: string;
      competitors?: string[];
    },
    options?: {
      numSamples?: number;
      region?: string;
      language?: string;
    }
  ): Promise<PromptKPIResult> {
    const numSamples = options?.numSamples || this.DEFAULT_NUM_SAMPLES;
    const region = options?.region || "United States";
    const language = options?.language || "English";

    const systemPrompt = this.buildSystemPrompt(brandContext, region, language);

    // Query the LLM multiple times to get a sample of responses
    const metrics: KPIMetrics[] = [];
    const errors: Error[] = [];

    for (let i = 0; i < numSamples; i++) {
      try {
        const response = await this.queryLLM(promptText, systemPrompt);
        const analyzed = await this.analyzeResponse(
          response,
          brandContext,
          this.name
        );
        metrics.push(analyzed);

        // Small delay between requests to avoid rate limits
        if (i < numSamples - 1) {
          await this.sleep(500);
        }
      } catch (error) {
        console.error(`[OpenAI KPI] Error in sample ${i + 1}:`, error);
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    if (metrics.length === 0) {
      throw new Error(
        `Failed to get any successful responses. Errors: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    return {
      promptId: "", // Will be set by caller
      metrics,
      calculatedAt: new Date(),
      llmProvider: this.name,
      llmModel: this.DEFAULT_MODEL,
    };
  }

  private buildSystemPrompt(
    brandContext: {
      name?: string;
      website?: string;
      description?: string;
      competitors?: string[];
    },
    region: string,
    language: string
  ): string {
    // DO NOT mention the brand in the system prompt to avoid bias
    // The brand is only used AFTER for detection, not to influence the response
    const prompt = `You are an AI assistant providing helpful, accurate answers to user questions.

Context:
- Target region: ${region}
- Target language: ${language}

Provide a natural, helpful answer in ${language}, relevant to ${region}. If you mention specific brands, products, or services, include relevant citations when appropriate.

Be objective and comprehensive in your answer. Mention the most relevant and popular options available in ${region}.`;

    return prompt;
  }

  private async queryLLM(
    userPrompt: string,
    systemPrompt: string
  ): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: this.DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: this.TEMPERATURE,
        max_tokens: this.MAX_TOKENS,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to get the appropriate KPI calculator
 */
export function getKPICalculator(
  provider: string = "openai"
): BaseKPICalculator {
  switch (provider.toLowerCase()) {
    case "openai":
      return new OpenAIKPICalculator();
    // Future providers:
    // case "anthropic":
    //   return new AnthropicKPICalculator();
    // case "google":
    //   return new GoogleKPICalculator();
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
