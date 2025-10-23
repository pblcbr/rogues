"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface Prompt {
  id: string;
  prompt_text: string;
}

interface DeletePromptDialogProps {
  prompt: Prompt;
  children: React.ReactNode;
}

/**
 * Delete Prompt Dialog
 * Confirmation modal for deleting monitoring prompts
 */
export function DeletePromptDialog({
  prompt,
  children,
}: DeletePromptDialogProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("monitoring_prompts")
        .delete()
        .eq("id", prompt.id);

      if (error) throw error;

      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting prompt:", error);
      alert("Failed to delete prompt. Please try again.");
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
        <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-red-50 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Delete Prompt
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 p-6">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this prompt? This action cannot be
              undone.
            </p>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-900">
                {prompt.prompt_text}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              All associated results and data will also be deleted.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 p-6">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete Prompt"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
