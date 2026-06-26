import type { NextFunction, Response } from "express";
import { authMiddleware, type AuthenticatedRequest } from "./auth";

/**
 * Admin authorization middleware.
 * SECURITY: Only trusts app_metadata.role which can only be set server-side
 * via the Supabase service role key. user_metadata is NOT trusted as users
 * can self-modify it via the client SDK.
 */
export async function adminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // First ensure user is authenticated
  await new Promise<void>((resolve) => {
    authMiddleware(req, res, () => resolve());
  });

  if (res.headersSent) return;

  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // ONLY trust app_metadata — it can only be set by service_role (server-side)
  const appRole = (user as any).app_metadata?.role;

  if (appRole !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden: admin access required." });
  }

  next();
}
