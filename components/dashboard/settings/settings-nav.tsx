"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building2, Users } from "lucide-react";

const settingsSections = [
  { name: "Workspace", icon: Building2, param: "workspace" },
  { name: "Account", icon: Users, param: "account" },
];

/**
 * Settings Navigation Component
 * Vertical navigation for settings sections
 */
export function SettingsNav() {
  const searchParams = useSearchParams();
  const currentSection = searchParams?.get("section") || "workspace";

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
            {section.name}
          </Link>
        );
      })}
    </nav>
  );
}
