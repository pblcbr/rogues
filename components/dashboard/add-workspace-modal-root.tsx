"use client";

import { useEffect, useState } from "react";
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
import {
  Loader2,
  X,
  CreditCard,
  Info,
  Sparkles,
  Globe,
  Building2,
} from "lucide-react";
import { useAddWorkspaceModalStore } from "./add-workspace-modal-store";

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

export function AddWorkspaceModalRoot() {
  const router = useRouter();
  const { isOpen, close } = useAddWorkspaceModalStore();
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    close();
    setErrorMessage("");
    setRegion("");
    setLanguage("");
    setSelectedPlan("starter");
    reset();
  };

  const onSubmit = async (data: WorkspaceFormData) => {
    setIsLoading(true);
    setErrorMessage("");
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
      const response = await fetch("/api/workspace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: data.brand_name,
          brand_website: data.brand_website,
          brand_description: data.brand_description || "",
          region,
          language,
          plan: selectedPlan,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create workspace");
      }

      handleClose();

      if (result.checkout_url) {
        window.location.href = result.checkout_url as string;
        return;
      }

      if (
        result.workspace?.id &&
        result.regionId &&
        typeof window !== "undefined"
      ) {
        sessionStorage.setItem(`generating_${result.regionId}`, "true");
        sessionStorage.setItem(
          `generating_workspace_created`,
          Date.now().toString()
        );
        setTimeout(() => {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(`generating_${result.regionId}`);
          }
        }, 90000);
      }

      if (result.workspace?.id) {
        try {
          const switchResponse = await fetch("/api/workspace/switch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId: result.workspace.id }),
          });

          if (switchResponse.ok) {
            window.location.href = "/dashboard";
            return;
          }
        } catch (error) {
          console.error(
            "[AddWorkspaceModal] Error switching workspace:",
            error
          );
        }
      }

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

  if (!mounted || !isOpen) return null;

  const modal = (
    <>
      {/* Full-screen overlay */}
      <div
        className="fixed inset-0 z-[90] bg-gray-900/80 backdrop-blur-sm"
        aria-hidden="true"
        onClick={handleClose}
      />

      {/* Full-screen modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div
          className="relative flex h-full w-full flex-col overflow-hidden bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-8 py-5">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="absolute right-6 top-5 rounded-full bg-white/80 p-2 opacity-70 transition-all hover:bg-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 disabled:pointer-events-none"
              type="button"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>

            <div className="pr-12">
              <div className="mb-1 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold leading-none tracking-tight text-gray-900">
                  Create New Workspace
                </h2>
              </div>
              <p className="mt-1.5 text-sm text-gray-600">
                Add a new workspace to manage another client or brand. Topics
                and prompts will be automatically generated.
              </p>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-1 overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1">
              {/* Left Column: Brand & Region */}
              <div className="flex w-1/2 flex-col border-r border-gray-200">
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  {errorMessage && (
                    <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-3">
                      <div className="flex items-start gap-2">
                        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                        <p className="text-sm text-destructive">
                          {errorMessage}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Brand Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Brand Information
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="brand_name">
                          Brand Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="brand_name"
                          placeholder="e.g., Acme Corp"
                          {...register("brand_name")}
                          className={
                            errors.brand_name ? "border-destructive" : ""
                          }
                          disabled={isLoading}
                        />
                        {errors.brand_name && (
                          <p className="text-xs text-destructive">
                            {errors.brand_name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="brand_website">
                          Brand Website{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="brand_website"
                          placeholder="e.g., acmecorp.com"
                          {...register("brand_website")}
                          className={
                            errors.brand_website ? "border-destructive" : ""
                          }
                          disabled={isLoading}
                        />
                        {errors.brand_website && (
                          <p className="text-xs text-destructive">
                            {errors.brand_website.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="brand_description">
                          Brand Description
                        </Label>
                        <Textarea
                          id="brand_description"
                          placeholder="Describe what your brand does..."
                          {...register("brand_description")}
                          className={
                            errors.brand_description ? "border-destructive" : ""
                          }
                          disabled={isLoading}
                          rows={3}
                        />
                        <p className="text-xs text-gray-500">
                          Helps generate more relevant topics and prompts
                        </p>
                        {errors.brand_description && (
                          <p className="text-xs text-destructive">
                            {errors.brand_description.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Region & Language */}
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Region & Language
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="region">
                          Region <span className="text-destructive">*</span>
                        </Label>
                        <Select value={region} onValueChange={setRegion}>
                          <SelectTrigger
                            id="region"
                            type="button"
                            className="w-full"
                            disabled={isLoading}
                          >
                            <SelectValue placeholder="Select a region" />
                          </SelectTrigger>
                          <SelectContent
                            className="z-[110]"
                            position="popper"
                            sideOffset={6}
                          >
                            {regions.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language">
                          Language <span className="text-destructive">*</span>
                        </Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger
                            id="language"
                            type="button"
                            className="w-full"
                            disabled={isLoading}
                          >
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent
                            className="z-[110]"
                            position="popper"
                            sideOffset={6}
                          >
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                            <SelectItem value="German">German</SelectItem>
                            <SelectItem value="Italian">Italian</SelectItem>
                            <SelectItem value="Portuguese">
                              Portuguese
                            </SelectItem>
                            <SelectItem value="Dutch">Dutch</SelectItem>
                            <SelectItem value="Japanese">Japanese</SelectItem>
                            <SelectItem value="Chinese">Chinese</SelectItem>
                            <SelectItem value="Korean">Korean</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Plan & Payment */}
              <div className="flex w-1/2 flex-col bg-gray-50/50">
                <div className="flex flex-1 flex-col overflow-y-auto px-8 py-6">
                  {/* Plan Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Select Plan
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {PLAN_OPTIONS.map((plan) => (
                        <button
                          key={plan.value}
                          type="button"
                          onClick={() => setSelectedPlan(plan.value)}
                          disabled={isLoading}
                          className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                            selectedPlan === plan.value
                              ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500 ring-offset-2"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold=str text-gray-900">
                                {plan.name}
                              </div>
                              <div className="mt-1 text-2xl font-bold text-gray-900">
                                {plan.price}
                              </div>
                              <div className="mt-1 text-sm text-gray-600">
                                {plan.prompts}
                              </div>
                            </div>
                            {selectedPlan === plan.value && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="mt-8">
                    <div className="rounded-lg border border-blue-200 bg-white p-5 shadow-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">
                          Payment Information
                        </h4>
                      </div>
                      <p className="mb-3 text-sm text-gray-600">
                        This workspace will be automatically charged to your
                        saved payment method on a monthly basis. The
                        subscription starts immediately.
                      </p>
                      <div className="rounded-md bg-blue-50 p-3 text-sm">
                        <p className="font-medium text-gray-900">
                          💳 Payment Method: Card on file
                        </p>
                        <p className="mt-1.5 text-xs text-gray-600">
                          To update your payment method, please{" "}
                          <a
                            href="mailto:support@tacmind.com"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            contact our support team
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer with Actions */}
                <div className="border-t border-gray-200 bg-white px-8 py-4">
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || !region || !language}
                      className="px-8"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Create Workspace
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
