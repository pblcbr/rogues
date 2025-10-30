"use client";

import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface BulkActionsBarProps {
  selectedCount: number;
  selectedIds: string[];
  onClear: () => void;
}

export function BulkActionsBar({
  selectedCount,
  selectedIds,
  onClear,
}: BulkActionsBarProps) {
  const searchParams = useSearchParams();

  const handleExportSelected = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("format", "csv");
    params.set("ids", selectedIds.join(","));
    window.open(`/api/results/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {selectedCount} result{selectedCount > 1 ? "s" : ""} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportSelected}>
            <Download className="mr-2 h-4 w-4" />
            Export Selected
          </Button>

          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="mr-2 h-4 w-4" />
            Clear Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
