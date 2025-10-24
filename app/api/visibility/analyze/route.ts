import { NextRequest, NextResponse } from "next/server";
import { analyzeAIVisibility } from "@/lib/openai/visibility-analyzer";

/**
 * POST /api/visibility/analyze
 * Analyzes AI visibility for a brand compared to competitors
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, brandDescription, region, language } = body;

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    console.log(`[API] Analyzing visibility for domain: ${domain}`);
    console.log(
      `[API] Brand Description: ${brandDescription || "not specified"}`
    );
    console.log(`[API] Region: ${region || "not specified"}`);
    console.log(`[API] Language: ${language || "not specified"}`);

    // Analyze visibility using OpenAI (or fallback)
    const analysis = await analyzeAIVisibility(domain, {
      brandHint: brandDescription,
      region,
      language,
    });

    if (!analysis) {
      console.error("[API] No analysis generated");
      return NextResponse.json(
        { error: "Failed to analyze visibility. Please try again." },
        { status: 500 }
      );
    }

    console.log(
      `[API] Successfully analyzed visibility - Rank: #${analysis.client_rank}`
    );

    return NextResponse.json({
      analysis,
      message: "Visibility analysis completed successfully",
      usingFallback: !process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.error("[API] Visibility analysis error:", error);
    if (error instanceof Error) {
      console.error("[API] Error details:", error.message);
    }
    return NextResponse.json(
      {
        error:
          "Failed to analyze visibility. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}
