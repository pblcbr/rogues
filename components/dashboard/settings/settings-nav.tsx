"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Building2, User } from "lucide-react";

interface SettingsNavProps {
  currentSection?: string;
}

const settingsSections = [
  {
    name: "Profile",
    description: "Account & billing",
    icon: User,
    param: "profile",
  },
  {
    name: "Workspaces",
    description: "Manage all workspaces",
    icon: Building2,
    param: "workspaces",
  },
];

/**
 * Settings Navigation Component
 * Navigate between Profile and Workspaces
 */
export function SettingsNav({ currentSection = "profile" }: SettingsNavProps) {
  return (
    <nav className="space-y-1">
      {settingsSections.map((section) => {
        const Icon = section.icon;
        const isActive = currentSection === section.param;

        return (
          <Link
            key={section.name}
            href={`/dashboard/settings?section=${section.param}`}
            className={cn(
              "flex items-start rounded-lg border px-4 py-3 transition-all",
              isActive
                ? "border-blue-200 bg-blue-50"
                : "border-transparent hover:bg-gray-50"
            )}
          >
            <Icon
              className={cn(
                "mr-3 mt-0.5 h-5 w-5 flex-shrink-0",
                isActive ? "text-blue-600" : "text-gray-400"
              )}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-blue-700" : "text-gray-900"
                )}
              >
                {section.name}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-xs",
                  isActive ? "text-blue-600" : "text-gray-500"
                )}
              >
                {section.description}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
