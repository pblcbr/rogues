"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { EditPromptDialog } from "./edit-prompt-dialog";
import { DeletePromptDialog } from "./delete-prompt-dialog";
import {
  Play,
  Pause,
  Edit,
  Trash2,
  TrendingUp,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Prompt {
  id: string;
  prompt_text: string;
  category?: string;
  is_active: boolean;
  is_pinned?: boolean;
  created_at: string;
  topics?: { name: string };
}

interface PromptsTableProps {
  prompts: Prompt[];
}

/**
 * Prompts Table Component
 * Displays and manages monitoring prompts
 */
export function PromptsTable({ prompts }: PromptsTableProps) {
  const [localPrompts, setLocalPrompts] = useState(prompts);

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

  if (prompts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            No prompts yet
          </h3>
          <p className="mb-6 text-sm text-gray-600">
            Start monitoring your brand visibility by adding your first prompt.
            These queries will help track where and how AI engines mention your
            brand.
          </p>
          <Button>Add your first prompt</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Prompt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Topic
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <div className="flex items-center gap-1.5">
                  Average Position
                  <Tooltip
                    content="The average position your brand is mentioned in AI-generated answers. For example, if your brand is usually listed first, your average position will be close to 1. A lower average position means your brand is more likely to be mentioned at the top."
                    side="top"
                  >
                    <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400 hover:text-gray-600" />
                  </Tooltip>
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {localPrompts.map((prompt) => (
              <tr
                key={prompt.id}
                className={cn(
                  "hover:bg-gray-50",
                  !prompt.is_active && "opacity-60"
                )}
              >
                <td className="px-6 py-4">
                  <p
                    className={cn(
                      "max-w-md text-sm font-medium",
                      prompt.is_active ? "text-gray-900" : "text-gray-500"
                    )}
                  >
                    {prompt.prompt_text}
                  </p>
                </td>
                <td className="px-6 py-4">
                  {prompt.topics?.name ? (
                    <Badge variant="outline">{prompt.topics.name}</Badge>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">-</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      title={prompt.is_active ? "Pause" : "Activate"}
                      onClick={() => toggleActive(prompt)}
                    >
                      {prompt.is_active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <EditPromptDialog prompt={prompt}>
                      <Button variant="ghost" size="sm" title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </EditPromptDialog>
                    <DeletePromptDialog prompt={prompt}>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DeletePromptDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
