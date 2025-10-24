import { NextRequest, NextResponse } from "next/server";
import { generateTopicsForDomain } from "@/lib/openai/topic-generator";

/**
 * POST /api/topics/generate
 * Generates monitoring topics using OpenAI based on company domain
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

    console.log(`[API] Generating topics for domain: ${domain}`);
    console.log(
      `[API] Brand Description: ${brandDescription || "not specified"}`
    );
    console.log(`[API] Region: ${region || "not specified"}`);
    console.log(`[API] Language: ${language || "not specified"}`);

    // Generate topics using OpenAI (or fallback)
    const result = await generateTopicsForDomain(domain, {
      brandHint: brandDescription,
      context: {
        regions_languages:
          region && language ? `${region}, ${language}` : undefined,
      },
    });

    if (!result || !result.topics || result.topics.length === 0) {
      console.error("[API] No topics generated");
      return NextResponse.json(
        { error: "Failed to generate topics. Please try again." },
        { status: 500 }
      );
    }

    console.log(`[API] Successfully generated ${result.topics.length} topics`);

    return NextResponse.json({
      topics: result.topics,
      domain_profile: result.domain_profile,
      message: "Topics generated successfully",
      usingFallback: !process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.error("[API] Topic generation error:", error);
    if (error instanceof Error) {
      console.error("[API] Error details:", error.message);
    }
    return NextResponse.json(
      {
        error:
          "Failed to generate topics. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}
