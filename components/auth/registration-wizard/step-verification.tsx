"use client";

import { useState, useEffect } from "react";
import { useRegistrationStore } from "@/stores/registration";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "../progress-indicator";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

/**
 * Step 4: Email Verification
 * 6-digit OTP verification
 */
export function StepVerification() {
  const { email, nextStep } = useRegistrationStore();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Start countdown on mount
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Move to next step
      nextStep();
    } catch (error) {
      console.error("Verification error:", error);
      alert(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setCanResend(false);
      setCountdown(60);
      // Restart countdown...
    } catch (error) {
      console.error("Resend error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={4} totalSteps={8} />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Verify your email</h1>
        <p className="text-muted-foreground">
          We sent it to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              if (value.length === 6) {
                // Auto-verify when 6 digits entered
                setTimeout(() => handleVerify(), 100);
              }
            }}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="text-center">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-primary hover:underline"
            >
              Resend code
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Resend in {countdown}s
            </p>
          )}
        </div>

        <Button
          onClick={handleVerify}
          className="w-full"
          disabled={otp.length !== 6 || isLoading}
        >
          {isLoading ? "Verifying..." : "Verify"}
        </Button>
      </div>
    </div>
  );
}
