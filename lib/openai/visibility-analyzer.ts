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

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE:
1. REGION FOCUS: Only analyze competitors and market presence in the specified region. Ignore global or other regional competitors if they are not relevant to the target region.
2. LANGUAGE CONTEXT: Consider content in the specified language as the primary measure of visibility. Regional language content should weigh more heavily in your analysis.
3. WEBSITE ANALYSIS: When a domain is provided, you should visit and analyze the website to understand:
   - What the company does and its industry
   - Their value proposition and target market
   - Content quality and structure
   - Technical implementation quality
4. DOMAIN INFERENCE: If no description is provided, carefully analyze the domain name and website to infer the business type, industry, and positioning.

ANALYSIS REQUIREMENTS:
- Identify the top 5-7 direct competitors in the SAME REGION and targeting the SAME MARKET
- Estimate the brand's current ranking position (1-25+)
- Provide realistic competitor rankings based on market presence, brand strength, content quality, and AI visibility
- Calculate how many opportunities exist to improve visibility
- Provide an honest industry benchmark assessment

RANKING CRITERIA:
Consider these factors for AI visibility:
- Brand recognition and authority in the target region
- Content quality and SEO for AI in the target language
- Backlink profile and citations (regional relevance)
- Social proof (reviews, case studies in target language)
- Technical documentation quality
- Market share and presence in target region
- Local SEO and regional domain presence

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
- Order competitors array by rank (1 = best visibility)
- ONLY consider competitors relevant to the specified region
- Base your analysis on actual website research when domain is provided
- Don't make up or hallucinate information - be precise and factual`;

    const brandInfo = opts?.brandHint
      ? `Brand description: ${opts.brandHint}`
      : `Brand description: NOT PROVIDED - Please visit the website ${domain} to understand the company's industry, products, and market positioning.`;

    const userPrompt = `Domain to analyze: ${domain}
${brandInfo}
Primary target region: ${opts?.region || "Global"}
Primary language: ${opts?.language || "English"}

Please follow these steps:
1. Visit the website ${domain} to understand the business and industry
2. Identify competitors in the same industry targeting the ${opts?.region || "Global"} market
3. Analyze AI visibility specifically for content in ${opts?.language || "English"} language
4. Provide a realistic competitive ranking analysis based on your research

Analyze this brand's AI visibility and provide a competitive ranking analysis.`;

    console.log("[Visibility Analyzer] 🚀 Calling OpenAI API...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      top_p: 0.8,
      max_tokens: 2000,
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
