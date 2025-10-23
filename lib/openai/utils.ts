/**
 * Domain validation utilities
 * These functions don't require OpenAI and can run on client or server
 */

/**
 * Validates if a domain is likely to be a business domain
 * Rejects personal emails and free email providers
 */
export function isBusinessDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  const freeProviders = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "aol.com",
    "protonmail.com",
    "mail.com",
  ];

  return !freeProviders.includes(domain);
}

/**
 * Extracts domain from email address
 */
export function extractDomain(email: string): string {
  return email.split("@")[1] || "";
}
