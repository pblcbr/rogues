"use client";

import { useState } from "react";
import { Calendar, X } from "lucide-react";

interface PromptsDateFilterProps {
  onFilterChange: (dateFrom: string, dateTo: string) => void;
}

export function PromptsDateFilter({ onFilterChange }: PromptsDateFilterProps) {
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const handleFromChange = (value: string) => {
    setDateFrom(value);
    onFilterChange(value, dateTo);
  };

  const handleToChange = (value: string) => {
    setDateTo(value);
    onFilterChange(dateFrom, value);
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    onFilterChange("", "");
  };

  // Quick filter presets
  const setLastDays = (days: number) => {
    const today = new Date();
    const past = new Date();
    past.setDate(past.getDate() - days);

    const toDate = today.toISOString().split("T")[0];
    const fromDate = past.toISOString().split("T")[0];

    setDateFrom(fromDate);
    setDateTo(toDate);
    onFilterChange(fromDate, toDate);
  };

  const hasFilters = dateFrom || dateTo;

  return (
    <div className="mb-4 flex items-center gap-3 text-sm">
      <Calendar className="h-4 w-4 text-gray-400" />
      <span className="text-xs text-gray-500">Filter:</span>

      {/* Date inputs */}
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => handleFromChange(e.target.value)}
        placeholder="From"
        className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
      />
      <span className="text-xs text-gray-400">to</span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => handleToChange(e.target.value)}
        placeholder="To"
        className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
      />

      {/* Quick filters */}
      <div className="ml-2 flex items-center gap-2">
        <button
          onClick={() => setLastDays(7)}
          className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
        >
          7d
        </button>
        <button
          onClick={() => setLastDays(30)}
          className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
        >
          30d
        </button>
        <button
          onClick={() => {
            const today = new Date().toISOString().split("T")[0];
            setDateFrom(today);
            setDateTo(today);
            onFilterChange(today, today);
          }}
          className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
        >
          Today
        </button>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
