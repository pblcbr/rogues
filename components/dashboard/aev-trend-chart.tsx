"use client";

import { LineChart, TrendingUp } from "lucide-react";

/**
 * AEV Trend Chart
 * Displays Answer Engine Visibility score over time
 * Note: Using placeholder. In production, integrate Recharts or Chart.js
 */
export function AEVTrendChart() {
  // Mock data for 30 days
  const data = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    aev: 6.5 + Math.random() * 2,
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AEV Trend</h3>
          <p className="text-sm text-gray-500">Last 30 days performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200">
            7D
          </button>
          <button className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white">
            30D
          </button>
          <button className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200">
            90D
          </button>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="relative flex h-64 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <LineChart className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <p className="text-sm text-gray-600">
            Chart visualization coming soon
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Integrate with Recharts for production
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-gray-200 pt-6">
        <div>
          <p className="text-xs text-gray-500">Average AEV</p>
          <p className="text-lg font-semibold text-gray-900">7.8</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Peak Score</p>
          <p className="text-lg font-semibold text-gray-900">8.9</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Trend</p>
          <p className="flex items-center text-lg font-semibold text-green-600">
            <TrendingUp className="mr-1 h-4 w-4" />
            +12%
          </p>
        </div>
      </div>
    </div>
  );
}
