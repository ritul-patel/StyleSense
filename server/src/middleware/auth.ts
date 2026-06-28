import { createClient, type User } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";
import { supabaseServiceRoleKey, supabaseUrl } from "../config/supabase";

export type AuthenticatedRequest = Request & {
  user?: User;
};

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function getBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader) return "";
  if (!authorizationHeader.toLowerCase().startsWith("bearer ")) return "";
  return authorizationHeader.slice(7).trim();
}

async function verifyToken(
  token: string,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authStart = Date.now();

  let data: any;
  let error: any;

  try {
    const result = await supabase.auth.getUser(token);
    data = result.data;
    error = result.error;
  } catch (fetchErr: any) {
    // Network-level failures (SSL, DNS, proxy issues)
    const msg = fetchErr?.message || String(fetchErr);
    if (msg.includes("SELF_SIGNED_CERT") || msg.includes("CERT_")) {
      console.error("[auth] SSL/TLS certificate error connecting to Supabase.");
      console.error("[auth] This usually means a local proxy or antivirus is intercepting HTTPS.");
      console.error("[auth] Fix: Export your proxy/antivirus root CA and set NODE_EXTRA_CA_CERTS=/path/to/ca.pem");
      console.error("[auth] Raw error:", msg);
    } else {
      console.error("[auth] Network error verifying token:", msg);
    }
    res.status(401).json({ success: false, message: "Authentication service unavailable" });
    return;
  }

  const authMs = Date.now() - authStart;

  if (authMs > 500) {
    console.warn(`[auth] Verification took ${authMs}ms`);
  }

  if (error || !data.user) {
    console.error("[auth] Token verification failed:", error?.message ?? "no user returned");
    res.status(401).json({ success: false, message: "Invalid token" });
    return;
  }

  (req as any)._authMs = authMs;
  req.user = data.user;
  next();
}

// Requires a valid token. No token or invalid token → 401.
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  await verifyToken(token, req, res, next);
}

// Token optional. No token → proceed as guest (req.user undefined).
// Invalid token → 401.
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return next();
  }

  await verifyToken(token, req, res, next);
}
