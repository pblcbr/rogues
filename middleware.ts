import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware to handle Supabase auth and refresh sessions
 * This runs on every request to manage auth state via cookies
 */
export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect routes that require authentication
  const protectedRoutes = ["/dashboard", "/settings", "/workspace"];
  const authRoutes = ["/register", "/login"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if trying to access protected route without auth
  if (isProtectedRoute && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/register";
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard ONLY if user has completed payment (has workspace)
  if (isAuthRoute && session) {
    // Check if user has workspace_id (payment completed)
    const { data: profile } = await supabase
      .from("profiles")
      .select("workspace_id")
      .eq("id", session.user.id)
      .single();

    // Only redirect to dashboard if they have a workspace (paid)
    // If no workspace, they're still completing registration/payment - allow access to /register
    if (profile?.workspace_id) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
