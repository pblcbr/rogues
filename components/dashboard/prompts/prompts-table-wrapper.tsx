"use client";

import { useEffect, useState } from "react";
import { useGeneratingStatus } from "@/lib/hooks/use-generating-status";
import { PromptsTable } from "./prompts-table";

interface PromptsTableWrapperProps {
  prompts: Array<{
    id: string;
    prompt_text: string;
    category?: string;
    is_active: boolean;
    created_at: string;
    is_pinned?: boolean;
    topics?: { name: string };
    visibilityScore?: number | null;
    mentionRate?: number | null;
    citationRate?: number | null;
    avgPosition?: string | null;
    snapshotDate?: string | null;
  }>;
  cap?: number;
  regionId?: string | null;
  workspaceId: string;
  brandName: string;
}

export function PromptsTableWrapper({
  prompts,
  cap,
  regionId,
  workspaceId,
  brandName,
}: PromptsTableWrapperProps) {
  const isGenerating = useGeneratingStatus(regionId);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Clear generating flag if we have prompts (generation completed)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      regionId &&
      prompts.length > 0 &&
      sessionStorage.getItem(`generating_${regionId}`) === "true"
    ) {
      sessionStorage.removeItem(`generating_${regionId}`);
    }
  }, [prompts.length, regionId]);

  const handleFilterChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  return (
    <PromptsTable
      prompts={prompts}
      cap={cap}
      generating={isGenerating && prompts.length === 0}
      workspaceId={workspaceId}
      regionId={regionId}
      brandName={brandName}
      dateFrom={dateFrom}
      dateTo={dateTo}
      onFilterChange={handleFilterChange}
    />
  );
}
