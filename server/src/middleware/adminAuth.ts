import type { NextFunction, Response } from "express";
import { authMiddleware, type AuthenticatedRequest } from "./auth";

/**
 * Admin authorization middleware.
 * Must be used AFTER authMiddleware (or chains it).
 * Checks user.app_metadata.role === "admin" OR user.user_metadata.role === "admin".
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

  // If authMiddleware already sent a response (401), stop
  if (res.headersSent) return;

  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const appRole = (user as any).app_metadata?.role;
  const userRole = (user as any).user_metadata?.role;

  if (appRole !== "admin" && userRole !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden: admin access required." });
  }

  next();
}
