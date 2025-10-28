/**
 * Lightweight heuristics for mention, citations, sentiment and prominence.
 * These are deterministic and cheap; replace with model-based variants later.
 */

export function normalize(text: string): string {
  return (text || "").toLowerCase();
}

export function extractUrls(text: string): string[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s)]+)|(www\.[^\s)]+)/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches));
}

export function toDomain(url: string): string | null {
  try {
    const withProto = url.startsWith("http") ? url : `https://${url}`;
    const u = new URL(withProto);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function extractCitations(
  text: string
): { url?: string; domain: string }[] {
  const urls = extractUrls(text);
  const domains = urls.map(toDomain).filter((d): d is string => !!d);
  const uniqueDomains = Array.from(new Set(domains));
  return uniqueDomains.map((d) => ({ domain: d }));
}

export function detectMention(
  text: string,
  brand?: string,
  domain?: string
): boolean {
  const t = normalize(text);
  const needles: string[] = [];
  if (brand) needles.push(brand.toLowerCase());
  if (domain) needles.push(domain.toLowerCase(), domain.replace(/^www\./, ""));
  return needles.some((n) => n && t.includes(n));
}

export function sentimentScore(text: string): number | null {
  if (!text) return null;
  const t = normalize(text);
  const pos = ["best", "recommended", "great", "top", "ideal", "trusted"];
  const neg = ["avoid", "poor", "bad", "limitations", "issues", "problem"];
  let score = 0;
  pos.forEach((w) => (score += t.includes(w) ? 1 : 0));
  neg.forEach((w) => (score -= t.includes(w) ? 1 : 0));
  if (score === 0) return 0;
  return Math.max(-1, Math.min(1, score / 3));
}

export function prominenceScore(
  text: string,
  brand?: string,
  domain?: string
): number | null {
  if (!text) return null;
  const t = text;
  const needle = brand || domain || "";
  if (!needle) return 0;
  const idx = t.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return 0;
  const len = t.length || 1;
  const position = idx / len; // 0 (early) .. 1 (late)
  let score = position < 0.15 ? 0.6 : position < 0.4 ? 0.35 : 0.15;
  // Bonus if appears in a top-N list-like pattern near the brand
  const snippet = t.slice(Math.max(0, idx - 80), Math.min(len, idx + 120));
  if (/\b(1\.|2\.|3\.|-\s)/.test(snippet)) score += 0.15;
  // Bonus if a link is nearby
  if (/https?:\/\//i.test(snippet)) score += 0.15;
  return Math.max(0, Math.min(1, score));
}
