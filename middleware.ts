import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const path = request.nextUrl.pathname;

  // Private: dashboard
  if (path.startsWith("/dashboard")) {
    const supabase = createMiddlewareClient({ req: request, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
  }

  return res;
}

export const config = { matcher: ["/dashboard/:path*"] };
