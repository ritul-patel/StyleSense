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
