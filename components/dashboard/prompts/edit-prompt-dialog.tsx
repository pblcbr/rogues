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

interface Prompt {
  id: string;
  prompt_text: string;
  category?: string;
  is_active: boolean;
}

interface EditPromptDialogProps {
  prompt: Prompt;
  children: React.ReactNode;
}

/**
 * Edit Prompt Dialog
 * Modal for editing existing monitoring prompts
 */
export function EditPromptDialog({ prompt, children }: EditPromptDialogProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [promptText, setPromptText] = useState(prompt.prompt_text);
  const [category, setCategory] = useState(prompt.category || "comparison");
  const [isActive, setIsActive] = useState(prompt.is_active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("monitoring_prompts")
        .update({
          prompt_text: promptText,
          category,
          is_active: isActive,
        })
        .eq("id", prompt.id);

      if (error) throw error;

      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating prompt:", error);
      alert("Failed to update prompt. Please try again.");
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
              Edit Monitoring Prompt
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
                required
                className="mt-1"
              />
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
                Active
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
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
