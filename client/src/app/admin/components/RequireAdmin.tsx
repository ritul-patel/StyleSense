"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * Admin route guard.
 * Checks: user is authenticated AND has admin role in app_metadata or user_metadata.
 * Non-admins are redirected to home.
 */
function isAdmin(user: any): boolean {
  if (!user) return false;
  // Supabase stores roles in app_metadata (set by service role) or user_metadata
  const appRole = user.app_metadata?.role;
  const userRole = user.user_metadata?.role;
  return appRole === "admin" || userRole === "admin";
}

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isAdmin(user)) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user || !isAdmin(user)) return null;

  return <>{children}</>;
}

export { isAdmin };
