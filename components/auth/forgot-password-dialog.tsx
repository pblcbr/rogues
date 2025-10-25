"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ForgotPasswordDialogProps {
  children: React.ReactNode;
}

/**
 * Forgot Password form validation schema
 */
const resetPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Forgot Password Dialog
 * Modal for requesting password reset
 */
export function ForgotPasswordDialog({ children }: ForgotPasswordDialogProps) {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
    } catch (error: any) {
      console.error("Reset password error:", error);
      setErrorMessage(
        error.message || "Failed to send reset email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsSuccess(false);
    setErrorMessage("");
    reset();
  };

  if (!isOpen) {
    return <div onClick={() => setIsOpen(true)}>{children}</div>;
  }

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Reset your password
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isSuccess ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Check your email
                  </h3>
                  <p className="text-sm text-gray-600">
                    We&apos;ve sent you a password reset link. Please check your
                    inbox and follow the instructions.
                  </p>
                </div>
                <Button onClick={handleClose} className="w-full">
                  Got it
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter your email address and we&apos;ll send you a link to
                  reset your password.
                </p>

                {errorMessage && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{errorMessage}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@company.com"
                    {...register("email")}
                    className={errors.email ? "border-destructive" : ""}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
