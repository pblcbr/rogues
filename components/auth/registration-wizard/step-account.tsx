"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  accountSchema,
  type AccountFormData,
} from "@/lib/validations/registration";
import { useRegistrationStore } from "@/stores/registration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgressIndicator } from "../progress-indicator";
import { ArrowLeft, Eye, EyeOff, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Step 3: Create Account
 * Collects user details and creates Supabase account
 */
export function StepAccount() {
  const {
    email,
    companySize,
    isAgency,
    setAccountInfo,
    setEmailVerified,
    nextStep,
    previousStep,
  } = useRegistrationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isEmailRateLimit, setIsEmailRateLimit] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  // Countdown timer for rate limit
  useEffect(() => {
    if (isRateLimited && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isRateLimited) {
      setIsRateLimited(false);
      setError(null);
    }
  }, [countdown, isRateLimited]);

  // Show "this is taking longer than expected" message after 5 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setShowSlowWarning(false);
      timer = setTimeout(() => {
        setShowSlowWarning(true);
      }, 5000);
    } else {
      setShowSlowWarning(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
    },
  });

  const password = watch("password");
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: "" };
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    const labels = ["", "Weak", "Fair", "Good", "Strong"];
    return {
      strength: (strength / 5) * 100,
      label: labels[strength - 1] || "",
    };
  };

  const passwordStrength = getPasswordStrength(password || "");

  const onSubmit = async (data: AccountFormData) => {
    // Prevent multiple submissions
    if (isLoading) {
      console.log("❌ [Frontend] Form already submitting, ignoring duplicate");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    setIsEmailRateLimit(false);

    console.log("=".repeat(70));
    console.log("🚀 [Frontend] Starting signup process...");
    console.log("📧 [Frontend] Email:", email);
    console.log("👤 [Frontend] Name:", data.firstName, data.lastName);
    console.log("=".repeat(70));

    try {
      console.log("⏳ [Frontend] Sending request to /api/auth/signup...");
      const requestStart = Date.now();

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          companySize,
          isAgency,
        }),
      });

      const requestDuration = Date.now() - requestStart;
      console.log(`✓ [Frontend] Response received in ${requestDuration}ms`);

      console.log("📦 [Frontend] Parsing JSON response...");
      const result = await response.json();
      console.log("✓ [Frontend] Response parsed:", {
        hasUserId: !!result.userId,
        hasError: !!result.error,
        errorType: result.errorType,
        warning: result.warning,
      });

      // Check if user was created successfully (even with email rate limit warning)
      if (result.userId) {
        console.log(
          "✅ [Frontend] SUCCESS! User created with ID:",
          result.userId
        );

        // Store account info and user ID
        setAccountInfo(data.firstName, data.lastName);
        setEmailVerified(result.userId);

        // ===== MVP: AUTO-LOGIN AFTER SIGNUP =====
        // Since email verification is disabled, login immediately
        if (email) {
          console.log("🔐 [MVP] Auto-logging in user from client...");
          const supabase = createClient();
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: email,
            password: data.password,
          });

          if (loginError) {
            console.error(
              "❌ [Frontend] Auto-login failed:",
              loginError.message
            );
            alert(
              "Account created but login failed. Please try logging in manually."
            );
          } else {
            console.log(
              "✅ [Frontend] User logged in successfully with session!"
            );
          }
        }

        // ===== MVP: EMAIL VERIFICATION DISABLED =====
        // For MVP, skip email verification and go directly to prompts (step 5)
        // To re-enable: Remove the double nextStep() and uncomment code below
        console.log("⚡ [MVP] Skipping email verification, going to prompts");
        nextStep(); // Skip verification step (step 4)
        // Switch to a full-screen experience (hide testimonials) by navigating to prompts in focused mode
        nextStep(); // Go directly to prompts (step 5)
        return;

        /* ORIGINAL CODE - RE-ENABLE AFTER MVP:
        console.log(
          "📝 [Frontend] Storing account info and proceeding to verification..."
        );

        // If there's an email rate limit warning, show a special message
        if (result.warning === "email_rate_limit") {
          console.log("⚠️  [Frontend] Email rate limit warning detected");
          alert(
            "⚠️ Your account was created successfully!\n\n" +
              "However, we cannot send more verification emails right now due to rate limiting.\n\n" +
              "Please check your email inbox (and spam folder) for a verification code that may have already been sent.\n\n" +
              "You can also use the 'Resend Code' button on the next screen after waiting a few minutes."
          );
        }

        console.log("➡️  [Frontend] Moving to next step (verification)");
        nextStep();
        return;
        */
      }

      // Handle errors
      if (result.error) {
        console.log("❌ [Frontend] Error received from server");
        console.log("   Error Type:", result.errorType);
        console.log("   Error Message:", result.error);

        // Check if it's an email rate limit error
        if (result.errorType === "email_rate_limit") {
          console.log("⚠️  [Frontend] Handling email rate limit");
          setIsEmailRateLimit(true);
          setError(
            "Your account may have been created, but we cannot send more verification emails right now. Please check your email inbox (including spam folder) for a verification code, or wait a few minutes before trying again."
          );
        }
        // Check if it's a general rate limit error
        else if (
          result.errorType === "rate_limit" ||
          result.error.includes("Too many attempts")
        ) {
          console.log(
            "⏱️  [Frontend] Rate limit detected, starting 60s countdown"
          );
          setIsRateLimited(true);
          setCountdown(60); // Start 60 second countdown
          setError(
            "Too many signup attempts detected. Please wait 60 seconds before trying again."
          );
        }
        // Check if user already exists
        else if (
          result.errorType === "user_exists" ||
          result.error.includes("already registered")
        ) {
          console.log("👤 [Frontend] User already exists");
          setIsEmailRateLimit(true);
          setError(
            "This email is already registered. The account may already exist but needs verification. Check your email for a verification code."
          );
        } else {
          console.log("❌ [Frontend] Generic error");
          setError(result.error);
        }
        return;
      }

      console.log(
        "⚠️  [Frontend] No userId and no error in response - unexpected!"
      );
    } catch (error) {
      console.error("=".repeat(70));
      console.error("💥 [Frontend] Exception caught:");
      console.error(error);
      console.error("=".repeat(70));

      if (error instanceof Error) {
        console.error("   Error name:", error.name);
        console.error("   Error message:", error.message);
      }

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create account. Please try again."
      );
    } finally {
      console.log(
        "🏁 [Frontend] Signup process finished, resetting loading state"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={3} totalSteps={8} />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Create your account
        </h1>
        <p className="text-muted-foreground">
          Sign up to start tracking your brand&apos;s visibility.
        </p>
      </div>

      {showSlowWarning && isLoading && (
        <div className="animate-in fade-in slide-in-from-top-2 rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
              <svg
                className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                This is taking a bit longer than expected...
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                We&apos;re creating your account. Please don&apos;t close or
                refresh this page. This usually takes 5-10 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          className={`rounded-lg border p-4 ${
            isEmailRateLimit
              ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100"
              : isRateLimited
                ? "border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100"
                : "border-destructive bg-destructive/10 text-destructive"
          }`}
        >
          <div className="flex items-start gap-3">
            {isRateLimited && countdown > 0 && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-600 text-white">
                <Clock className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
              {isRateLimited && countdown > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">
                      Time remaining:
                    </span>
                    <span className="text-2xl font-bold">{countdown}s</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-yellow-200 dark:bg-yellow-900">
                    <div
                      className="h-full bg-yellow-600 transition-all duration-1000 ease-linear dark:bg-yellow-600"
                      style={{ width: `${(countdown / 60) * 100}%` }}
                    />
                  </div>
                  <div className="mt-3 space-y-1 text-xs opacity-80">
                    <p className="font-semibold">While you wait, try:</p>
                    <ul className="ml-4 list-disc space-y-1">
                      <li>Use a different email address</li>
                      <li>
                        Check if you&apos;re already registered at{" "}
                        <a
                          href="/debug-registration"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:opacity-80"
                        >
                          /debug-registration
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
              {isEmailRateLimit && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold">What you can do:</p>
                  <ul className="ml-4 list-disc space-y-1 text-xs opacity-80">
                    <li>
                      Check your email inbox (and spam folder) for a
                      verification code
                    </li>
                    <li>
                      If you have the code, click &quot;I have my verification
                      code&quot; below
                    </li>
                    <li>
                      Use{" "}
                      <a
                        href="/debug-registration"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:opacity-80"
                      >
                        /debug-registration
                      </a>{" "}
                      to check your account status
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" value={email || ""} disabled />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              placeholder="First name"
              {...register("firstName")}
              className={errors.firstName ? "border-destructive" : ""}
            />
            {errors.firstName && (
              <p className="text-sm text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              placeholder="Last name"
              {...register("lastName")}
              className={errors.lastName ? "border-destructive" : ""}
            />
            {errors.lastName && (
              <p className="text-sm text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              {...register("password")}
              className={errors.password ? "border-destructive" : ""}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {password && (
            <div className="space-y-1">
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${passwordStrength.strength}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {passwordStrength.label}
              </p>
            </div>
          )}
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Password must be at least 8 characters
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <Controller
              name="agreedToTerms"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="terms"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label
              htmlFor="terms"
              className="text-sm font-normal leading-tight"
            >
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                terms and conditions
              </a>
            </Label>
          </div>
          {errors.agreedToTerms && (
            <p className="text-sm text-destructive">
              {errors.agreedToTerms.message}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={previousStep}
            className="w-32"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            type="submit"
            className="relative flex-1"
            disabled={isLoading || (isRateLimited && countdown > 0)}
          >
            {isLoading && (
              <span className="absolute left-4">
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </span>
            )}
            {isLoading
              ? "Creating account..."
              : isRateLimited && countdown > 0
                ? `Please wait ${countdown}s...`
                : "Create account"}
          </Button>
        </div>

        {isEmailRateLimit && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <p className="mb-3 text-sm font-medium text-blue-900 dark:text-blue-100">
              Already have a verification code?
            </p>
            <Button
              type="button"
              onClick={() => {
                // Get the email and try to find the user
                fetch("/api/auth/debug-user", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.user?.id) {
                      // User exists, proceed to verification step
                      setEmailVerified(data.user.id);
                      nextStep();
                    } else {
                      alert(
                        "Could not find your account. Please try creating the account again or contact support."
                      );
                    }
                  })
                  .catch((err) => {
                    console.error(err);
                    alert("Error checking account. Please try again.");
                  });
              }}
              variant="outline"
              className="w-full border-blue-300 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-100"
            >
              I have my verification code →
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
