"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  Filter,
  Download,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";

interface ResultsFiltersProps {
  currentFilters: {
    search: string;
    dateFrom: string;
    dateTo: string;
    brandFilter: string;
    llmProviders: string[];
    relevancyMin: number;
    relevancyMax: number;
    sortBy: string;
    sortOrder: string;
  };
}

export function ResultsFilters({ currentFilters }: ResultsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentFilters.search);
  const [dateFrom, setDateFrom] = useState(currentFilters.dateFrom);
  const [dateTo, setDateTo] = useState(currentFilters.dateTo);
  const [brandFilter, setBrandFilter] = useState(currentFilters.brandFilter);
  const [selectedLLMs, setSelectedLLMs] = useState<string[]>(
    currentFilters.llmProviders
  );
  const [relevancyMin, setRelevancyMin] = useState(currentFilters.relevancyMin);
  const [relevancyMax, setRelevancyMax] = useState(currentFilters.relevancyMax);
  const [sortBy, setSortBy] = useState(currentFilters.sortBy);
  const [sortOrder, setSortOrder] = useState(currentFilters.sortOrder);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (search) params.set("search", search);
    else params.delete("search");

    if (dateFrom) params.set("date_from", dateFrom);
    else params.delete("date_from");

    if (dateTo) params.set("date_to", dateTo);
    else params.delete("date_to");

    if (brandFilter && brandFilter !== "all")
      params.set("brand_filter", brandFilter);
    else params.delete("brand_filter");

    if (selectedLLMs.length > 0)
      params.set("llm_providers", selectedLLMs.join(","));
    else params.delete("llm_providers");

    if (relevancyMin > 0) params.set("relevancy_min", relevancyMin.toString());
    else params.delete("relevancy_min");

    if (relevancyMax < 100)
      params.set("relevancy_max", relevancyMax.toString());
    else params.delete("relevancy_max");

    if (sortBy !== "date") params.set("sort_by", sortBy);
    else params.delete("sort_by");

    if (sortOrder !== "desc") params.set("sort_order", sortOrder);
    else params.delete("sort_order");

    params.delete("page"); // Reset to page 1 when filters change

    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setBrandFilter("all");
    setSelectedLLMs([]);
    setRelevancyMin(0);
    setRelevancyMax(100);
    setSortBy("date");
    setSortOrder("desc");
    router.push("/dashboard/results");
  };

  const toggleLLM = (llm: string) => {
    setSelectedLLMs((prev) =>
      prev.includes(llm) ? prev.filter((l) => l !== llm) : [...prev, llm]
    );
  };

  const handleExport = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("format", "csv");
    window.open(`/api/results/export?${params.toString()}`, "_blank");
  };

  const activeFiltersCount =
    (search ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0) +
    (brandFilter !== "all" ? 1 : 0) +
    (selectedLLMs.length > 0 ? 1 : 0) +
    (relevancyMin > 0 || relevancyMax < 100 ? 1 : 0);

  const llmOptions = [
    "openai",
    "anthropic",
    "google",
    "perplexity",
    "meta",
    "mistral",
  ];

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      {/* Primary Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[300px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search in responses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Brand Filter */}
        <select
          value={brandFilter}
          onChange={(e) => {
            setBrandFilter(e.target.value);
            setTimeout(applyFilters, 0);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Results</option>
          <option value="mentioned">Brand Mentioned</option>
          <option value="not_mentioned">Not Mentioned</option>
        </select>

        {/* Sort */}
        <select
          value={`${sortBy}_${sortOrder}`}
          onChange={(e) => {
            const [newSortBy, newSortOrder] = e.target.value.split("_");
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
            setTimeout(applyFilters, 0);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="relevancy_desc">Highest Relevancy</option>
          <option value="relevancy_asc">Lowest Relevancy</option>
          <option value="position_asc">Best Position</option>
          <option value="position_desc">Worst Position</option>
        </select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-2 h-5 w-5 rounded-full p-0">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {/* Export */}
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          {/* Date Range */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <Calendar className="mr-1 inline h-4 w-4" />
              Date Range
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="max-w-[180px]"
              />
              <span className="text-gray-500">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="max-w-[180px]"
              />
            </div>
          </div>

          {/* LLM Providers */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <Filter className="mr-1 inline h-4 w-4" />
              LLM Providers
            </label>
            <div className="flex flex-wrap gap-2">
              {llmOptions.map((llm) => (
                <button
                  key={llm}
                  onClick={() => toggleLLM(llm)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selectedLLMs.includes(llm)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {llm.charAt(0).toUpperCase() + llm.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Relevancy Range */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Relevancy Score Range: {relevancyMin}% - {relevancyMax}%
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={relevancyMin}
                onChange={(e) => setRelevancyMin(parseInt(e.target.value))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={relevancyMax}
                onChange={(e) => setRelevancyMax(parseInt(e.target.value))}
                className="flex-1"
              />
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex justify-end">
            <Button onClick={applyFilters} size="sm">
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
