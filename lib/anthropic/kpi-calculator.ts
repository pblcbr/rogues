/**
 * Anthropic Claude-based KPI Calculator
 * Uses Anthropic API to query prompts and calculate visibility KPIs
 */

import { getAnthropicClient } from "./client";
import {
  BaseKPICalculator,
  type PromptKPIResult,
  type KPIMetrics,
} from "@/lib/llm/kpi-calculator";

export class AnthropicKPICalculator extends BaseKPICalculator {
  name = "anthropic";

  private readonly DEFAULT_MODEL = "claude-sonnet-4-20250514";
  private readonly DEFAULT_NUM_SAMPLES = 3;
  private readonly MAX_TOKENS = 1024;
  private readonly TEMPERATURE = 0.3;

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

    const systemPrompt = this.buildSystemPrompt(region, language);

    // Query Claude multiple times
    const metrics: KPIMetrics[] = [];
    const errors: Error[] = [];

    for (let i = 0; i < numSamples; i++) {
      try {
        const response = await this.queryClaude(promptText, systemPrompt);
        const analyzed = await this.analyzeResponse(
          response,
          brandContext,
          this.name
        );
        metrics.push(analyzed);

        // Small delay between requests
        if (i < numSamples - 1) {
          await this.sleep(500);
        }
      } catch (error) {
        console.error(`[Claude KPI] Error in sample ${i + 1}:`, error);
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    if (metrics.length === 0) {
      throw new Error(
        `Failed to get any successful responses. Errors: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    return {
      promptId: "",
      metrics,
      calculatedAt: new Date(),
      llmProvider: this.name,
      llmModel: this.DEFAULT_MODEL,
    };
  }

  private buildSystemPrompt(region: string, language: string): string {
    // No brand context to avoid bias
    const prompt = `You are an AI assistant providing helpful, accurate answers to user questions.

Context:
- Target region: ${region}
- Target language: ${language}

Provide a natural, helpful answer in ${language}, relevant to ${region}. If you mention specific brands, products, or services, include relevant citations when appropriate.

Be objective and comprehensive in your answer. Mention the most relevant and popular options available in ${region}.`;

    return prompt;
  }

  private async queryClaude(
    userPrompt: string,
    systemPrompt: string
  ): Promise<string> {
    try {
      const client = getAnthropicClient();

      const response = await client.messages({
        model: this.DEFAULT_MODEL,
        max_tokens: this.MAX_TOKENS,
        temperature: this.TEMPERATURE,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const content = response.content[0]?.text;
      if (!content) {
        throw new Error("Empty response from Claude");
      }

      return content;
    } catch (error) {
      console.error("[Claude KPI] Query error:", error);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
