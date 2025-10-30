"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

interface Profile {
  current_workspace_id?: string | null;
  workspace_id?: string | null;
  current_workspace_region_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  is_agency?: boolean;
}

interface SidebarProps {
  profile: Profile | null;
  userEmail?: string;
}

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Topics", href: "/dashboard/topics", icon: BookOpen },
  { name: "Prompts", href: "/dashboard/prompts", icon: Target },
  { name: "Actions", href: "/dashboard/actions", icon: Zap },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const SIDEBAR_STORAGE_KEY = "dashboard-sidebar-collapsed";

/**
 * Dashboard Sidebar Navigation
 * Desktop-first vertical navigation with collapse/expand functionality
 */
export function DashboardSidebar({ profile, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(newState));
      return newState;
    });
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    window.location.assign("/login");
  };

  return (
    <div
      className={cn(
        "relative flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-gray-200",
          isCollapsed ? "justify-center px-2" : "px-6"
        )}
      >
        <Link href="/dashboard" className="flex items-center">
          {isCollapsed ? (
            <span className="text-2xl font-bold text-gray-900">t</span>
          ) : (
            <span className="text-2xl font-bold text-gray-900">tacmind</span>
          )}
        </Link>
      </div>

      {/* Workspace Selector - Hide when collapsed */}
      {!isCollapsed && (
        <WorkspaceSwitcher
          currentWorkspaceId={profile?.current_workspace_id || undefined}
          isAgency={profile?.is_agency || false}
        />
      )}

      {/* Region Selector - Hide when collapsed */}
      {!isCollapsed &&
        (profile?.current_workspace_id || profile?.workspace_id) && (
          <RegionSwitcher
            currentWorkspaceId={
              profile.current_workspace_id || profile.workspace_id || undefined
            }
            currentRegionId={profile?.current_workspace_region_id || undefined}
            onSwitchToNewRegion={async (regionId) => {
              // Switch to new region via API
              try {
                const response = await fetch("/api/user/switch-region", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ regionId }),
                });

                if (response.ok) {
                  // Force full page reload to ensure all data updates
                  window.location.reload();
                }
              } catch (error) {
                console.error("Error switching region:", error);
              }
            }}
          />
        )}

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 space-y-1 overflow-y-auto py-4",
          isCollapsed ? "px-2" : "px-3"
        )}
      >
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
                "flex items-center rounded-lg py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                isCollapsed ? "justify-center px-2" : "px-3"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-blue-700" : "text-gray-400",
                  !isCollapsed && "mr-3"
                )}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile (moved from header) */}
      <div
        className={cn(
          "mt-auto border-t border-gray-200 py-4",
          isCollapsed ? "px-2" : "px-4"
        )}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <span className="text-sm font-semibold">
                {(profile?.first_name?.[0] || "U").toUpperCase()}
              </span>
            </div>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex items-center justify-center rounded-md bg-gray-900 p-2 text-white hover:bg-gray-800 disabled:opacity-50"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
