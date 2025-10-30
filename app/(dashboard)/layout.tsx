import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import type { Database } from "@/lib/supabase/types";
import { AddWorkspaceModalRoot } from "@/components/dashboard/add-workspace-modal-root";

/**
 * Dashboard Layout
 * Protected layout for authenticated users
 * Includes sidebar navigation and header
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  // Validate and fix current_workspace_region_id if needed
  if (profile?.current_workspace_id) {
    // Get all regions for this workspace to determine the correct one
    const { data: allRegions } = await supabase
      .from("workspace_regions")
      .select("id, region, language, is_default")
      .eq("workspace_id", profile.current_workspace_id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });

    console.log("[Layout] All regions for workspace:", allRegions);
    console.log(
      "[Layout] Current profile region ID:",
      profile.current_workspace_region_id
    );

    if (allRegions && allRegions.length > 0) {
      // Determine which region should be used (default first, then first created)
      const defaultRegion =
        allRegions.find((r) => r.is_default) || allRegions[0];
      const currentRegion = profile.current_workspace_region_id
        ? allRegions.find((r) => r.id === profile.current_workspace_region_id)
        : null;

      console.log("[Layout] Default region should be:", defaultRegion);
      console.log("[Layout] Current region in profile:", currentRegion);

      // Only fix if current region is invalid or missing
      // Don't force to default if user has a valid region selected (even if not default)
      if (!currentRegion) {
        // Current region doesn't exist or is invalid, use default
        console.log(
          "[Layout] Current region is invalid or missing, updating to default:",
          defaultRegion.id
        );
        await supabase
          .from("profiles")
          .update({ current_workspace_region_id: defaultRegion.id })
          .eq("id", session.user.id);

        profile.current_workspace_region_id = defaultRegion.id;
      } else {
        // Current region is valid, keep it (don't force to default)
        console.log(
          "[Layout] Current region is valid, keeping it:",
          currentRegion.region,
          currentRegion.language
        );
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar profile={profile} userEmail={session.user.email} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
      {/* Global modals */}
      <AddWorkspaceModalRoot />
    </div>
  );
}
