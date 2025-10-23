"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Results Grid Component
 * Display LLM responses with brand mention analysis
 */
export function ResultsGrid() {
  // Mock results data
  const results = [
    {
      id: 1,
      prompt: "best project management software for startups",
      llm: "ChatGPT-4",
      response:
        "For startups, I'd recommend considering several excellent project management tools: 1. Linear - Modern, fast interface designed for tech teams. 2. Asana - Great for task management and team collaboration. 3. Monday.com - Highly customizable with excellent automation features.",
      brandMentioned: true,
      position: 2,
      citations: ["linear.app", "asana.com"],
      timestamp: "2 hours ago",
    },
    {
      id: 2,
      prompt: "top project management tools in 2025",
      llm: "Claude",
      response:
        "In 2025, the leading project management platforms include Notion for its flexibility, ClickUp for comprehensive features, and Jira for software development teams. Each offers unique strengths depending on your workflow needs.",
      brandMentioned: false,
      position: null,
      citations: ["notion.so", "clickup.com", "atlassian.com"],
      timestamp: "5 hours ago",
    },
    {
      id: 3,
      prompt: "how to manage remote team projects effectively",
      llm: "Perplexity",
      response:
        "Effective remote project management requires the right tools and practices. Consider platforms like Linear for engineering teams, which offers streamlined workflows and integrations. Combine this with clear communication channels and regular check-ins.",
      brandMentioned: true,
      position: 1,
      citations: ["linear.app", "slack.com"],
      timestamp: "1 day ago",
    },
  ];

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <div
          key={result.id}
          className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {result.prompt}
                </h3>
                {result.brandMentioned ? (
                  <Badge className="border-green-200 bg-green-100 text-green-700">
                    Mentioned #{result.position}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not Mentioned</Badge>
                )}
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <span className="font-medium">{result.llm}</span>
                <span>•</span>
                <span>{result.timestamp}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          {/* Response */}
          <div className="mb-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm leading-relaxed text-gray-700">
                {result.response}
              </p>
            </div>
          </div>

          {/* Citations */}
          {result.citations.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-gray-500">
                Citations:
              </p>
              <div className="flex flex-wrap gap-2">
                {result.citations.map((citation, index) => (
                  <a
                    key={index}
                    href={`https://${citation}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    {citation}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <ThumbsUp className="mr-1 h-4 w-4" />
                Helpful
              </Button>
              <Button variant="ghost" size="sm">
                <ThumbsDown className="mr-1 h-4 w-4" />
                Not Helpful
              </Button>
            </div>
            <Button variant="ghost" size="sm">
              <Copy className="mr-1 h-4 w-4" />
              Copy Response
            </Button>
          </div>
        </div>
      ))}

      {/* Load More */}
      <div className="pt-4 text-center">
        <Button variant="outline">Load More Results</Button>
      </div>
    </div>
  );
}
