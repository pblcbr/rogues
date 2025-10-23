import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components and Route Handlers
 * This client automatically handles session management with cookies
 */
export const createClient = () => {
  return createServerComponentClient({ cookies });
};
