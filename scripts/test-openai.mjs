#!/usr/bin/env node

/**
 * Test script to verify OpenAI API key is working
 * Run with: node scripts/test-openai.mjs
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

console.log("🔍 Testing OpenAI Configuration\n");
console.log("=".repeat(50));

// Check if API key exists
const apiKey = process.env.OPENAI_API_KEY;

console.log("\n1️⃣ Environment Variable Check:");
console.log("   API Key exists:", !!apiKey);
console.log("   API Key length:", apiKey?.length || 0);
console.log("   API Key prefix:", apiKey?.substring(0, 10) || "NOT SET");
console.log("   Starts with 'sk-':", apiKey?.startsWith("sk-") || false);

if (!apiKey) {
  console.log("\n❌ ERROR: OPENAI_API_KEY not found!");
  console.log("\n📋 To fix this:");
  console.log("   1. Create or edit .env.local in project root");
  console.log("   2. Add this line:");
  console.log("      OPENAI_API_KEY=sk-proj-your-key-here");
  console.log("   3. Get your key from: https://platform.openai.com/api-keys");
  console.log("   4. Restart the Next.js server");
  process.exit(1);
}

console.log("\n2️⃣ Testing OpenAI API Connection:");

try {
  const { default: OpenAI } = await import("openai");

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  console.log("   OpenAI client created ✅");

  // Try a simple API call
  console.log("   Making test API call...");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Use cheaper model for testing
    messages: [
      { role: "user", content: "Say 'API is working!' if you can read this." },
    ],
    max_tokens: 20,
  });

  const result = response.choices[0].message.content;
  console.log("   API Response:", result);

  console.log("\n✅ SUCCESS! OpenAI is configured correctly!");
  console.log("\n📊 Next steps:");
  console.log(
    "   1. Restart your Next.js dev server (Ctrl+C then npm run dev)"
  );
  console.log("   2. Test the registration flow");
  console.log("   3. Check server logs for [OpenAI] messages");
} catch (error) {
  console.log("\n❌ ERROR: OpenAI API call failed!");
  console.error("\n   Error details:", error.message);

  if (error.message.includes("Incorrect API key")) {
    console.log("\n📋 The API key is invalid or incorrect:");
    console.log("   1. Go to: https://platform.openai.com/api-keys");
    console.log("   2. Generate a new API key");
    console.log("   3. Replace the key in .env.local");
    console.log("   4. Make sure there are no extra spaces or quotes");
  } else if (error.message.includes("insufficient_quota")) {
    console.log("\n📋 Your OpenAI account has insufficient credits:");
    console.log("   1. Go to: https://platform.openai.com/account/billing");
    console.log("   2. Add at least $5 in credits");
    console.log("   3. Wait a few minutes for credits to be available");
  } else if (error.message.includes("rate_limit")) {
    console.log("\n📋 Rate limit exceeded:");
    console.log("   1. Wait 60 seconds and try again");
    console.log("   2. Or upgrade your OpenAI plan");
  } else {
    console.log("\n📋 Unexpected error. Check:");
    console.log("   1. Your internet connection");
    console.log("   2. OpenAI service status: https://status.openai.com");
    console.log("   3. The full error message above");
  }

  process.exit(1);
}

console.log("\n" + "=".repeat(50));
