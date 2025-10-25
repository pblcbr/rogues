"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AddWorkspaceDialogProps {
  children: React.ReactNode;
  onWorkspaceAdded?: () => void;
}

const workspaceSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companyDomain: z.string().min(2, "Domain is required").optional(),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

/**
 * Add Workspace Dialog
 * Allows agencies to create additional client workspaces
 */
export function AddWorkspaceDialog({
  children,
  onWorkspaceAdded,
}: AddWorkspaceDialogProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
  });

  const onSubmit = async (data: WorkspaceFormData) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          company_name: data.companyName,
          company_domain: data.companyDomain || data.companyName.toLowerCase(),
          owner_id: user.id,
          plan_id: "starter", // Default plan for new workspaces
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Add user as owner (trigger will do this automatically, but we ensure it)
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError && !memberError.message.includes("duplicate")) {
        throw memberError;
      }

      // Set as current workspace
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ current_workspace_id: workspace.id })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Success
      setIsOpen(false);
      reset();
      if (onWorkspaceAdded) onWorkspaceAdded();
      router.refresh();
    } catch (error: any) {
      console.error("Error creating workspace:", error);
      setErrorMessage(
        error.message || "Failed to create workspace. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setErrorMessage("");
    reset();
  };

  if (!isOpen) {
    return <div onClick={() => setIsOpen(true)}>{children}</div>;
  }

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Add New Workspace
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
            <p className="text-sm text-gray-600">
              Create a new workspace for managing another client or brand.
            </p>

            {errorMessage && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            )}

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="e.g., Acme Corp"
                {...register("companyName")}
                className={errors.companyName ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            {/* Company Domain */}
            <div className="space-y-2">
              <Label htmlFor="companyDomain">Domain (optional)</Label>
              <Input
                id="companyDomain"
                placeholder="e.g., acmecorp.com"
                {...register("companyDomain")}
                className={errors.companyDomain ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.companyDomain && (
                <p className="text-sm text-destructive">
                  {errors.companyDomain.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create workspace"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
