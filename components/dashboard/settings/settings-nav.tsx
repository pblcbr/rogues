"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  CreditCard,
  Bell,
  Lock,
  Palette,
} from "lucide-react";

const settingsSections = [
  { name: "Workspace", icon: Building2, param: null },
  { name: "Team Members", icon: Users, param: "team" },
  { name: "Billing", icon: CreditCard, param: "billing" },
  { name: "Notifications", icon: Bell, param: "notifications" },
  { name: "Security", icon: Lock, param: "security" },
  { name: "Appearance", icon: Palette, param: "appearance" },
];

/**
 * Settings Navigation Component
 * Vertical navigation for settings sections
 */
export function SettingsNav() {
  const searchParams = useSearchParams();
  const currentSection = searchParams?.get("section");

  return (
    <nav className="space-y-1">
      {settingsSections.map((section) => {
        const Icon = section.icon;
        const isActive =
          (section.param === null && !currentSection) ||
          currentSection === section.param;

        return (
          <Link
            key={section.name}
            href={
              section.param
                ? `/dashboard/settings?section=${section.param}`
                : "/dashboard/settings"
            }
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
