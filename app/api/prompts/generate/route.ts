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

    // Generate prompts using OpenAI
    const prompts = await generatePromptsForDomain(domain);

    return NextResponse.json({
      prompts,
      message: "Prompts generated successfully",
    });
  } catch (error) {
    console.error("Prompt generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate prompts" },
      { status: 500 }
    );
  }
}
