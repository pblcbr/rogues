import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SettingsNav } from "@/components/dashboard/settings/settings-nav";
import { ProfileSection } from "@/components/dashboard/settings/profile-section-with-tabs";
import { WorkspacesSection } from "@/components/dashboard/settings/workspaces-section";
import type { Database } from "@/lib/supabase/types";

/**
 * Settings Page
 * Profile (with billing) and Workspaces management
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { section?: string; tab?: string };
}) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, stripe_customer_id")
    .eq("id", session.user.id)
    .single();

  const section = searchParams?.section || "profile";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your workspace and account preferences
        </p>
      </div>

      {/* Settings Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar Navigation */}
        <div className="col-span-3">
          <div className="sticky top-6">
            <SettingsNav currentSection={section} />
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-9">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            {section === "profile" ? (
              <ProfileSection user={session.user} profile={profile} />
            ) : (
              <WorkspacesSection user={session.user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
