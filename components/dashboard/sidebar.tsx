"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { RegionSwitcher } from "./region-switcher";
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  Settings,
  Users,
  FileText,
  Zap,
  BookOpen,
} from "lucide-react";

interface SidebarProps {
  profile: any;
  userEmail?: string;
  currentWorkspaceId?: string;
}

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Topics", href: "/dashboard/topics", icon: BookOpen },
  { name: "Prompts", href: "/dashboard/prompts", icon: Target },
  { name: "Results", href: "/dashboard/results", icon: TrendingUp },
  { name: "Citations", href: "/dashboard/citations", icon: FileText },
  { name: "Actions", href: "/dashboard/actions", icon: Zap },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

/**
 * Dashboard Sidebar Navigation
 * Desktop-first vertical navigation
 */
export function DashboardSidebar({
  profile,
  userEmail,
  currentWorkspaceId,
}: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    window.location.assign("/login");
  };

  return (
    <div className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="flex items-center">
          <span className="text-2xl font-bold text-gray-900">Rogues</span>
        </Link>
      </div>

      {/* Workspace Selector */}
      <WorkspaceSwitcher
        currentWorkspaceId={profile?.current_workspace_id}
        isAgency={profile?.is_agency || false}
      />

      {/* Region Selector */}
      {(profile?.current_workspace_id || profile?.workspace_id) && (
        <RegionSwitcher
          currentWorkspaceId={
            profile.current_workspace_id || profile.workspace_id
          }
          currentRegionId={profile?.current_workspace_region_id}
        />
      )}

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

      {/* User Profile (moved from header) */}
      <div className="mt-auto border-t border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <span className="text-sm font-semibold">
              {(profile?.first_name?.[0] || "U").toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="truncate text-xs text-gray-500">{userEmail}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
