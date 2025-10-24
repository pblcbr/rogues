import { NextRequest, NextResponse } from "next/server";
import { generatePromptsForDomain } from "@/lib/openai/prompt-generator";

/**
 * POST /api/prompts/generate
 * Generates monitoring prompts using OpenAI based on company domain
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    console.log(`[API] Generating prompts for domain: ${domain}`);

    // Generate prompts using OpenAI (or fallback)
    const prompts = await generatePromptsForDomain(domain);

    if (!prompts || prompts.length === 0) {
      console.error("[API] No prompts generated");
      return NextResponse.json(
        { error: "Failed to generate prompts. Please try again." },
        { status: 500 }
      );
    }

    console.log(`[API] Successfully generated ${prompts.length} prompts`);

    return NextResponse.json({
      prompts,
      message: "Prompts generated successfully",
      usingFallback: !process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.error("[API] Prompt generation error:", error);
    if (error instanceof Error) {
      console.error("[API] Error details:", error.message);
    }
    return NextResponse.json(
      {
        error:
          "Failed to generate prompts. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}
