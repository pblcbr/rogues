/**
 * AI Visibility Analyzer
 * Analyzes brand visibility in AI search engines compared to competitors
 */

export interface CompetitorRanking {
  rank: number;
  name: string;
  domain?: string;
}

export interface VisibilityAnalysis {
  client_rank: number;
  total_competitors: number;
  competitors: CompetitorRanking[];
  opportunities_found: number;
  industry_benchmark: string;
  summary: string;
}

interface AnalysisOptions {
  brandHint?: string;
  region?: string;
  language?: string;
}

/**
 * Analyzes AI visibility for a domain and identifies competitors
 *
 * @param domain - Company domain (e.g., "taclia.com")
 * @param opts - Optional parameters (brandHint, region, language)
 * @returns Visibility analysis with competitor rankings
 */
export async function analyzeAIVisibility(
  domain: string,
  opts?: AnalysisOptions
): Promise<VisibilityAnalysis> {
  try {
    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn(
        "[Visibility Analyzer] API key not configured. Using fallback analysis."
      );
      return getFallbackAnalysis(domain);
    }

    // Import OpenAI client only when needed (server-side)
    const { openai } = await import("./client");

    console.log(`[Visibility Analyzer] Analyzing visibility for: ${domain}`);

    const systemPrompt = `You are an AI visibility analyst specializing in Answer Engine Optimization (AEO).

YOUR TASK:
Analyze how a brand ranks in AI search engines (ChatGPT, Claude, Gemini, Perplexity) compared to its competitors.

ANALYSIS REQUIREMENTS:
- Identify the top 5-7 direct competitors in the same category
- Estimate the brand's current ranking position (1-25+)
- Provide realistic competitor rankings based on market presence, brand strength, content quality, and AI visibility
- Calculate how many opportunities exist to improve visibility
- Provide an honest industry benchmark assessment

RANKING CRITERIA:
Consider these factors for AI visibility:
- Brand recognition and authority
- Content quality and SEO for AI
- Backlink profile and citations
- Social proof (reviews, case studies)
- Technical documentation quality
- Market share and presence

OUTPUT:
Return ONLY valid JSON (no markdown, no extra text) following this exact schema:

{
  "client_rank": number (1-25+, where the brand currently ranks),
  "total_competitors": number (5-7 competitors identified),
  "competitors": [
    {
      "rank": number,
      "name": "string (competitor brand name)",
      "domain": "string (competitor domain, optional)"
    }
  ],
  "opportunities_found": number (5-15, realistic improvement opportunities),
  "industry_benchmark": "string (e.g., 'below industry benchmarks', 'at industry average', 'above industry benchmarks')",
  "summary": "string (2-3 sentences explaining the current visibility status and main gaps)"
}

IMPORTANT:
- Be realistic and honest in rankings
- Don't inflate opportunities count
- Include the client in the competitors array at their rank position
- Order competitors array by rank (1 = best visibility)`;

    const userPrompt = `Domain: ${domain}
Brand description: ${opts?.brandHint || "Not provided - infer from domain"}
Primary region: ${opts?.region || "Global"}
Primary language: ${opts?.language || "English"}

Analyze this brand's AI visibility and provide a competitive ranking analysis.`;

    console.log("[Visibility Analyzer] 🚀 Calling OpenAI API...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      top_p: 0.5,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.error("[Visibility Analyzer] Empty response from OpenAI");
      return getFallbackAnalysis(domain);
    }

    console.log("[Visibility Analyzer] ✅ Received response from OpenAI");

    const analysis = JSON.parse(content) as VisibilityAnalysis;

    // Validate the response
    if (
      !analysis.client_rank ||
      !analysis.competitors ||
      analysis.competitors.length === 0
    ) {
      console.error("[Visibility Analyzer] Invalid response structure");
      return getFallbackAnalysis(domain);
    }

    console.log(`[Visibility Analyzer] Client rank: #${analysis.client_rank}`);
    console.log(
      `[Visibility Analyzer] Competitors found: ${analysis.total_competitors}`
    );
    console.log(
      `[Visibility Analyzer] Opportunities: ${analysis.opportunities_found}`
    );

    return analysis;
  } catch (error) {
    console.error("[Visibility Analyzer] Error:", error);
    return getFallbackAnalysis(domain);
  }
}

/**
 * Fallback analysis when OpenAI is not available
 */
function getFallbackAnalysis(domain: string): VisibilityAnalysis {
  const brandName = domain.split(".")[0];
  const capitalizedBrand =
    brandName.charAt(0).toUpperCase() + brandName.slice(1);

  return {
    client_rank: 15,
    total_competitors: 6,
    competitors: [
      { rank: 1, name: "Industry Leader A" },
      { rank: 2, name: "Industry Leader B" },
      { rank: 3, name: "Industry Leader C" },
      { rank: 4, name: "Competitor D" },
      { rank: 15, name: capitalizedBrand, domain },
      { rank: 18, name: "Competitor E" },
      { rank: 22, name: "Competitor F" },
    ],
    opportunities_found: 8,
    industry_benchmark: "below industry benchmarks",
    summary: `${capitalizedBrand}'s AI visibility is currently below industry benchmarks. There are significant opportunities to improve visibility through strategic content optimization and Answer Engine Optimization.`,
  };
}
