"use client";

import { CheckCircle, AlertCircle, Zap, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Recent Activity Feed
 * Shows latest actions and events in the workspace
 */
export function RecentActivityFeed() {
  // Mock activity data
  const activities = [
    {
      id: 1,
      type: "mention",
      title: "New brand mention detected",
      description: 'In response to "best project management tools"',
      time: "2 minutes ago",
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: 2,
      type: "action",
      title: "Content optimization completed",
      description: "5 articles updated for better visibility",
      time: "1 hour ago",
      icon: Zap,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: 3,
      type: "alert",
      title: "Competitor mentioned more frequently",
      description: "Acme Corp gained +15% in mentions",
      time: "3 hours ago",
      icon: AlertCircle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      id: 4,
      type: "team",
      title: "New team member added",
      description: "Sarah Johnson joined the workspace",
      time: "5 hours ago",
      icon: Users,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-500">
          Latest updates from your workspace
        </p>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={cn("rounded-lg p-2", activity.bgColor)}>
                <Icon className={cn("h-4 w-4", activity.iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {activity.description}
                </p>
                <p className="mt-1 text-xs text-gray-400">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
          View all activity →
        </button>
      </div>
    </div>
  );
}
