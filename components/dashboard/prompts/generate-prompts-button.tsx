"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface GeneratePromptsButtonProps {
  workspaceId: string;
}

/**
 * Client-side button to generate prompts from topics via API
 */
export function GeneratePromptsButton({
  workspaceId,
}: GeneratePromptsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!workspaceId) {
      alert("Workspace ID not found");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/prompts/generate-from-topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate prompts");
      }

      // Silent success - just refresh
      router.refresh();
    } catch (error) {
      console.error("Error generating prompts:", error);
      alert(
        error instanceof Error ? error.message : "Failed to generate prompts"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={isLoading} variant="secondary">
      <RefreshCw
        className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
      />
      Generate from topics
    </Button>
  );
}
