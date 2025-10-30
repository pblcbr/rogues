"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Citation {
  url: string;
  title: string | null;
  domain: string | null;
  favicon_url: string | null;
  position: number;
}

interface BrandPosition {
  brand: string;
  positions: number[];
}

interface ResultCardProps {
  result: {
    id: string;
    response_text: string | null;
    brands_mentioned: any;
    brand_positions: BrandPosition[] | null;
    our_brand_mentioned: boolean | null;
    our_brand_position: number | null;
    relevancy_score: number | null;
    created_at: string;
    llm_provider: string | null;
    llm_model: string | null;
    prompt: {
      id: string;
      text: string;
      topic: string | null;
    } | null;
    citations: Citation[];
  };
  brandName: string;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

export function ResultCard({
  result,
  brandName,
  isSelected,
  onSelect,
}: ResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getRelevancyColor = (score: number) => {
    if (score >= 70) return "text-green-700";
    if (score >= 40) return "text-yellow-700";
    return "text-gray-500";
  };

  const responsePreview = result.response_text
    ? result.response_text.slice(0, 250) +
      (result.response_text.length > 250 ? "..." : "")
    : "No response text available";

  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-4 transition-shadow hover:shadow-md",
        isSelected ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"
      )}
    >
      {/* Prompt Context Header */}
      <div className="mb-3 flex items-start gap-3 border-b border-gray-100 pb-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(result.id, checked as boolean)}
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs text-gray-500">From prompt:</p>
          <p className="truncate text-sm font-medium text-gray-900">
            {result.prompt?.text || "Unknown prompt"}
          </p>
          {result.prompt?.topic && (
            <Badge variant="outline" className="mt-1 px-2 py-0 text-[10px]">
              {result.prompt.topic}
            </Badge>
          )}
        </div>
      </div>

      {/* Result Metadata */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-gray-500">
            {formatDate(result.created_at)}
          </span>
          {result.llm_provider && (
            <Badge variant="outline" className="px-2 py-0 text-[10px]">
              {result.llm_provider}{" "}
              {result.llm_model && `• ${result.llm_model}`}
            </Badge>
          )}
          {result.relevancy_score !== null && (
            <span
              className={cn(
                "text-xs font-semibold",
                getRelevancyColor(result.relevancy_score)
              )}
            >
              Relevancy: {result.relevancy_score.toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* Brand Analysis */}
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Our Brand */}
          {result.our_brand_mentioned ? (
            <Badge className="bg-green-100 font-medium text-green-800 hover:bg-green-100">
              {brandName}
              {result.our_brand_position && (
                <span className="ml-1 font-bold">
                  #{result.our_brand_position}
                </span>
              )}
            </Badge>
          ) : (
            <Badge className="bg-red-100 font-medium text-red-800 hover:bg-red-100">
              {brandName} • Not mentioned
            </Badge>
          )}

          {/* Competitors */}
          {result.brand_positions &&
            result.brand_positions.length > 0 &&
            result.brand_positions
              .filter(
                (bp) => bp.brand.toLowerCase() !== brandName.toLowerCase()
              )
              .slice(0, 5)
              .map((bp, idx) => {
                const avgPosition =
                  bp.positions.length > 0
                    ? Math.round(
                        bp.positions.reduce((a, b) => a + b, 0) /
                          bp.positions.length
                      )
                    : null;

                return (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="border-orange-200 bg-orange-50 font-medium text-orange-800"
                  >
                    {bp.brand}
                    {avgPosition && (
                      <span className="ml-1 font-bold">#{avgPosition}</span>
                    )}
                  </Badge>
                );
              })}
          {result.brand_positions && result.brand_positions.length > 6 && (
            <span className="text-xs text-gray-500">
              +
              {result.brand_positions.filter(
                (bp) => bp.brand.toLowerCase() !== brandName.toLowerCase()
              ).length - 5}{" "}
              more
            </span>
          )}
        </div>
      </div>

      {/* Response Text */}
      {result.response_text && (
        <div className="mb-3">
          <p className="text-sm leading-relaxed text-gray-700">
            {isExpanded ? result.response_text : responsePreview}
          </p>
          {result.response_text.length > 250 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-xs text-blue-600 underline hover:text-blue-800"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Citations */}
      {result.citations && result.citations.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-700">
            Citations ({result.citations.length})
          </h4>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {result.citations.map((citation, idx) => (
              <a
                key={idx}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 rounded border border-gray-200 p-2 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
              >
                {/* Favicon */}
                {citation.favicon_url ? (
                  <img
                    src={citation.favicon_url}
                    alt=""
                    className="mt-0.5 h-4 w-4 flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded bg-gray-200" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-gray-900">
                      {citation.domain || new URL(citation.url).hostname}
                    </span>
                    <Badge
                      variant="secondary"
                      className="flex-shrink-0 px-1.5 py-0 text-[10px]"
                    >
                      #{citation.position}
                    </Badge>
                  </div>
                  {citation.title && (
                    <p className="mt-0.5 truncate text-xs text-gray-600">
                      {citation.title}
                    </p>
                  )}
                </div>

                <ExternalLink className="mt-1 h-3 w-3 flex-shrink-0 text-gray-400 group-hover:text-blue-600" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
