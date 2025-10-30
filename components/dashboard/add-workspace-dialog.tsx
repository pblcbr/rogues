"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { Loader2, X } from "lucide-react";

const regions = [
  { value: "United States", label: "🇺🇸 United States" },
  { value: "United Kingdom", label: "🇬🇧 United Kingdom" },
  { value: "Spain", label: "🇪🇸 Spain" },
  { value: "France", label: "🇫🇷 France" },
  { value: "Germany", label: "🇩🇪 Germany" },
  { value: "Italy", label: "🇮🇹 Italy" },
  { value: "Portugal", label: "🇵🇹 Portugal" },
  { value: "Netherlands", label: "🇳🇱 Netherlands" },
  { value: "Canada", label: "🇨🇦 Canada" },
  { value: "Mexico", label: "🇲🇽 Mexico" },
  { value: "Brazil", label: "🇧🇷 Brazil" },
  { value: "Argentina", label: "🇦🇷 Argentina" },
  { value: "Australia", label: "🇦🇺 Australia" },
  { value: "India", label: "🇮🇳 India" },
  { value: "Singapore", label: "🇸🇬 Singapore" },
  { value: "Japan", label: "🇯🇵 Japan" },
];

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
 * Custom modal implementation for better control
 */
export function AddWorkspaceDialog({
  children,
  onWorkspaceAdded,
}: AddWorkspaceDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Note: No global capture-phase event guards; they can block Radix Select from opening

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
      // Call the API endpoint
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
      handleClose();
      if (onWorkspaceAdded) onWorkspaceAdded();
      router.refresh();
    } catch (error) {
      console.error("Error creating workspace:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to create workspace. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    console.log("[AddWorkspaceDialog] handleClose");
    setIsOpen(false);
    setErrorMessage("");
    setRegion("");
    setLanguage("");
    setSelectedPlan("starter");
    reset();
  };

  const handleOpen = () => {
    console.log("[AddWorkspaceDialog] handleOpen");
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <div onClick={handleOpen} className="cursor-pointer">
        {children}
      </div>
    );
  }

  const modal = (
    <>
      {/* Backdrop */}
      <div
        className="pointer-events-none fixed inset-0 z-40 bg-black/80"
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        data-add-workspace-modal-root="true"
      >
        <div
          className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none"
            type="button"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          {/* Modal Content */}
          <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                Add New Workspace
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Create a new workspace for managing another client or brand.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                console.log("[AddWorkspaceDialog] form submit");
                return handleSubmit(onSubmit)(e);
              }}
              className="space-y-4"
            >
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
                  className={
                    errors.brand_description ? "border-destructive" : ""
                  }
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
                <Label htmlFor="region">Region</Label>
                <Select
                  value={region}
                  onValueChange={(v) => {
                    console.log("[RegionSelect] onValueChange:", v);
                    setRegion(v);
                  }}
                  onOpenChange={(open) =>
                    console.log("[RegionSelect] onOpenChange:", open)
                  }
                >
                  <SelectTrigger type="button">
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent
                    className="pointer-events-auto z-[80]"
                    position="popper"
                    sideOffset={6}
                    onPointerDown={(e) =>
                      console.log(
                        "[RegionSelectContent] pointerDown target:",
                        (e.target as HTMLElement).tagName
                      )
                    }
                  >
                    {regions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label>Language *</Label>
                <Select
                  value={language}
                  onValueChange={(v) => {
                    console.log("[LanguageSelect] onValueChange:", v);
                    setLanguage(v);
                  }}
                  onOpenChange={(open) =>
                    console.log("[LanguageSelect] onOpenChange:", open)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger type="button">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent
                    className="pointer-events-auto z-[80]"
                    position="popper"
                    sideOffset={6}
                    onPointerDown={(e) =>
                      console.log(
                        "[LanguageSelectContent] pointerDown target:",
                        (e.target as HTMLElement).tagName
                      )
                    }
                  >
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Italian">Italian</SelectItem>
                    <SelectItem value="Portuguese">Portuguese</SelectItem>
                    <SelectItem value="Dutch">Dutch</SelectItem>
                    <SelectItem value="Japanese">Japanese</SelectItem>
                    <SelectItem value="Chinese">Chinese</SelectItem>
                    <SelectItem value="Korean">Korean</SelectItem>
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
      </div>
    </>
  );

  if (!mounted) return null;

  return createPortal(modal, document.body);
}
