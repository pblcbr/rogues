export interface GeneratedPrompt {
  text: string;
  category?: string;
}

/**
 * Extract domain from email address
 * @param email - Email address
 * @returns Domain without TLD (e.g., "acme" from "user@acme.com")
 */
export function extractDomain(email: string): string {
  const match = email.match(/@(.+)\./);
  return match ? match[1] : "";
}

/**
 * Generates monitoring prompts for a company based on their domain
 * Uses GPT-4o to analyze the domain and create relevant AEO prompts
 *
 * @param domain - Company domain (e.g., "acme.com")
 * @returns Array of generated prompts
 */
export async function generatePromptsForDomain(
  domain: string
): Promise<GeneratedPrompt[]> {
  try {
    // Debug: Log environment variable status
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("[OpenAI] Debug - API Key check:", {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      prefix: apiKey?.substring(0, 10) || "none",
      env: process.env.NODE_ENV,
    });

    // Check if OpenAI API key is configured
    if (!apiKey) {
      console.warn("[OpenAI] API key not configured. Using fallback prompts.");
      console.warn(
        "[OpenAI] To enable AI-generated prompts, add OPENAI_API_KEY to your .env.local file"
      );
      return getFallbackPrompts();
    }

    // Import OpenAI client only when needed (server-side)
    console.log("[OpenAI] Importing OpenAI client...");
    const { openai } = await import("./client");

    console.log(`[OpenAI] Generating prompts for domain: ${domain}`);

    const systemPrompt = `You are an expert in Answer Engine Optimization (AEO). 
Your task is to generate monitoring prompts for tracking a company's brand visibility 
in AI search engines like ChatGPT, Claude, Perplexity, and Google AI Overviews.

These prompts should represent natural questions that potential customers might ask 
AI assistants where the company's brand should ideally be mentioned or recommended.`;

    const userPrompt = `Domain: ${domain}

Analyze this domain and generate EXACTLY 10 specific, natural prompts that potential customers 
might ask AI assistants where this brand should be mentioned or recommended.

Consider:
- Product/service category and offerings
- Use cases and customer problems they solve
- Comparison queries ("best X for Y")
- Recommendation queries ("top rated X")
- Solution-seeking queries ("how to solve X")
- Industry-specific terminology

Requirements:
- Generate EXACTLY 10 prompts (no more, no less)
- Prompts should be 5-15 words each
- Natural conversational language
- Diverse query types (mix comparison, solution, recommendation, etc.)
- Focus on commercial intent

Return ONLY a valid JSON object with this exact structure (with 10 prompts):
{
  "prompts": [
    {"text": "best project management software for startups", "category": "comparison"},
    {"text": "how to organize team workflows remotely", "category": "solution"},
    {"text": "top rated tools for remote teams", "category": "recommendation"},
    ... (7 more prompts to total 10)
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    console.log("[OpenAI] Raw response received");

    const parsed = JSON.parse(content);
    const prompts = parsed.prompts || [];

    console.log(
      `[OpenAI] Successfully generated ${prompts.length} prompts for domain: ${domain}`
    );

    // Ensure we have at least 10 prompts
    if (prompts.length < 10) {
      console.warn(
        `[OpenAI] Only received ${prompts.length} prompts, expected 10. Adding fallback prompts.`
      );
      const fallbackPrompts = getFallbackPrompts();
      return [...prompts, ...fallbackPrompts.slice(0, 10 - prompts.length)];
    }

    return prompts;
  } catch (error) {
    console.error("[OpenAI] Error generating prompts:", error);
    if (error instanceof Error) {
      console.error("[OpenAI] Error details:", error.message);
    }
    console.log("[OpenAI] Returning fallback prompts");
    // Return fallback generic prompts
    return getFallbackPrompts();
  }
}

/**
 * Fallback prompts if OpenAI fails
 * These are generic but useful prompts for any business
 */
function getFallbackPrompts(): GeneratedPrompt[] {
  return [
    { text: "best companies in the industry", category: "comparison" },
    { text: "top rated service providers", category: "recommendation" },
    { text: "reliable business solutions", category: "solution" },
    {
      text: "how to choose the right platform",
      category: "educational",
    },
    { text: "trusted brands for businesses", category: "recommendation" },
    { text: "leading companies in the market", category: "comparison" },
    {
      text: "what are the best options for enterprises",
      category: "comparison",
    },
    { text: "recommended tools for professionals", category: "recommendation" },
    { text: "industry leaders and innovators", category: "informational" },
    { text: "where to find quality services", category: "solution" },
  ];
}
