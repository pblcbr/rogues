import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/favicon?domain=example.com
 * Returns a redirect to a best-effort favicon URL for the given domain.
 * We use a reliable external provider and fall back to the site's /favicon.ico.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainParam = searchParams.get("domain")?.trim();

  if (!domainParam) {
    return NextResponse.json(
      { error: "Missing domain parameter" },
      { status: 400 }
    );
  }

  // Normalize: strip protocol and path if provided
  const normalized = domainParam
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "")
    .split("/")[0];

  if (!/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(normalized)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  // Primary provider: Google's s2 service (simple, fast)
  const googleIcon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    normalized
  )}&sz=128`;

  // Secondary fallback: DuckDuckGo icons
  const ddgIcon = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(normalized)}.ico`;

  // Last-resort: site's own /favicon.ico
  const siteIcon = `https://${normalized}/favicon.ico`;

  // For privacy and simplicity, just issue a 302 to the first option.
  // Client can let the browser cache the actual asset.
  // If you want stronger guarantees, you could probe the URL server-side, but that adds latency.
  const urlChain = [googleIcon, ddgIcon, siteIcon];
  const target = urlChain[0];

  return NextResponse.redirect(target, 302);
}
