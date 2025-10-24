import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegistrationWizard } from "@/components/auth/registration-wizard";

/**
 * Registration page
 * Displays the 8-step registration wizard
 * Only redirects to dashboard if user has completed payment (has workspace)
 */
export default async function RegisterPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if user is authenticated AND has completed payment
  if (session?.user) {
    console.log("User authenticated, checking workspace...");

    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", session.user.id)
      .single();

    // Only redirect to dashboard if user has a workspace (payment completed)
    if (profile?.workspace_id) {
      console.log(
        "User has workspace, redirecting to dashboard:",
        session.user.email
      );
      redirect("/dashboard");
    } else {
      console.log(
        "User authenticated but no workspace, can continue registration"
      );
      // Let them continue to wizard (will go to step 6 if they have userId)
    }
  }

  return <RegistrationWizard />;
}
