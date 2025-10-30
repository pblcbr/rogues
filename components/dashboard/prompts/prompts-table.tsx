"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import { EditPromptDialog } from "./edit-prompt-dialog";
import { DeletePromptDialog } from "./delete-prompt-dialog";
import { AddPromptDialog } from "./add-prompt-dialog";
import { PromptsDateFilter } from "./prompts-date-filter";
import {
  Play,
  Pause,
  Edit,
  Trash2,
  TrendingUp,
  HelpCircle,
  Target,
  BarChart3,
  Activity,
  Plus,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PromptResultsDetail } from "./prompt-results-detail";

interface Prompt {
  id: string;
  prompt_text: string;
  category?: string;
  is_active: boolean;
  is_pinned?: boolean;
  created_at: string;
  topics?: { name: string };
  visibilityScore?: number | null;
  mentionRate?: number | null;
  citationRate?: number | null;
  avgPosition?: string | null;
  snapshotDate?: string | null;
}

interface PromptsTableProps {
  prompts: Prompt[];
  cap?: number;
  generating?: boolean;
  workspaceId: string;
  regionId?: string | null;
  brandName: string;
  dateFrom?: string;
  dateTo?: string;
  onFilterChange?: (dateFrom: string, dateTo: string) => void;
}

/**
 * Prompts Table Component
 * Displays and manages monitoring prompts with AEO visibility KPIs
 */
