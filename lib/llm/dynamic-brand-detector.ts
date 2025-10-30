/**
 * Dynamic Brand Detection using LLM
 * Automatically extracts all brands mentioned in LLM responses
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DynamicBrandMention {
  brandName: string;
  position: number; // Order in which they appear
  firstOccurrence: number; // Character index (for compatibility)
  isOurBrand: boolean;
}

export interface DynamicBrandAnalysis {
  ourBrandMentioned: boolean;
  ourBrandPosition: number | null;
  brandsDetected: DynamicBrandMention[];
  totalBrandsMentioned: number;
  relevancyScore: number;
}

/**
 * Use LLM to extract all brand names from the response
 * This allows us to detect brands dynamically without pre-defining them
 */
export async function detectBrandsDynamically(
  responseText: string,
  ourBrand: string
): Promise<DynamicBrandAnalysis> {
  if (!responseText) {
    return {
      ourBrandMentioned: false,
      ourBrandPosition: null,
      brandsDetected: [],
      totalBrandsMentioned: 0,
      relevancyScore: 0,
    };
  }

  try {
    const prompt = `Extract all brand/company names mentioned in the following text.
Return ONLY a JSON array of brand names in the order they appear.
Example: ["Brand1", "Brand2", "Brand3"]

Text:
${responseText}

Brands:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for cost efficiency
      messages: [
        {
          role: "system",
          content:
            "You are an expert at identifying brand and company names in text. Return only valid JSON arrays.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "[]";

    // Parse the JSON response
    let brands: string[] = [];
    try {
      brands = JSON.parse(content);
    } catch (parseError) {
      console.error("[Dynamic Brand Detector] JSON parse error:", parseError);
      // Fallback: try to extract brands from text
      const matches = content.match(/"([^"]+)"/g);
      if (matches) {
        brands = matches.map((m) => m.replace(/"/g, ""));
      }
    }

    // Create brand mentions with positions
    const brandsDetected: DynamicBrandMention[] = brands.map(
      (brandName, index) => {
        const isOurBrand =
          brandName.toLowerCase().trim() === ourBrand.toLowerCase().trim();

        // Try to find actual character position in text
        const brandLower = brandName.toLowerCase().trim();
        const textLower = responseText.toLowerCase();
        const firstOccurrence = textLower.indexOf(brandLower);

        return {
          brandName: brandName.trim(),
          position: index + 1,
          firstOccurrence: firstOccurrence >= 0 ? firstOccurrence : index * 100, // Fallback
          isOurBrand,
        };
      }
    );

    // Find our brand
    const ourBrandMention = brandsDetected.find((b) => b.isOurBrand);
    const ourBrandMentioned = ourBrandMention !== undefined;
    const ourBrandPosition = ourBrandMention?.position || null;

    // Calculate relevancy
    let relevancyScore = 0;
    if (ourBrandMentioned) {
      relevancyScore = 100;
    } else if (brandsDetected.length > 0) {
      relevancyScore = 50;
    }

    return {
      ourBrandMentioned,
      ourBrandPosition,
      brandsDetected,
      totalBrandsMentioned: brandsDetected.length,
      relevancyScore,
    };
  } catch (error) {
    console.error("[Dynamic Brand Detector] Error:", error);
    // Fallback to empty result
    return {
      ourBrandMentioned: false,
      ourBrandPosition: null,
      brandsDetected: [],
      totalBrandsMentioned: 0,
      relevancyScore: 0,
    };
  }
}
