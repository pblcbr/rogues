"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Loader2,
  ExternalLink,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Citation {
  url: string;
  title: string | null;
  domain: string | null;
  favicon_url: string | null;
  position: number;
}

interface BrandMention {
  brand: string;
  count: number;
}

interface BrandPosition {
  brand: string;
  positions: number[];
}

interface PromptResult {
  id: string;
  response_text: string | null;
  brands_mentioned: BrandMention[] | null;
  brand_positions: BrandPosition[] | null;
  our_brand_mentioned: boolean | null;
  our_brand_position: number | null;
  relevancy_score: number | null;
  created_at: string;
  llm_provider: string | null;
  llm_model: string | null;
  citations: Citation[];
}

interface PromptResultsDetailProps {
  promptId: string;
  brandName: string;
  dateFrom?: string;
  dateTo?: string;
}

export function PromptResultsDetail({
  promptId,
  brandName,
  dateFrom = "",
  dateTo = "",
}: PromptResultsDetailProps) {
  const [results, setResults] = useState<PromptResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(
    new Set()
  );
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchResults();
  }, [promptId, dateFrom, dateTo]);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build URL with query params
      const params = new URLSearchParams();
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);
      const queryString = params.toString();
      const url = `/api/prompts/${promptId}/results${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(errorData.message || "Failed to fetch results");
      }

      const data = await response.json();

      // Handle warnings (e.g., schema issues)
      if (data.warning) {
        console.warn("API Warning:", data.warning);
      }

      if (data.message) {
        console.info("API Message:", data.message);
      }

      setResults(data.results || []);
    } catch (err) {
      console.error("Error fetching results:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load results. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleResultExpand = (resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  const toggleCitationsExpand = (resultId: string) => {
    const newExpanded = new Set(expandedCitations);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedCitations(newExpanded);
  };

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

  const getModelLogo = (
    provider: string | null,
    model: string | null
  ): string => {
    const providerLower = (provider || "").toLowerCase();
    const modelLower = (model || "").toLowerCase();

    // OpenAI models
    if (providerLower.includes("openai") || modelLower.includes("gpt")) {
      return "https://cdn.oaistatic.com/_next/static/media/apple-touch-icon.82af6fe1.png";
    }

    // Anthropic (Claude)
    if (providerLower.includes("anthropic") || modelLower.includes("claude")) {
      return "https://www.anthropic.com/images/icons/apple-touch-icon.png";
    }

    // Google (Gemini/PaLM)
    if (
      providerLower.includes("google") ||
      modelLower.includes("gemini") ||
      modelLower.includes("palm")
    ) {
      return "https://www.gstatic.com/lamda/images/favicon_v1_150160cddff7f294ce30.svg";
    }

    // Perplexity
    if (providerLower.includes("perplexity")) {
      return "/llm/perplexity.svg";
    }

    // Default fallback
    return "https://cdn-icons-png.flaticon.com/512/8943/8943377.png";
  };

  const getBrandFavicon = (
    brandName: string,
    citations: Citation[]
  ): string | null => {
    // Try to find a citation that matches this brand's domain
    const brandLower = brandName.toLowerCase().replace(/\s+/g, "");

    for (const citation of citations) {
      if (citation.domain && citation.favicon_url) {
        const domainLower = citation.domain.toLowerCase().replace(/\s+/g, "");
        if (
          domainLower.includes(brandLower) ||
          brandLower.includes(domainLower)
        ) {
          return citation.favicon_url;
        }
      }
    }

    // Fallback: try to construct a favicon URL from the brand name
    // This assumes the brand has a .com domain
    const brandSlug = brandName.toLowerCase().replace(/\s+/g, "");
    return `https://www.google.com/s2/favicons?domain=${brandSlug}.com&sz=32`;
  };

  const formatResponseText = (text: string) => {
    // Split by double line breaks to create paragraphs
    const paragraphs = text.split(/\n\n+/);

    return paragraphs.map((paragraph, pIdx) => {
      // Check if it's a numbered list item
      const numberedListMatch = paragraph.match(
        /^(\d+\.\s+\*\*[^*]+\*\*:?\s*)/
      );

      if (numberedListMatch) {
        // Parse numbered list with bold titles
        const items = paragraph.split(/(?=\d+\.\s+\*\*)/);

        return (
          <div key={pIdx} className="space-y-3">
            {items
              .filter((item) => item.trim())
              .map((item, iIdx) => {
                // Extract number, title, and content
                const match = item.match(
                  /^(\d+)\.\s+\*\*([^*]+)\*\*:?\s*(.*)$/s
                );

                if (match) {
                  const [, number, title, content] = match;
                  return (
                    <div key={iIdx} className="flex gap-3">
                      <span className="flex-shrink-0 font-semibold text-blue-600">
                        {number}.
                      </span>
                      <div>
                        <span className="font-semibold text-gray-900">
                          {title}
                        </span>
                        {content && (
                          <span className="text-gray-700">
                            : {content.trim()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={iIdx} className="text-gray-700">
                    {item.trim()}
                  </div>
                );
              })}
          </div>
        );
      }

      // Check if it's a bullet list
      if (paragraph.includes("\n- ") || paragraph.includes("\n• ")) {
        const lines = paragraph.split("\n");
        const intro = lines.find(
          (line) => !line.trim().startsWith("-") && !line.trim().startsWith("•")
        );
        const bullets = lines.filter(
          (line) => line.trim().startsWith("-") || line.trim().startsWith("•")
        );

        return (
          <div key={pIdx} className="space-y-2">
            {intro && <p className="text-gray-700">{intro}</p>}
            <ul className="ml-4 space-y-1.5">
              {bullets.map((bullet, bIdx) => (
                <li key={bIdx} className="flex gap-2 text-gray-700">
                  <span className="flex-shrink-0 text-blue-600">•</span>
                  <span>{bullet.replace(/^[•\-]\s*/, "").trim()}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }

      // Regular paragraph - check for bold text with **
      const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);

      return (
        <p key={pIdx} className="leading-relaxed text-gray-700">
          {parts.map((part, partIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={partIdx} className="font-semibold text-gray-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Loading results...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchResults}
          className="mt-4 text-sm text-blue-600 underline hover:text-blue-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="mb-2 text-sm text-gray-500">
          No results yet for this prompt
        </p>
        <p className="text-xs text-gray-400">
          Run the KPI calculation to generate results
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6">
      <div className="space-y-6">
        {results.map((result) => {
          const isExpanded = expandedResults.has(result.id);

          // Parse brands mentioned
          const brandsArray = result.brands_mentioned
            ? typeof result.brands_mentioned === "string"
              ? JSON.parse(result.brands_mentioned)
              : result.brands_mentioned
            : [];

          // Parse brand positions
          const brandPositions = result.brand_positions
            ? typeof result.brand_positions === "string"
              ? JSON.parse(result.brand_positions)
              : result.brand_positions
            : [];

          return (
            <div
              key={result.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              {/* Header - Model and Citations Count */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
                <div className="flex items-center gap-3">
                  <img
                    src={getModelLogo(result.llm_provider, result.llm_model)}
                    alt=""
                    className="h-6 w-6 flex-shrink-0 rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <h3 className="text-sm font-semibold text-gray-900">
                    {result.llm_model || "GPT-4"}
                  </h3>
                </div>
                <span className="text-xs text-gray-500">
                  {result.citations && result.citations.length > 0 && (
                    <span className="font-medium text-gray-700">
                      {result.citations.length} citations
                    </span>
                  )}
                </span>
              </div>

              <div className="space-y-6 px-6 py-5">
                {/* Brands Mentioned Section */}
                {brandsArray.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Brands Mentioned
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {brandsArray.map((brand: string, idx: number) => {
                        const isOurBrand =
                          brand.toLowerCase() === brandName.toLowerCase();
                        const brandPosition = brandPositions?.find(
                          (bp: any) =>
                            bp.brand.toLowerCase() === brand.toLowerCase()
                        );
                        const avgPos = brandPosition?.positions?.length
                          ? Math.round(
                              brandPosition.positions.reduce(
                                (a: number, b: number) => a + b,
                                0
                              ) / brandPosition.positions.length
                            )
                          : null;

                        const favicon = getBrandFavicon(
                          brand,
                          result.citations || []
                        );

                        return (
                          <Tooltip
                            key={idx}
                            content={
                              <div className="text-center">
                                <div className="font-semibold">{brand}</div>
                                {avgPos && (
                                  <div className="text-xs text-gray-400">
                                    Position #{avgPos}
                                  </div>
                                )}
                              </div>
                            }
                          >
                            <div
                              className={
                                isOurBrand
                                  ? "relative flex h-10 w-10 items-center justify-center rounded-lg border-2 border-green-500 bg-green-50 shadow-sm transition-all hover:scale-110"
                                  : "relative flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-300 bg-white transition-all hover:scale-110 hover:border-gray-400"
                              }
                            >
                              {favicon ? (
                                <img
                                  src={favicon}
                                  alt={brand}
                                  className="h-6 w-6 rounded"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="text-xs font-bold text-gray-600">
                                  {brand.substring(0, 2).toUpperCase()}
                                </span>
                              )}
                              {isOurBrand && (
                                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                              )}
                            </div>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Response Section */}
                {result.response_text && (
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Response
                    </h4>
                    <div className="space-y-3">
                      {isExpanded ? (
                        formatResponseText(result.response_text)
                      ) : (
                        <>
                          {formatResponseText(
                            result.response_text.slice(0, 400)
                          )}
                          {result.response_text.length > 400 && (
                            <p className="text-gray-500">...</p>
                          )}
                        </>
                      )}
                      {result.response_text.length > 400 && (
                        <button
                          onClick={() => toggleResultExpand(result.id)}
                          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Citations Section - Collapsible */}
                {result.citations && result.citations.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleCitationsExpand(result.id)}
                      className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-700 transition-colors hover:text-gray-900"
                    >
                      <span>Citations ({result.citations.length})</span>
                      {expandedCitations.has(result.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>

                    {expandedCitations.has(result.id) && (
                      <div className="space-y-2">
                        {result.citations.map((citation, idx) => (
                          <a
                            key={idx}
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-3 rounded-lg border border-gray-200 p-3 transition-all hover:border-blue-300 hover:bg-blue-50/30"
                          >
                            {/* Favicon */}
                            {citation.favicon_url ? (
                              <img
                                src={citation.favicon_url}
                                alt=""
                                className="mt-0.5 h-5 w-5 flex-shrink-0 rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded bg-gray-200" />
                            )}

                            {/* Citation Content */}
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-start justify-between gap-2">
                                <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                                  {citation.domain ||
                                    new URL(citation.url).hostname}
                                </span>
                              </div>
                              {citation.title && (
                                <p className="text-xs leading-relaxed text-gray-600">
                                  {citation.title}
                                </p>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer - Metadata */}
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-2.5">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last run: {formatDate(result.created_at)}</span>
                  {result.relevancy_score !== null && (
                    <span
                      className={cn(
                        "font-medium",
                        getRelevancyColor(result.relevancy_score)
                      )}
                    >
                      Relevancy: {result.relevancy_score.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
