"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

/**
 * Step 3: Create Account
 * Collects user details and creates Supabase account
 */
export function StepAccount() {
  const { email, setAccountInfo, setEmailVerified, nextStep, previousStep } =
    useRegistrationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
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
    setIsLoading(true);
    try {
      // Call Supabase signup
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Store account info and user ID
      setAccountInfo(data.firstName, data.lastName);
      setEmailVerified(result.userId);
      nextStep();
    } catch (error) {
      console.error("Signup error:", error);
      alert(error instanceof Error ? error.message : "Signup failed");
    } finally {
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

        <div className="flex items-start space-x-2">
          <Checkbox id="terms" {...register("agreedToTerms")} />
          <Label htmlFor="terms" className="text-sm font-normal leading-tight">
            I agree to the{" "}
            <a href="#" className="underline hover:text-primary">
              terms and conditions
            </a>
          </Label>
        </div>
        {errors.agreedToTerms && (
          <p className="text-sm text-destructive">
            {errors.agreedToTerms.message}
          </p>
        )}

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
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </div>
      </form>
    </div>
  );
}
