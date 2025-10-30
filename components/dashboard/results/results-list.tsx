"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ResultCard } from "./result-card";
import { BulkActionsBar } from "./bulk-actions-bar";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ResultsListProps {
  results: any[];
  brandName: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function ResultsList({
  results,
  brandName,
  currentPage,
  totalPages,
  totalCount,
}: ResultsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedResults, setSelectedResults] = useState<Set<string>>(
    new Set()
  );

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedResults((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedResults.size === results.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(results.map((r) => r.id)));
    }
  };

  const clearSelection = () => {
    setSelectedResults(new Set());
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16">
        <div className="mb-4 rounded-full bg-gray-100 p-6">
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          No results found
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Try adjusting your filters or search criteria
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/results")}
        >
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Select All */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={
              selectedResults.size === results.length && results.length > 0
            }
            onChange={handleSelectAll}
            className="rounded border-gray-300"
          />
          {selectedResults.size > 0
            ? `${selectedResults.size} selected`
            : "Select all"}
        </label>
        {selectedResults.size > 0 && (
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear selection
          </Button>
        )}
      </div>

      {/* Results Cards */}
      <div className="space-y-3">
        {results.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            brandName={brandName}
            isSelected={selectedResults.has(result.id)}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  className="h-8 w-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedResults.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedResults.size}
          selectedIds={Array.from(selectedResults)}
          onClear={clearSelection}
        />
      )}
    </div>
  );
}
