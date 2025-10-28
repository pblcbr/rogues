"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AddWorkspaceDialogProps {
  children: React.ReactNode;
  onWorkspaceAdded?: () => void;
}

const workspaceSchema = z.object({
  brand_name: z.string().min(2, "Brand name must be at least 2 characters"),
  brand_website: z.string().min(2, "Brand website is required"),
  brand_description: z.string().optional(),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

const PLAN_OPTIONS = [
  { value: "starter", name: "Starter", price: "$99/mo", prompts: "50 prompts" },
  { value: "growth", name: "Growth", price: "$399/mo", prompts: "100 prompts" },
];

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
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("starter");

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

    // Validate region, language, and plan
    if (!region) {
      setErrorMessage("Please select a region");
      setIsLoading(false);
      return;
    }
    if (!language) {
      setErrorMessage("Please select a language");
      setIsLoading(false);
      return;
    }
    if (!selectedPlan) {
      setErrorMessage("Please select a plan");
      setIsLoading(false);
      return;
    }

    try {
      // Call the new API endpoint
      const response = await fetch("/api/workspace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: data.brand_name,
          brand_website: data.brand_website,
          brand_description: data.brand_description || "",
          region: region,
          language: language,
          plan: selectedPlan,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create workspace");
      }

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
    setRegion("");
    setLanguage("");
    setSelectedPlan("starter");
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

            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="brand_name">Brand Name *</Label>
              <Input
                id="brand_name"
                placeholder="e.g., Acme Corp"
                {...register("brand_name")}
                className={errors.brand_name ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.brand_name && (
                <p className="text-sm text-destructive">
                  {errors.brand_name.message}
                </p>
              )}
            </div>

            {/* Brand Website */}
            <div className="space-y-2">
              <Label htmlFor="brand_website">Brand Website *</Label>
              <Input
                id="brand_website"
                placeholder="e.g., acmecorp.com"
                {...register("brand_website")}
                className={errors.brand_website ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.brand_website && (
                <p className="text-sm text-destructive">
                  {errors.brand_website.message}
                </p>
              )}
            </div>

            {/* Brand Description */}
            <div className="space-y-2">
              <Label htmlFor="brand_description">Brand Description</Label>
              <Textarea
                id="brand_description"
                placeholder="Describe what your brand does (e.g., SaaS for project management)"
                {...register("brand_description")}
                className={errors.brand_description ? "border-destructive" : ""}
                disabled={isLoading}
                rows={3}
              />
              {errors.brand_description && (
                <p className="text-sm text-destructive">
                  {errors.brand_description.message}
                </p>
              )}
            </div>

            {/* Plan Selection */}
            <div className="space-y-2">
              <Label>Plan *</Label>
              <div className="grid grid-cols-2 gap-3">
                {PLAN_OPTIONS.map((plan) => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => setSelectedPlan(plan.value)}
                    disabled={isLoading}
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      selectedPlan === plan.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">
                      {plan.name}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {plan.price}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {plan.prompts}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label>Region *</Label>
              <Select
                value={region}
                onValueChange={setRegion}
                disabled={isLoading}
              >
                <SelectTrigger
                  className={errors.region ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="United States">
                    🇺🇸 United States
                  </SelectItem>
                  <SelectItem value="United Kingdom">
                    🇬🇧 United Kingdom
                  </SelectItem>
                  <SelectItem value="Spain">🇪🇸 Spain</SelectItem>
                  <SelectItem value="France">🇫🇷 France</SelectItem>
                  <SelectItem value="Germany">🇩🇪 Germany</SelectItem>
                  <SelectItem value="Italy">🇮🇹 Italy</SelectItem>
                  <SelectItem value="Portugal">🇵🇹 Portugal</SelectItem>
                  <SelectItem value="Netherlands">🇳🇱 Netherlands</SelectItem>
                  <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                  <SelectItem value="Mexico">🇲🇽 Mexico</SelectItem>
                  <SelectItem value="Brazil">🇧🇷 Brazil</SelectItem>
                  <SelectItem value="Argentina">🇦🇷 Argentina</SelectItem>
                  <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                  <SelectItem value="India">🇮🇳 India</SelectItem>
                  <SelectItem value="Singapore">🇸🇬 Singapore</SelectItem>
                  <SelectItem value="Japan">🇯🇵 Japan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label>Language *</Label>
              <Select
                value={language}
                onValueChange={setLanguage}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English (en)">English (en)</SelectItem>
                  <SelectItem value="Spanish (es)">Spanish (es)</SelectItem>
                  <SelectItem value="French (fr)">French (fr)</SelectItem>
                  <SelectItem value="German (de)">German (de)</SelectItem>
                  <SelectItem value="Italian (it)">Italian (it)</SelectItem>
                  <SelectItem value="Portuguese (pt)">
                    Portuguese (pt)
                  </SelectItem>
                  <SelectItem value="Dutch (nl)">Dutch (nl)</SelectItem>
                  <SelectItem value="Japanese (ja)">Japanese (ja)</SelectItem>
                  <SelectItem value="Chinese (zh)">Chinese (zh)</SelectItem>
                  <SelectItem value="Korean (ko)">Korean (ko)</SelectItem>
                </SelectContent>
              </Select>
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
