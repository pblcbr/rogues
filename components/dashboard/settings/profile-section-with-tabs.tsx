"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { User, CreditCard } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileInfoTab } from "./profile-info-tab";
import { ProfileBillingTab } from "./profile-billing-tab";

interface ProfileSectionProps {
  user: any;
  profile: any;
}

/**
 * Profile Section with Tabs
 * Personal information and billing
 */
export function ProfileSection({ user, profile }: ProfileSectionProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab = searchParams?.get("tab") || "info";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/settings?section=profile&tab=${value}`, {
      scroll: false,
    });
  };

  return (
    <>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            <p className="text-sm text-gray-500">
              Manage your personal information and billing
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="border-b border-gray-200 px-6 pt-4">
          <TabsList>
            <TabsTrigger value="info">
              <User className="mr-2 h-4 w-4" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <TabsContent value="info" className="mt-0">
            <ProfileInfoTab user={user} profile={profile} />
          </TabsContent>

          <TabsContent value="billing" className="mt-0">
            <ProfileBillingTab profile={profile} />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
