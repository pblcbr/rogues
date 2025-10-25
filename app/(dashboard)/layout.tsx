import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import type { Database } from "@/lib/supabase/types";

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

  // Fetch user profile and workspace
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, workspaces(*)")
    .eq("id", session.user.id)
    .single();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar profile={profile} userEmail={session.user.email} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
