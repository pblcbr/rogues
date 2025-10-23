import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { SettingsNav } from "@/components/dashboard/settings/settings-nav";
import { WorkspaceSettings } from "@/components/dashboard/settings/workspace-settings";
import type { Database } from "@/lib/supabase/types";

/**
 * Settings Page
 * Workspace and account configuration
 */
export default async function SettingsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  // Fetch profile and workspace
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, workspaces(*)")
    .eq("id", session.user.id)
    .single();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your workspace and account preferences
        </p>
      </div>

      {/* Settings Content */}
      <div className="grid grid-cols-4 gap-6">
        {/* Navigation */}
        <div className="col-span-1">
          <SettingsNav />
        </div>

        {/* Content */}
        <div className="col-span-3">
          <WorkspaceSettings
            workspace={profile?.workspaces}
            user={session.user}
          />
        </div>
      </div>
    </div>
  );
}
