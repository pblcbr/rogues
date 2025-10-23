"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditPromptDialog } from "./edit-prompt-dialog";
import { DeletePromptDialog } from "./delete-prompt-dialog";
import {
  Play,
  Pause,
  Edit,
  Trash2,
  MoreVertical,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Prompt {
  id: string;
  prompt_text: string;
  category?: string;
  is_active: boolean;
  created_at: string;
}

interface PromptsTableProps {
  prompts: Prompt[];
}

/**
 * Prompts Table Component
 * Displays and manages monitoring prompts
 */
export function PromptsTable({ prompts }: PromptsTableProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

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
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Performance
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {prompts.map((prompt) => (
              <tr key={prompt.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="max-w-md text-sm font-medium text-gray-900">
                    {prompt.prompt_text}
                  </p>
                </td>
                <td className="px-6 py-4">
                  {prompt.category && (
                    <Badge variant="secondary">{prompt.category}</Badge>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        prompt.is_active ? "bg-green-500" : "bg-gray-400"
                      )}
                    />
                    <span className="text-sm text-gray-600">
                      {prompt.is_active ? "Active" : "Paused"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(prompt.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      {Math.floor(Math.random() * 50 + 10)}
                    </span>
                    <span className="text-gray-500"> mentions</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      title={prompt.is_active ? "Pause" : "Activate"}
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
