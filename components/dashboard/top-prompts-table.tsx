import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

interface Prompt {
  id: string;
  prompt_text: string;
  category?: string;
  is_active: boolean;
}

interface TopPromptsTableProps {
  prompts: Prompt[];
}

/**
 * Top Prompts Table
 * Shows best performing monitoring prompts
 */
export function TopPromptsTable({ prompts }: TopPromptsTableProps) {
  // Mock performance data
  const promptsWithPerformance = prompts.map((prompt, index) => ({
    ...prompt,
    mentions: Math.floor(Math.random() * 50) + 10,
    aev: (Math.random() * 3 + 7).toFixed(1),
    trend: Math.random() > 0.5 ? "up" : "down",
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Top Prompts</h3>
          <p className="text-sm text-gray-500">Best performing queries</p>
        </div>
        <Link href="/dashboard/prompts">
          <Button variant="ghost" size="sm">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="space-y-3">
        {promptsWithPerformance.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">No prompts yet</p>
            <Link href="/dashboard/prompts">
              <Button size="sm" className="mt-2">
                Add your first prompt
              </Button>
            </Link>
          </div>
        ) : (
          promptsWithPerformance.map((prompt) => (
            <div
              key={prompt.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {prompt.prompt_text}
                </p>
                <div className="mt-1 flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {prompt.mentions} mentions
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    AEV: {prompt.aev}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                {prompt.trend === "up" ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
