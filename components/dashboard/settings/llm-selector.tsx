"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_LLMS, getAvailableLLMsForPlan } from "@/lib/constants";
import { getPlanById } from "@/lib/stripe/plans";
import { Loader2, Check, AlertCircle } from "lucide-react";
import type { WorkspaceRole } from "@/lib/utils/permissions";
import { canEditWorkspace } from "@/lib/utils/permissions";
import { useToast } from "@/lib/hooks/use-toast";

interface LLMSelectorProps {
  workspace: any;
  userRole?: WorkspaceRole | null;
  onUpdate?: () => void;
}

/**
 * LLM Selector Component
 * Allows users to select which LLM providers to use based on their plan
 */
export function LLMSelector({
  workspace,
  userRole,
  onUpdate,
}: LLMSelectorProps) {
  const [activeLLMs, setActiveLLMs] = useState<string[]>(
    workspace?.active_llms || ["openai"]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();
  const canEdit = canEditWorkspace(userRole);

  // Get plan limits
  const plan = getPlanById(workspace?.plan || "starter");
  const maxEngines = plan?.limits.engines || 1;
  const availableLLMs = getAvailableLLMsForPlan(maxEngines);

  const handleToggle = (llmId: string) => {
    if (!canEdit) return;

    setActiveLLMs((current) => {
      const newSelection = current.includes(llmId)
        ? current.filter((id) => id !== llmId)
        : [...current, llmId];

      // Ensure at least one LLM is selected
      if (newSelection.length === 0) {
        setError("At least one LLM must be selected");
        return current;
      }

      // Check plan limits
      if (maxEngines !== -1 && newSelection.length > maxEngines) {
        setError(`Your plan allows up to ${maxEngines} LLM engine(s)`);
        return current;
      }

      setError(null);
      return newSelection;
    });
  };

  const handleSave = async () => {
    if (!canEdit) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use API endpoint instead of direct update
      const response = await fetch("/api/workspace/update-llms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: workspace.id,
          activeLLMs,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update LLMs");
      }

      // Show success message
      success(
        "LLM Engines Updated",
        `Successfully configured ${activeLLMs.length} LLM engine${activeLLMs.length !== 1 ? "s" : ""} for this workspace`
      );

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Error updating LLMs:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update LLM engines";
      setError(errorMessage);
      showError("Update Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges =
    JSON.stringify(activeLLMs.sort()) !==
    JSON.stringify((workspace?.active_llms || ["openai"]).sort());

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Active LLM Engines</h3>
        <p className="text-sm text-gray-600">
          Select which AI models to use for monitoring. Your plan allows{" "}
          {maxEngines === -1 ? "unlimited" : maxEngines} engine
          {maxEngines !== 1 ? "s" : ""}.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        {AVAILABLE_LLMS.map((llm) => {
          const isAvailable = availableLLMs.some((a) => a.id === llm.id);
          const isSelected = activeLLMs.includes(llm.id);
          const isDisabled = !canEdit || !isAvailable || llm.comingSoon;

          return (
            <div
              key={llm.id}
              className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                isSelected
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200 bg-white"
              } ${isDisabled ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  id={llm.id}
                  checked={isSelected}
                  onCheckedChange={() => handleToggle(llm.id)}
                  disabled={isDisabled}
                />
                <img
                  src={llm.icon}
                  alt={llm.name}
                  className="h-8 w-8 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div>
                  <label
                    htmlFor={llm.id}
                    className={`font-semibold ${
                      isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    {llm.name}
                  </label>
                  <p className="text-xs text-gray-500">{llm.provider}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSelected && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                )}
                {llm.comingSoon && (
                  <Badge
                    variant="outline"
                    className="border-orange-300 text-orange-700"
                  >
                    Coming Soon
                  </Badge>
                )}
                {!isAvailable && !llm.comingSoon && (
                  <Badge
                    variant="outline"
                    className="border-gray-300 text-gray-600"
                  >
                    Upgrade Required
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {canEdit && hasChanges && (
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setActiveLLMs(workspace?.active_llms || ["openai"])}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
