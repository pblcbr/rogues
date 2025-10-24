import { NextResponse } from "next/server";

/**
 * GET /api/debug/env
 * Debug endpoint to check if environment variables are loaded
 * Only for development - DO NOT use in production
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  const envCheck = {
    nodeEnv: process.env.NODE_ENV,
    variables: {
      // Supabase
      supabaseUrl: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...`
          : "NOT SET",
      },
      supabaseAnonKey: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        prefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)
          : "NOT SET",
      },
      supabaseServiceKey: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        prefix: process.env.SUPABASE_SERVICE_ROLE_KEY
          ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)
          : "NOT SET",
      },
      // OpenAI
      openaiApiKey: {
        exists: !!process.env.OPENAI_API_KEY,
        length: process.env.OPENAI_API_KEY?.length || 0,
        prefix: process.env.OPENAI_API_KEY
          ? process.env.OPENAI_API_KEY.substring(0, 10)
          : "NOT SET",
        isValid: process.env.OPENAI_API_KEY?.startsWith("sk-") || false,
      },
      // Stripe
      stripePublishableKey: {
        exists: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        prefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
          ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 10)
          : "NOT SET",
      },
      stripeSecretKey: {
        exists: !!process.env.STRIPE_SECRET_KEY,
        prefix: process.env.STRIPE_SECRET_KEY
          ? process.env.STRIPE_SECRET_KEY.substring(0, 10)
          : "NOT SET",
      },
      // App
      appUrl: {
        exists: !!process.env.NEXT_PUBLIC_APP_URL,
        value: process.env.NEXT_PUBLIC_APP_URL || "NOT SET",
      },
    },
    recommendations: [] as string[],
  };

  // Add recommendations
  if (!envCheck.variables.openaiApiKey.exists) {
    envCheck.recommendations.push(
      "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local to enable AI-powered prompt generation."
    );
  } else if (!envCheck.variables.openaiApiKey.isValid) {
    envCheck.recommendations.push(
      "OpenAI API key exists but doesn't start with 'sk-'. Please check if it's correct."
    );
  }

  if (!envCheck.variables.supabaseUrl.exists) {
    envCheck.recommendations.push(
      "Supabase URL not configured. Add NEXT_PUBLIC_SUPABASE_URL to .env.local"
    );
  }

  if (!envCheck.variables.supabaseAnonKey.exists) {
    envCheck.recommendations.push(
      "Supabase Anon Key not configured. Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    );
  }

  if (!envCheck.variables.supabaseServiceKey.exists) {
    envCheck.recommendations.push(
      "Supabase Service Key not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local"
    );
  }

  return NextResponse.json(envCheck, { status: 200 });
}
