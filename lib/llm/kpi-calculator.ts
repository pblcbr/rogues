/**
 * LLM-based KPI Calculator Interface
 * Supports multiple LLM providers (OpenAI, Anthropic, etc.)
 */

import { detectBrands, type BrandAnalysis } from "./brand-detector";
import {
  detectBrandsDynamically,
  type DynamicBrandAnalysis,
} from "./dynamic-brand-detector";
import { extractCitations, type Citation } from "./citation-extractor";

export interface KPIMetrics {
  // Legacy fields (for backward compatibility)
  mentionPresent: boolean;
  citationsCount: number;
  sentiment: number; // -1 to 1
  prominence: number; // 0 to 1 (lower = earlier/more prominent)
  alignment: number; // 0 to 1
  citationAuthorities?: number[]; // Array of authority scores for citations
  rawAnswer?: string;

  // New enhanced fields
  responseText?: string;
  brandAnalysis?: BrandAnalysis;
  citations?: Citation[];
  ourBrandMentioned?: boolean;
  ourBrandPosition?: number | null;
  relevancyScore?: number; // 0-100
}

export interface PromptKPIResult {
  promptId: string;
  metrics: KPIMetrics[];
  calculatedAt: Date;
  llmProvider: string;
  llmModel: string;
}

export interface LLMProvider {
  name: string;

  /**
   * Calculate KPIs for a prompt by querying the LLM multiple times
   * and analyzing the responses
   */
  calculateKPIs(
    promptText: string,
    brandContext: {
      name?: string;
      website?: string;
      description?: string;
      competitors?: string[]; // NEW: List of competitor brands to track
    },
    options?: {
      numSamples?: number; // Number of times to query (default: 3)
      region?: string;
      language?: string;
    }
  ): Promise<PromptKPIResult>;
}

/**
 * Abstract base class for LLM-based KPI calculators
 */
export abstract class BaseKPICalculator implements LLMProvider {
  abstract name: string;

  abstract calculateKPIs(
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
  ): Promise<PromptKPIResult>;

  /**
   * Analyze a single AI response to extract KPIs (ENHANCED VERSION)
   * This is provider-agnostic and can be used by all implementations
   * NOW ASYNC to support dynamic brand detection via LLM
   */
  protected async analyzeResponse(
    response: string,
    brandContext: {
      name?: string;
      website?: string;
      competitors?: string[];
    },
    llmProvider: string = "openai"
  ): Promise<KPIMetrics> {
    const lowerResponse = response.toLowerCase();
    const brandName = brandContext.name || "";
    const brandDomain =
      brandContext.website
        ?.replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .toLowerCase() || "";
    const competitors = brandContext.competitors || [];

    // NEW: Dynamic brand detection using LLM (when no competitors defined)
    // This automatically extracts all brands mentioned without pre-defining them
    let brandAnalysis: BrandAnalysis | DynamicBrandAnalysis;

    if (brandName) {
      // Use dynamic detection to find all brands automatically
      brandAnalysis = await detectBrandsDynamically(response, brandName);
      console.log(
        `[KPI Calculator] Dynamic brand detection found ${brandAnalysis.brandsDetected.length} brands`
      );
    } else {
      // Fallback to static detection (backward compatibility)
      brandAnalysis = detectBrands(response, brandName, competitors);
    }

    // NEW: Enhanced citation extraction
    const citations = extractCitations(response, llmProvider);

    // Legacy detection (for backward compatibility)
    const mentionPresent = Boolean(
      (brandName && lowerResponse.includes(brandName.toLowerCase())) ||
        (brandDomain && lowerResponse.includes(brandDomain))
    );

    // Citations count
    const citationsCount = citations.length;

    // Calculate sentiment (-1 to 1)
    const sentiment = this.calculateSentiment(lowerResponse);

    // Calculate prominence (0 to 1, lower = more prominent)
    const prominence = this.calculateProminence(
      response,
      brandName.toLowerCase() || brandDomain
    );

    // Calculate alignment (how well response matches prompt intent)
    const alignment = this.calculateAlignment(response);

    return {
      // Legacy fields
      mentionPresent,
      citationsCount,
      sentiment,
      prominence,
      alignment,
      rawAnswer: response,

      // New enhanced fields
      responseText: response,
      brandAnalysis,
      citations,
      ourBrandMentioned: brandAnalysis.ourBrandMentioned,
      ourBrandPosition: brandAnalysis.ourBrandPosition,
      relevancyScore: brandAnalysis.relevancyScore,
    };
  }

  private calculateSentiment(text: string): number {
    const positive = [
      "best",
      "recommended",
      "great",
      "top",
      "ideal",
      "trusted",
      "excellent",
      "outstanding",
      "leading",
    ];
    const negative = [
      "avoid",
      "poor",
      "bad",
      "limitations",
      "issues",
      "problem",
      "worst",
      "failed",
      "concerns",
    ];

    let score = 0;
    positive.forEach((w) => {
      if (text.includes(w)) score += 1;
    });
    negative.forEach((w) => {
      if (text.includes(w)) score -= 1;
    });

    if (score === 0) return 0;
    return Math.max(-1, Math.min(1, score / 5));
  }

  private calculateProminence(text: string, brandTerm: string): number {
    if (!brandTerm) return 0.5;

    const lowerText = text.toLowerCase();
    const lowerBrand = brandTerm.toLowerCase();
    const idx = lowerText.indexOf(lowerBrand);

    if (idx < 0) return 1.0; // Not mentioned = lowest prominence

    const position = idx / text.length; // 0 (early) to 1 (late)

    // Lower position = higher prominence (invert for score)
    let score = 1 - position;

    // Bonus for appearing in top-N lists
    const snippet = text.slice(
      Math.max(0, idx - 100),
      Math.min(text.length, idx + 150)
    );
    if (/\b(1\.|2\.|3\.|first|second|third|top\s+\d+)/i.test(snippet)) {
      score = Math.min(1, score + 0.2);
    }

    // Bonus for citations nearby
    if (/https?:\/\//i.test(snippet)) {
      score = Math.min(1, score + 0.1);
    }

    return Math.max(0, Math.min(1, 1 - score)); // Return prominence (lower = better)
  }

  private calculateAlignment(text: string): number {
    // Simple heuristic: longer, more structured responses typically align better
    // This can be enhanced with embeddings-based similarity
    const wordCount = text.split(/\s+/).length;
    const hasStructure = /(\d+\.|•|-|\n\n)/.test(text);

    let score = Math.min(1, wordCount / 200); // Normalize to 0-1
    if (hasStructure) score += 0.1;

    return Math.min(1, score);
  }
}
