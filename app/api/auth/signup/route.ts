import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/signup
 * Creates a new user account with Supabase Auth
 */
export async function POST(request: NextRequest) {
  console.log("\n\n");
  console.log("🔴🔴🔴 SIGNUP ENDPOINT HIT! 🔴🔴🔴");
  console.log("Time:", new Date().toISOString());
  console.log("\n\n");

  const startTime = Date.now();
  console.log("=".repeat(70));
  console.log("[SIGNUP] 🚀 New signup request at:", new Date().toISOString());
  console.log("=".repeat(70));

  try {
    // STEP 1: Parse request body
    console.log("[SIGNUP] [1/7] Parsing request body...");
    const body = await request.json();
    console.log("[SIGNUP] Body received:", JSON.stringify(body, null, 2));
    const { email, password, firstName, lastName } = body;
    console.log("[SIGNUP] ✓ Body parsed");
    console.log("[SIGNUP]   - Email:", email);
    console.log("[SIGNUP]   - First Name:", firstName);
    console.log("[SIGNUP]   - Last Name:", lastName);
    console.log("[SIGNUP]   - Password length:", password?.length || 0);

    // STEP 2: Validate required fields
    console.log("[SIGNUP] [2/7] Validating required fields...");
    if (!email || !password || !firstName || !lastName) {
      console.error("[SIGNUP] ✗ Missing required fields!");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    console.log("[SIGNUP] ✓ All fields validated");

    // STEP 3: Check environment variables
    console.log("[SIGNUP] [3/7] Checking environment configuration...");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    console.log(
      "[SIGNUP]   - SUPABASE_URL:",
      supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "❌ MISSING"
    );
    console.log("[SIGNUP]   - APP_URL:", appUrl || "❌ MISSING");

    if (!supabaseUrl) {
      console.error("[SIGNUP] ✗ NEXT_PUBLIC_SUPABASE_URL is missing!");
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    // STEP 4: Create Supabase client
    console.log("[SIGNUP] [4/7] Creating Supabase client...");
    const supabase = createClient();
    console.log("[SIGNUP] ✓ Supabase client created");

    // STEP 5: Call Supabase auth.signUp
    console.log("[SIGNUP] [5/7] Calling Supabase auth.signUp()...");
    console.log("[SIGNUP]   ⏳ This usually takes 3-8 seconds...");

    // ===== MVP: EMAIL VERIFICATION DISABLED =====
    // emailRedirectTo is kept for when email verification is re-enabled
    // Make sure to disable "Confirm email" in Supabase dashboard:
    // Authentication > Providers > Email > Confirm email = OFF

    const signUpStart = Date.now();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${appUrl}/auth/callback`, // Ready for re-enabling
      },
    });
    const signUpDuration = Date.now() - signUpStart;

    console.log(`[SIGNUP] ✓ Supabase responded in ${signUpDuration}ms`);
    console.log("[SIGNUP]   - Has data:", !!data);
    console.log("[SIGNUP]   - Has error:", !!error);
    console.log("[SIGNUP]   - User ID:", data?.user?.id || "none");
    console.log("[SIGNUP]   - User email:", data?.user?.email || "none");

    // STEP 6: Handle errors
    if (error) {
      console.log("[SIGNUP] [6/7] ⚠️  Error received from Supabase:");
      console.error("[SIGNUP] Error details:", {
        message: error.message,
        status: error.status,
        code: error.code,
        name: error.name,
      });

      let errorMessage = error.message;
      let errorType = "general";

      // Check for email rate limit
      if (error.message.includes("email rate limit")) {
        console.log("[SIGNUP] → Detected: EMAIL RATE LIMIT");
        errorMessage =
          "Your account was created but we cannot send more verification emails right now. Please wait a few minutes or check your email.";
        errorType = "email_rate_limit";

        // Check if user was actually created
        const responseData = data as any;
        if (responseData?.user?.id) {
          console.log(
            "[SIGNUP] ✓ User was created despite email limit, proceeding..."
          );
          return NextResponse.json({
            userId: responseData.user.id,
            message: errorMessage,
            emailSent: false,
            warning: "email_rate_limit",
          });
        }
      }
      // Check for user already exists
      else if (
        error.message.includes("User already registered") ||
        error.code === "user_already_exists" ||
        error.status === 422
      ) {
        console.log("[SIGNUP] → Detected: USER ALREADY EXISTS");
        errorMessage =
          "This email is already registered. Please check your spam folder for verification email or use /debug-registration";
        errorType = "user_exists";
      }
      // Check for rate limit
      else if (
        error.message.includes("rate limit") ||
        error.message.includes("too many requests") ||
        error.status === 429
      ) {
        console.log("[SIGNUP] → Detected: RATE LIMIT");
        errorMessage =
          "Too many signup attempts. Please wait 60 seconds before trying again.";
        errorType = "rate_limit";
      }
      // Check for weak password
      else if (error.message.includes("password")) {
        console.log("[SIGNUP] → Detected: WEAK PASSWORD");
        errorMessage =
          "Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.";
        errorType = "weak_password";
      } else {
        console.log("[SIGNUP] → Unknown error type");
      }

      console.log("[SIGNUP] Returning error response:", errorType);
      return NextResponse.json(
        {
          error: errorMessage,
          errorType,
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: error.status || 400 }
      );
    }

    // STEP 6: Verify user was created
    console.log("[SIGNUP] [6/7] Verifying user creation...");
    if (!data.user) {
      console.error("[SIGNUP] ✗ No user object returned!");
      return NextResponse.json(
        {
          error:
            "Failed to create account. User may already exist. Try /debug-registration",
        },
        { status: 400 }
      );
    }

    // STEP 7: Create profile (manual fallback if trigger doesn't work)
    console.log("[SIGNUP] [7/7] Creating profile...");
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email: data.user.email,
      first_name: firstName,
      last_name: lastName,
    });

    if (profileError) {
      // Profile might already exist from trigger, that's OK
      console.log("[SIGNUP] ⚠️ Profile creation note:", profileError.message);
    } else {
      console.log("[SIGNUP] ✓ Profile created successfully");
    }

    // STEP 8: Success!
    console.log("[SIGNUP] [8/8] ✅ SUCCESS!");
    console.log("[SIGNUP] User created successfully:");
    console.log("[SIGNUP]   - User ID:", data.user.id);
    console.log("[SIGNUP]   - Email:", data.user.email);
    console.log(
      "[SIGNUP]   - Email Confirmed:",
      data.user.email_confirmed_at || "Pending"
    );
    console.log("[SIGNUP]   - Created at:", data.user.created_at);
    console.log("[SIGNUP] Total time:", Date.now() - startTime, "ms");
    console.log("[SIGNUP] Note: Auto-login happens on client side");
    console.log("=".repeat(70));

    return NextResponse.json({
      userId: data.user.id,
      message:
        "Account created successfully. Please check your email for verification code.",
      emailSent: true,
    });
  } catch (error) {
    console.error("=".repeat(70));
    console.error("[SIGNUP] 💥 UNEXPECTED ERROR:");
    console.error(error);
    console.error("=".repeat(70));

    return NextResponse.json(
      {
        error: "Failed to create account. Please try again.",
        errorType: "server_error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 }
    );
  }
}
