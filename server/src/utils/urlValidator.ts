/**
 * URL Validator — SSRF Protection
 *
 * Validates external image URLs before downloading to prevent:
 * - Private IP access (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x)
 * - Non-HTTPS schemes
 * - Localhost/loopback
 * - Invalid hostnames
 */

import { resolve4 } from "dns/promises";

const ALLOWED_SCHEMES = ["https:"];
const MAX_URL_LENGTH = 2048;

// Private/reserved IP ranges
function isPrivateIp(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return true;

  const [a, b] = parts;
  return (
    a === 10 ||                          // 10.0.0.0/8
    a === 127 ||                         // 127.0.0.0/8 (loopback)
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) ||          // 192.168.0.0/16
    (a === 169 && b === 254) ||          // 169.254.0.0/16 (link-local)
    a === 0 ||                           // 0.0.0.0/8
    (a === 100 && b >= 64 && b <= 127)   // 100.64.0.0/10 (CGNAT)
  );
}

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  url?: URL;
}

/**
 * Validate a URL for safe external image download.
 * Returns the parsed URL object if valid.
 */
export async function validateImageUrl(rawUrl: string): Promise<UrlValidationResult> {
  // Length check
  if (!rawUrl || rawUrl.length > MAX_URL_LENGTH) {
    return { valid: false, error: "URL is empty or exceeds maximum length." };
  }

  // Parse URL
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { valid: false, error: "Invalid URL format." };
  }

  // Scheme check
  if (!ALLOWED_SCHEMES.includes(url.protocol)) {
    return { valid: false, error: `Only HTTPS URLs are allowed. Got: ${url.protocol}` };
  }

  // Hostname check
  const hostname = url.hostname.toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".local")) {
    return { valid: false, error: "Localhost and local domains are not allowed." };
  }

  // IP literal check (e.g., https://192.168.1.1/img.jpg)
  const ipLiteralMatch = hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/);
  if (ipLiteralMatch && isPrivateIp(hostname)) {
    return { valid: false, error: "Private IP addresses are not allowed." };
  }

  // DNS resolution check — resolve hostname and verify no private IPs
  try {
    const ips = await resolve4(hostname);
    const privateIp = ips.find(isPrivateIp);
    if (privateIp) {
      return { valid: false, error: `Hostname resolves to a private IP address.` };
    }
  } catch {
    return { valid: false, error: `Could not resolve hostname: ${hostname}` };
  }

  return { valid: true, url };
}
