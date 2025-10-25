"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bell, Search, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  user: any;
  profile: any;
}

/**
 * Dashboard Header
 * Top navigation bar with search, notifications, and user menu
 */
export function DashboardHeader({ user, profile }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8">
      {/* Search */}
      <div className="flex max-w-2xl flex-1 items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search prompts, results, actions..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="ml-4 flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* User Menu */}
        <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