export function PromptsTable({
  prompts,
  cap,
  generating,
  workspaceId,
  regionId,
  brandName,
  dateFrom = "",
  dateTo = "",
  onFilterChange,
}: PromptsTableProps) {
  const [localPrompts, setLocalPrompts] = useState(prompts);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(
    new Set()
  );
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(
    new Set()
  );

  const handlePromptAdded = (newPrompt: any) => {
    // Add the new prompt to the top of the list with initial KPI values
    const promptWithKPIs = {
      ...newPrompt,
      visibilityScore: null,
      mentionRate: null,
      citationRate: null,
      avgPosition: null,
      snapshotDate: null,
      topics: null,
    };
    setLocalPrompts([promptWithKPIs, ...localPrompts]);
  };

  const toggleActive = async (p: Prompt) => {
    const next = !p.is_active;
    setLocalPrompts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, is_active: next } : x))
    );
    await fetch("/api/prompts/toggle-active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId: p.id, isActive: next }),
    });
  };

  const toggleExpand = (promptId: string) => {
    const newExpanded = new Set(expandedPrompts);
    if (newExpanded.has(promptId)) {
      newExpanded.delete(promptId);
    } else {
      newExpanded.add(promptId);
    }
    setExpandedPrompts(newExpanded);
  };

  const handleSelectAll = () => {
    if (selectedPrompts.size === localPrompts.length) {
      setSelectedPrompts(new Set());
    } else {
      setSelectedPrompts(new Set(localPrompts.map((p) => p.id)));
    }
  };

  const handleSelectPrompt = (promptId: string) => {
    setSelectedPrompts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(promptId)) {
        newSet.delete(promptId);
      } else {
        newSet.add(promptId);
      }
      return newSet;
    });
  };

  const handleBulkActivate = async () => {
    const selectedIds = Array.from(selectedPrompts);
    setLocalPrompts((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id) ? { ...p, is_active: true } : p
      )
    );
    await Promise.all(
      selectedIds.map((id) =>
        fetch("/api/prompts/toggle-active", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId: id, isActive: true }),
        })
      )
    );
    setSelectedPrompts(new Set());
  };

  const handleBulkDeactivate = async () => {
    const selectedIds = Array.from(selectedPrompts);
    setLocalPrompts((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id) ? { ...p, is_active: false } : p
      )
    );
    await Promise.all(
      selectedIds.map((id) =>
        fetch("/api/prompts/toggle-active", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId: id, isActive: false }),
        })
      )
    );
    setSelectedPrompts(new Set());
  };

  const activePrompts = localPrompts.filter((p) => p.is_active).length;
  const totalPrompts = localPrompts.length;
  const coverageRate = cap && cap > 0 ? (activePrompts / cap) * 100 : 0;

  if (prompts.length === 0 && generating) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Generating prompts...
          </h3>
          <p className="mb-6 text-sm text-gray-600">
            We're creating AI-powered prompts for your topics. This may take a
            few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Active</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {activePrompts}
            {cap && (
              <span className="ml-1 text-sm font-medium text-gray-500">
                / {cap}
              </span>
            )}
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
            <Activity className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Inactive</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {totalPrompts - activePrompts}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">
              Avg. Position
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">—</p>
        </div>
      </div>

      {/* Date Filter */}
      {onFilterChange && <PromptsDateFilter onFilterChange={onFilterChange} />}

      {/* Prompts Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="w-12 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <span className="sr-only">Expand</span>
                </th>
                <th className="w-12 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <Checkbox
                    checked={
                      selectedPrompts.size === localPrompts.length &&
                      localPrompts.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all prompts"
                  />
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Prompt
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Topic
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-center gap-1.5">
                    Visibility Score
                    <Tooltip
                      content="Composite score based on mention rate (40%), prominence (25%), citation authority (20%), and alignment (15%). Higher scores indicate better visibility."
                      side="top"
                    >
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400 hover:text-gray-600" />
                    </Tooltip>
                  </div>
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-center gap-1.5">
                    % Mentions
                    <Tooltip
                      content="Percentage of AI responses that mention your brand."
                      side="top"
                    >
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400 hover:text-gray-600" />
                    </Tooltip>
                  </div>
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-center gap-1.5">
                    % Citations
                    <Tooltip
                      content="Percentage of AI responses that include citations mentioning your brand."
                      side="top"
                    >
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400 hover:text-gray-600" />
                    </Tooltip>
                  </div>
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  <div className="flex items-center justify-center gap-1.5">
                    Avg. Position
                    <Tooltip
                      content="The average prominence score (0-1) of your brand in AI-generated answers. Lower values indicate mentions appear earlier in responses."
                      side="top"
                    >
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400 hover:text-gray-600" />
                    </Tooltip>
                  </div>
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {localPrompts.map((prompt) => {
                const isExpanded = expandedPrompts.has(prompt.id);
                return (
                  <>
                    <tr
                      key={prompt.id}
                      className={cn(
                        "transition-colors",
                        prompt.is_active
                          ? "bg-white hover:bg-blue-50/50"
                          : "bg-gray-50/50 opacity-70 hover:bg-gray-100/50"
                      )}
                    >
                      <td className="px-4 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(prompt.id)}
                          className="h-7 w-7 p-0"
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                          )}
                        </Button>
                      </td>
                      <td className="px-4 py-2">
                        <Checkbox
                          checked={selectedPrompts.has(prompt.id)}
                          onCheckedChange={() => handleSelectPrompt(prompt.id)}
                          aria-label="Select prompt for bulk actions"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <p
                          className={cn(
                            "max-w-md truncate text-xs font-medium",
                            prompt.is_active ? "text-gray-900" : "text-gray-500"
                          )}
                          title={prompt.prompt_text}
                        >
                          {prompt.prompt_text}
                        </p>
                      </td>
                      <td className="px-4 py-2">
                        {prompt.topics?.name ? (
                          <Badge variant="outline" className="text-xs">
                            {prompt.topics.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="text-xs">
                          {prompt.visibilityScore !== null &&
                          prompt.visibilityScore !== undefined ? (
                            <span
                              className={cn(
                                "font-semibold",
                                prompt.visibilityScore >= 70
                                  ? "text-green-600"
                                  : prompt.visibilityScore >= 50
                                    ? "text-yellow-600"
                                    : "text-gray-600"
                              )}
                            >
                              {prompt.visibilityScore}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="text-xs">
                          {prompt.mentionRate !== null &&
                          prompt.mentionRate !== undefined ? (
                            <span
                              className={cn(
                                "font-medium",
                                prompt.mentionRate >= 50
                                  ? "text-green-600"
                                  : prompt.mentionRate >= 25
                                    ? "text-yellow-600"
                                    : "text-gray-600"
                              )}
                            >
                              {prompt.mentionRate}%
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="text-xs">
                          {prompt.citationRate !== null &&
                          prompt.citationRate !== undefined ? (
                            <span
                              className={cn(
                                "font-medium",
                                prompt.citationRate >= 30
                                  ? "text-green-600"
                                  : prompt.citationRate >= 15
                                    ? "text-yellow-600"
                                    : "text-gray-600"
                              )}
                            >
                              {prompt.citationRate}%
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="text-xs">
                          {prompt.avgPosition ? (
                            <span className="font-medium text-gray-900">
                              {prompt.avgPosition}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title={prompt.is_active ? "Pause" : "Activate"}
                            onClick={() => toggleActive(prompt)}
                            className="h-7 w-7 p-0"
                          >
                            {prompt.is_active ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <EditPromptDialog prompt={prompt}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit"
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </EditPromptDialog>
                          <DeletePromptDialog prompt={prompt}>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </DeletePromptDialog>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${prompt.id}-expanded`}>
                        <td colSpan={9} className="p-0">
                          <PromptResultsDetail
                            promptId={prompt.id}
                            brandName={brandName}
                            dateFrom={dateFrom}
                            dateTo={dateTo}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {/* Add new prompt row */}
              <tr className="border-t-2 border-gray-300 hover:bg-gray-50">
                <td colSpan={9} className="px-4 py-2">
                  <AddPromptDialog
                    workspaceId={workspaceId}
                    regionId={regionId}
                    onPromptAdded={handlePromptAdded}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-600 hover:text-gray-900"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add new prompt
                    </Button>
                  </AddPromptDialog>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedPrompts.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
          <div className="flex items-center gap-3 rounded-full border border-gray-300 bg-white px-6 py-3 shadow-lg">
            <span className="text-sm font-medium text-gray-700">
              {selectedPrompts.size} selected
            </span>
            <div className="h-6 w-px bg-gray-300" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkActivate}
              className="h-8"
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Activate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDeactivate}
              className="h-8"
            >
              <Pause className="mr-1.5 h-3.5 w-3.5" />
              Deactivate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPrompts(new Set())}
              className="h-8 text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
