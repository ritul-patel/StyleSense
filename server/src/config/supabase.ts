import dotenv from "dotenv";

dotenv.config();

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function projectRefFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    const suffix = ".supabase.co";
    return hostname.endsWith(suffix) ? hostname.slice(0, -suffix.length) : null;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const supabaseUrl = requiredEnv("SUPABASE_URL");
export const supabaseServiceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
export const supabasePublishableKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)?.trim();

const urlProjectRef = projectRefFromUrl(supabaseUrl);
const serviceRoleProjectRef = decodeJwtPayload(supabaseServiceRoleKey)?.ref;

if (
  urlProjectRef &&
  typeof serviceRoleProjectRef === "string" &&
  serviceRoleProjectRef &&
  serviceRoleProjectRef !== urlProjectRef
) {
  throw new Error(
    `Supabase configuration mismatch: SUPABASE_URL points to project ${urlProjectRef}, but SUPABASE_SERVICE_ROLE_KEY belongs to project ${serviceRoleProjectRef}.`
  );
}
