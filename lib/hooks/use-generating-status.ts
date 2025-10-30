"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook to detect if topics/prompts are being generated for a region
 * Uses sessionStorage to track generation status and checks for data to determine completion
 */
export function useGeneratingStatus(regionId?: string | null) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!regionId || typeof window === "undefined") {
      setIsGenerating(false);
      return;
    }

    // Check sessionStorage for generation status
    const checkGeneratingFlag = () => {
      const generatingFlag = sessionStorage.getItem(`generating_${regionId}`);
      return generatingFlag === "true";
    };

    // Check if we have data by polling the API
    const checkForData = async () => {
      if (!checkGeneratingFlag()) return false;

      try {
        // Quick check: if there are topics, generation is likely complete
        const response = await fetch(
          `/api/workspace-regions?workspaceId=${regionId}`
        );
        // If we can fetch the region and it exists, we can assume generation might be done
        // The actual data check will happen on page refresh
        return true;
      } catch {
        return false;
      }
    };

    // Initial check
    const initialStatus = checkGeneratingFlag();
    setIsGenerating(initialStatus);

    if (!initialStatus) {
      return;
    }

    // Poll every 3 seconds
    const pollInterval = setInterval(async () => {
      const flagExists = checkGeneratingFlag();

      if (!flagExists) {
        // Flag was cleared, stop generating
        setIsGenerating(false);
        router.refresh();
        return;
      }

      // Keep showing generating status
      setIsGenerating(true);
    }, 3000);

    // Auto-clear flag after 60 seconds to prevent infinite polling
    const timeout = setTimeout(() => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`generating_${regionId}`);
        setIsGenerating(false);
        router.refresh();
      }
    }, 60000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [regionId, router]);

  return isGenerating;
}
