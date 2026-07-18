"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * Admin route guard.
 * SECURITY: Only trusts app_metadata.role (server-set only).
 * user_metadata is NOT trusted - users can self-modify it.
 */
function isAdmin(user: any): boolean {
  if (!user) return false;
  return user.app_metadata?.role === "admin";
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
