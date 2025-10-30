"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AddPromptDialogProps {
  workspaceId: string;
  regionId?: string | null;
  children: React.ReactNode;
  onPromptAdded?: (prompt: any) => void;
}

/**
 * Add Prompt Dialog
 * Modal for creating new monitoring prompts
 */
export function AddPromptDialog({
  workspaceId,
  regionId,
  children,
  onPromptAdded,
}: AddPromptDialogProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [category, setCategory] = useState("comparison");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // If no regionId is provided, try to get the default region for this workspace
      let regionIdToUse = regionId;

      if (!regionIdToUse) {
        const { data: defaultRegion } = await supabase
          .from("workspace_regions")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("is_default", true)
          .single();

        regionIdToUse = defaultRegion?.id;
      }

      const { data, error } = await supabase
        .from("monitoring_prompts")
        .insert({
          workspace_id: workspaceId,
          workspace_region_id: regionIdToUse || null,
          prompt_text: promptText,
          category,
          is_active: isActive,
          source: "custom",
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // Call the callback to update the table immediately
      if (onPromptAdded && data) {
        onPromptAdded(data);
      }

      setIsOpen(false);
      setPromptText("");
      router.refresh();
    } catch (error) {
      console.error("Error adding prompt:", error);
      alert(
        `Failed to add prompt: ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return <div onClick={() => setIsOpen(true)}>{children}</div>;
  }

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Add Monitoring Prompt
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div>
              <Label htmlFor="prompt">Prompt Text</Label>
              <Input
                id="prompt"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="e.g., best project management software for startups"
                required
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter a natural question that users might ask AI assistants
              </p>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comparison">Comparison</SelectItem>
                  <SelectItem value="recommendation">Recommendation</SelectItem>
                  <SelectItem value="solution">Solution</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="informational">Informational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked as boolean)}
              />
              <Label htmlFor="active" className="cursor-pointer">
                Activate immediately
              </Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Prompt"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
