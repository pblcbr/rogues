"use client";

import { useEffect } from "react";
import { useGeneratingStatus } from "@/lib/hooks/use-generating-status";
import { TopicsTable } from "./topics-table";

interface TopicsTableWrapperProps {
  topics: Array<{
    id: string;
    name: string;
    is_selected: boolean;
    promptCount?: number;
    competitors?: string[];
    kpis?: {
      visibility_score: number;
      relevancy_score: number;
      avg_rank: number | null;
      best_rank: number | null;
      total_citations: number;
      total_prompts_measured: number;
      competitor_mentions: Record<string, number>;
      snapshot_date: string;
    } | null;
  }>;
  workspaceId: string;
  regionId?: string | null;
}

export function TopicsTableWrapper({
  topics,
  workspaceId,
  regionId,
}: TopicsTableWrapperProps) {
  const isGenerating = useGeneratingStatus(regionId);

  // Clear generating flag if we have topics (generation completed)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      regionId &&
      topics.length > 0 &&
      sessionStorage.getItem(`generating_${regionId}`) === "true"
    ) {
      sessionStorage.removeItem(`generating_${regionId}`);
    }
  }, [topics.length, regionId]);

  return (
    <TopicsTable
      topics={topics}
      workspaceId={workspaceId || ""}
      regionId={regionId || undefined}
      generating={isGenerating && topics.length === 0}
    />
  );
}
