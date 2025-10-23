import { LucideIcon, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: LucideIcon;
  description: string;
  trend: "up" | "down";
}

/**
 * Metric Card Component
 * Displays a key metric with trend indicator
 */
export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  trend,
}: MetricCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-blue-50 p-2">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-600">{title}</span>
        </div>
      </div>

      {/* Value */}
      <div className="mb-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>

      {/* Change & Description */}
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex items-center text-sm font-medium",
            isPositive ? "text-green-600" : "text-red-600"
          )}
        >
          {isPositive ? (
            <ArrowUp className="mr-1 h-4 w-4" />
          ) : (
            <ArrowDown className="mr-1 h-4 w-4" />
          )}
          {Math.abs(change)}%
        </div>
        <span className="text-xs text-gray-500">{description}</span>
      </div>
    </div>
  );
}
