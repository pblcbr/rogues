"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import type { WorkspaceRole } from "@/lib/utils/permissions";
import { canEditWorkspace } from "@/lib/utils/permissions";
import { LLMSelector } from "./llm-selector";
import { useRouter } from "next/navigation";

interface WorkspaceGeneralTabProps {
  workspace: any;
  user: any;
  userRole?: WorkspaceRole | null;
}

/**
 * Workspace General Tab
 * Manage workspace information and settings
 */
export function WorkspaceGeneralTab({
  workspace,
  user,
  userRole,
}: WorkspaceGeneralTabProps) {
  const [brandName, setBrandName] = useState(workspace?.brand_name || "");
  const [brandWebsite, setBrandWebsite] = useState(
    workspace?.brand_website || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const { success, error: showError } = useToast();
  const canEdit = canEditWorkspace(userRole);

  const handleLLMUpdate = () => {
    // Refresh the page to load updated LLM settings
    router.refresh();
    success(
      "LLMs Updated",
      "Your active LLM engines have been updated successfully"
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!brandName.trim()) {
      showError("Validation Error", "Brand name is required");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("workspaces")
        .update({
          brand_name: brandName.trim(),
          brand_website: brandWebsite.trim(),
        })
        .eq("id", workspace?.id);

      if (error) throw error;

      success(
        "Workspace Updated",
        "Your workspace information has been saved successfully"
      );
    } catch (err: any) {
      showError("Error", err.message || "Failed to save workspace information");
    } finally {
      setIsLoading(false);
    }
  };

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          No Workspace Selected
        </h3>
        <p className="max-w-md text-sm text-gray-500">
          Please select or create a workspace to manage workspace settings.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Permission Notice */}
      {!canEdit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                View-Only Access
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Only workspace admins and owners can edit these settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Brand Information */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Brand Information
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Basic information about your brand and workspace
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand-name">
            Brand Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="brand-name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            disabled={!canEdit || isLoading}
            placeholder="e.g., Acme Corporation"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand-website">Brand Website</Label>
          <Input
            id="brand-website"
            type="url"
            value={brandWebsite}
            onChange={(e) => setBrandWebsite(e.target.value)}
            disabled={!canEdit || isLoading}
            placeholder="e.g., acmecorp.com"
          />
          <p className="text-xs text-gray-500">
            Your main website URL (without http:// or https://)
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* LLM Configuration */}
      <LLMSelector
        workspace={workspace}
        userRole={userRole}
        onUpdate={handleLLMUpdate}
      />

      {/* Divider */}
      {canEdit && <div className="border-t border-gray-200" />}

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="text-red-500">*</span> Required fields
          </p>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
