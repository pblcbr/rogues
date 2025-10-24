import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/resend-otp
 * Resends the OTP code to user's email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createClient();

    // Resend OTP
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      console.error("OTP resend error:", error);

      // Provide more helpful error messages
      let errorMessage = error.message;
      if (error.message.includes("rate limit")) {
        errorMessage =
          "Please wait 60 seconds between resend attempts. If you still don't receive the email after multiple attempts, check your spam folder or use /debug-registration to troubleshoot.";
      } else if (error.message.includes("email not found")) {
        errorMessage =
          "Email not found. Please start the registration process again or use /debug-registration to check your account status.";
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    console.log("OTP resent successfully for:", email);

    return NextResponse.json({
      message:
        "Verification code resent successfully. Please check your email (including spam folder).",
    });
  } catch (error) {
    console.error("OTP resend error:", error);
    return NextResponse.json(
      { error: "Failed to resend OTP" },
      { status: 500 }
    );
  }
}
