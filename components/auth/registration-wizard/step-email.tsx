"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  emailSchema,
  type EmailFormData,
} from "@/lib/validations/registration";
import { useRegistrationStore } from "@/stores/registration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Step 1: Email Capture
 * Validates business email and stores in registration state
 */
export function StepEmail() {
  const { setEmail, nextStep } = useRegistrationStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      // Store email and move to next step
      setEmail(data.email);
      nextStep();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          What&apos;s your email?
        </h1>
        <p className="text-muted-foreground">Create your account or sign in.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Loading..." : "Continue"}
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-muted/50 p-6">
        <h3 className="mb-2 font-semibold">Want a demo?</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Schedule a call with one of our experts
        </p>
        <Button variant="outline" className="w-full">
          Schedule a Call →
        </Button>
      </div>
    </div>
  );
}
