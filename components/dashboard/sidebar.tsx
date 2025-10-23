"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  Settings,
  Users,
  FileText,
  Zap,
} from "lucide-react";

interface SidebarProps {
  profile: any;
}

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Prompts", href: "/dashboard/prompts", icon: Target },
  { name: "Results", href: "/dashboard/results", icon: TrendingUp },
  { name: "Actions", href: "/dashboard/actions", icon: Zap },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

/**
 * Dashboard Sidebar Navigation
 * Desktop-first vertical navigation
 */
export function DashboardSidebar({ profile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="flex items-center">
          <span className="text-2xl font-bold text-gray-900">Rogues</span>
        </Link>
      </div>

      {/* Workspace Selector */}
      <div className="border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <span className="text-sm font-semibold text-white">
              {profile?.workspaces?.company_name?.[0]?.toUpperCase() || "W"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {profile?.workspaces?.company_name || "My Workspace"}
            </p>
            <p className="truncate text-xs text-gray-500">
              {profile?.workspaces?.plan_id || "starter"} plan
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon
                className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-blue-700" : "text-gray-400"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center text-xs text-gray-500">
          <span>AEV Score:</span>
          <span className="ml-auto font-semibold text-green-600">8.2/10</span>
        </div>
      </div>
    </div>
  );
}
