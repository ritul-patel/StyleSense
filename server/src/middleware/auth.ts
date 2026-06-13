import { createClient, type User } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";

export type AuthenticatedRequest = Request & {
  user?: User;
};

const supabaseUrl = process.env.SUPABASE_URL?.trim() || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

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
  if (!supabase) {
    console.error("[auth] Supabase client not initialised — check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    res.status(500).json({ success: false, message: "Supabase auth is not configured on the server." });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    console.error("[auth] Token verification failed:", error?.message ?? "no user returned");
    res.status(401).json({ success: false, message: "Invalid token" });
    return;
  }

  console.log("[auth] User verified:", data.user.id);
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
    console.warn("[auth] No token — returning 401");
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
