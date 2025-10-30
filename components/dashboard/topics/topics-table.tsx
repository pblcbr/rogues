"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { AddTopicDialog } from "./add-topic-dialog";
import {
  Play,
  Pause,
  TrendingUp,
  Target,
  BarChart3,
  HelpCircle,
  Plus,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Topic {
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
}

interface TopicsTableProps {
  topics: Topic[];
  workspaceId: string;
  regionId?: string;
  generating?: boolean;
}

/**
 * Topics Table Component
 * Displays monitoring topics with AEO visibility KPIs
 */
export function TopicsTable({
  topics,
  generating,
  workspaceId,
  regionId,
}: TopicsTableProps) {
  const router = useRouter();
  const [localTopics, setLocalTopics] = useState(topics);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

  const handleToggleActive = async (topic: Topic) => {
    setLocalTopics((prev) =>
      prev.map((t) =>
        t.id === topic.id ? { ...t, is_selected: !t.is_selected } : t
      )
    );

    try {
      const response = await fetch("/api/topics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topic.id,
          is_selected: !topic.is_selected,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update topic");
      }

      // Refresh the page to update prompts table if topic was deactivated
      if (!topic.is_selected) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating topic:", error);
      setLocalTopics(topics); // Revert on error
    }
  };

  const handleSelectAll = () => {
    if (selectedTopics.size === localTopics.length) {
      setSelectedTopics(new Set());
    } else {
      setSelectedTopics(new Set(localTopics.map((t) => t.id)));
    }
  };

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const handleBulkActivate = async () => {
    const selectedIds = Array.from(selectedTopics);
    setLocalTopics((prev) =>
      prev.map((t) =>
        selectedIds.includes(t.id) ? { ...t, is_selected: true } : t
      )
    );
    await Promise.all(
      selectedIds.map((id) =>
        fetch("/api/topics", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId: id, is_selected: true }),
        })
      )
    );
    setSelectedTopics(new Set());
    router.refresh();
  };

  const handleBulkDeactivate = async () => {
    const selectedIds = Array.from(selectedTopics);
    setLocalTopics((prev) =>
      prev.map((t) =>
        selectedIds.includes(t.id) ? { ...t, is_selected: false } : t
      )
    );
    await Promise.all(
      selectedIds.map((id) =>
        fetch("/api/topics", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId: id, is_selected: false }),
        })
      )
    );
    setSelectedTopics(new Set());
    router.refresh();
  };

  if (topics.length === 0 && generating) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Generating topics...
          </h3>
          <p className="mb-6 text-sm text-gray-600">
            We're creating AI-powered topics for your brand. This may take a few
            seconds.
          </p>
        </div>
      </div>
    );
  }

  const activeTopics = localTopics.filter((t) => t.is_selected).length;
  const totalTopics = localTopics.length;
  const coverageRate = totalTopics > 0 ? (activeTopics / totalTopics) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">
              Active Topics
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {activeTopics}
            <span className="ml-1 text-sm font-medium text-gray-500">
              / {totalTopics}
            </span>
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Coverage</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {coverageRate.toFixed(0)}%
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">
              Total Prompts
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {localTopics.reduce((sum, t) => sum + (t.promptCount || 0), 0)}
          </p>
        </div>
      </div>

      {/* Bulk Selector */}
      {localTopics.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={
                selectedTopics.size === localTopics.length &&
                localTopics.length > 0
              }
              onCheckedChange={handleSelectAll}
            />
            {selectedTopics.size > 0
              ? `${selectedTopics.size} selected`
              : "Select all"}
          </label>
          {selectedTopics.size > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleBulkActivate}>
                <Play className="mr-2 h-4 w-4" />
                Activate {selectedTopics.size}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDeactivate}
              >
                <Pause className="mr-2 h-4 w-4" />
                Deactivate {selectedTopics.size}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTopics(new Set())}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Topics Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="w-12 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <span className="sr-only">Expand</span>
                </th>
                <th className="w-12 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Topic
                </th>
                <th className="w-32 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  <Tooltip
                    content="% of AI responses that mention your brand"
                    side="top"
                  >
                    <div className="flex cursor-help items-center justify-center gap-1">
                      Visibility
                      <HelpCircle className="h-3 w-3" />
                    </div>
                  </Tooltip>
                </th>
                <th className="w-32 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  <Tooltip
                    content="% of responses mentioning your brand or competitors"
                    side="top"
                  >
                    <div className="flex cursor-help items-center justify-center gap-1">
                      Relevancy
                      <HelpCircle className="h-3 w-3" />
                    </div>
                  </Tooltip>
                </th>
                <th className="w-32 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  <Tooltip
                    content="Average position where your brand appears (lower is better)"
                    side="top"
                  >
                    <div className="flex cursor-help items-center justify-center gap-1">
                      Avg Rank
                      <HelpCircle className="h-3 w-3" />
                    </div>
                  </Tooltip>
                </th>
                <th className="w-28 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  <Tooltip
                    content="Number of URLs cited across all responses"
                    side="top"
                  >
                    <div className="flex cursor-help items-center justify-center gap-1">
                      Citations
                      <HelpCircle className="h-3 w-3" />
                    </div>
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {localTopics.map((topic) => {
                const isExpanded = expandedTopics.has(topic.id);
                const kpis = topic.kpis;

                // Helper function to get score color
                const getScoreColor = (score: number) => {
                  if (score >= 70) return "text-green-600 bg-green-50";
                  if (score >= 40) return "text-yellow-600 bg-yellow-50";
                  return "text-gray-600 bg-gray-50";
                };

                const getRankColor = (rank: number | null) => {
                  if (!rank) return "text-gray-400";
                  if (rank <= 2) return "text-green-600";
                  if (rank <= 5) return "text-yellow-600";
                  return "text-gray-600";
                };

                return (
                  <tr
                    key={topic.id}
                    className={cn(
                      "transition-colors",
                      topic.is_selected
                        ? "bg-white hover:bg-blue-50/50"
                        : "bg-gray-50/50 opacity-70 hover:bg-gray-100/50"
                    )}
                  >
                    <td
                      className="cursor-pointer px-4 py-4"
                      onClick={() => {
                        const newExpanded = new Set(expandedTopics);
                        if (isExpanded) {
                          newExpanded.delete(topic.id);
                        } else {
                          newExpanded.add(topic.id);
                        }
                        setExpandedTopics(newExpanded);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </td>
                    <td
                      className="px-4 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedTopics.has(topic.id)}
                        onCheckedChange={() => handleSelectTopic(topic.id)}
                        aria-label="Select topic for bulk actions"
                      />
                    </td>
                    <td
                      className="cursor-pointer px-4 py-4"
                      onClick={() => {
                        const newExpanded = new Set(expandedTopics);
                        if (isExpanded) {
                          newExpanded.delete(topic.id);
                        } else {
                          newExpanded.add(topic.id);
                        }
                        setExpandedTopics(newExpanded);
                      }}
                    >
                      <div className="space-y-1">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            topic.is_selected
                              ? "text-gray-900"
                              : "text-gray-500"
                          )}
                          title={topic.name}
                        >
                          {topic.name}
                        </p>
                        <div className="flex items-center gap-2">
                          {topic.competitors &&
                            topic.competitors.length > 0 && (
                              <div className="flex items-center gap-1">
                                {topic.competitors
                                  .slice(0, 3)
                                  .map((comp, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="px-1.5 py-0 text-[10px]"
                                    >
                                      {comp}
                                    </Badge>
                                  ))}
                                {topic.competitors.length > 3 && (
                                  <span className="text-[10px] text-gray-500">
                                    +{topic.competitors.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          <Badge
                            variant="secondary"
                            className="px-1.5 py-0 text-[10px]"
                          >
                            {topic.promptCount || 0} prompts
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-4 py-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {kpis ? (
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-sm font-semibold",
                              getScoreColor(kpis.visibility_score)
                            )}
                          >
                            {kpis.visibility_score}%
                          </span>
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={cn(
                                "h-full transition-all",
                                kpis.visibility_score >= 70
                                  ? "bg-green-500"
                                  : kpis.visibility_score >= 40
                                    ? "bg-yellow-500"
                                    : "bg-gray-400"
                              )}
                              style={{ width: `${kpis.visibility_score}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {kpis ? (
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-sm font-semibold",
                              getScoreColor(kpis.relevancy_score)
                            )}
                          >
                            {kpis.relevancy_score}%
                          </span>
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={cn(
                                "h-full transition-all",
                                kpis.relevancy_score >= 70
                                  ? "bg-green-500"
                                  : kpis.relevancy_score >= 40
                                    ? "bg-yellow-500"
                                    : "bg-gray-400"
                              )}
                              style={{ width: `${kpis.relevancy_score}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {kpis && kpis.avg_rank !== null ? (
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            getRankColor(kpis.avg_rank)
                          )}
                        >
                          #{kpis.avg_rank.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {kpis ? (
                        <span className="text-sm font-medium text-gray-900">
                          {kpis.total_citations}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {/* Add new topic row */}
              <tr className="border-t-2 border-gray-300 hover:bg-gray-50">
                <td colSpan={7} className="px-4 py-2">
                  <AddTopicDialog workspaceId={workspaceId} regionId={regionId}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-600 hover:text-gray-900"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add new topic
                    </Button>
                  </AddTopicDialog>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
