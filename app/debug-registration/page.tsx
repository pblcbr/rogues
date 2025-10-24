"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Info, Trash2 } from "lucide-react";

export default function DebugRegistrationPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkUserStatus = async () => {
    if (!email) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/auth/debug-user?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check user status");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const deleteUnverifiedUser = async () => {
    if (!email) {
      setError("Please enter an email address");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this unverified user? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/auth/debug-user?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      setResult(data);
      alert(
        "User deleted successfully! You can now try registering again with this email."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Registration Debug Tool</h1>
          <p className="mt-2 text-muted-foreground">
            Use this tool to diagnose and fix registration issues
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkUserStatus()}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={checkUserStatus}
                disabled={loading || !email}
                className="flex-1"
              >
                {loading ? "Checking..." : "Check Status"}
              </Button>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="border-destructive bg-destructive/10 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">Error</h3>
                <p className="mt-1 text-sm text-destructive">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {result && (
          <Card className="p-6">
            {!result.exists ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                <div>
                  <h3 className="font-semibold">User Does Not Exist</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This email is not registered. You can proceed with
                    registration.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 flex-shrink-0 text-blue-500" />
                  <div className="flex-1">
                    <h3 className="font-semibold">User Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.message}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">User ID:</span>
                    <span className="font-mono text-xs">{result.user.id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Email:</span>
                    <span>{result.user.email}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Email Confirmed:</span>
                    <span
                      className={
                        result.user.isConfirmed
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {result.user.isConfirmed ? "Yes" : "No"}
                    </span>
                  </div>
                  {result.user.emailConfirmedAt && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Confirmed At:</span>
                      <span>
                        {new Date(
                          result.user.emailConfirmedAt
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Created At:</span>
                    <span>
                      {new Date(result.user.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!result.user.isConfirmed && (
                  <div className="space-y-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-destructive">
                          Email Not Verified
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          This user exists but the email has not been verified.
                          You can delete this user to register again.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteUnverifiedUser}
                      disabled={loading}
                      className="w-full"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {loading
                        ? "Deleting..."
                        : "Delete Unverified User & Retry"}
                    </Button>
                  </div>
                )}

                {result.user.isConfirmed && (
                  <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      This user is verified and active. If you're having login
                      issues, try resetting your password instead.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Troubleshooting Tips */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Common Issues & Solutions
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold">
                1. Not Receiving Verification Email
              </h3>
              <ul className="ml-4 mt-1 list-disc space-y-1 text-muted-foreground">
                <li>Check your spam/junk folder</li>
                <li>Wait 60 seconds between resend attempts (rate limiting)</li>
                <li>Verify your email address is spelled correctly</li>
                <li>Add noreply@supabase.io to your contacts</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">2. "User Already Exists" Error</h3>
              <ul className="ml-4 mt-1 list-disc space-y-1 text-muted-foreground">
                <li>Use this tool to check if the user exists</li>
                <li>If email is not verified, delete the user and try again</li>
                <li>If email is verified, try logging in or reset password</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">
                3. Multiple Registration Attempts
              </h3>
              <ul className="ml-4 mt-1 list-disc space-y-1 text-muted-foreground">
                <li>Supabase rate limits to 60 seconds between emails</li>
                <li>After 3 attempts, wait 5-10 minutes before trying again</li>
                <li>Clear browser cache and cookies if issues persist</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">4. SMTP Configuration Issues</h3>
              <ul className="ml-4 mt-1 list-disc space-y-1 text-muted-foreground">
                <li>
                  Check Supabase Dashboard → Authentication → Email Templates
                </li>
                <li>Verify SMTP settings are configured correctly</li>
                <li>
                  Test email delivery from Supabase Dashboard → Authentication →
                  Users → Invite User
                </li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="border-blue-500/50 bg-blue-500/10 p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 flex-shrink-0 text-blue-500" />
            <div>
              <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                Need More Help?
              </h3>
              <p className="mt-1 text-sm text-blue-600 dark:text-blue-300">
                If you continue to have issues after using this tool:
              </p>
              <ul className="ml-4 mt-2 list-disc space-y-1 text-sm text-blue-600 dark:text-blue-300">
                <li>Check the Supabase Dashboard for error logs</li>
                <li>Review the SMTP setup documentation in /docs</li>
                <li>Contact support with your user ID from above</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
