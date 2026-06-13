"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("[RequireAuth] Triggered on route:", window.location.pathname);
    if (loading) return; // wait — do not redirect while session is resolving
    console.log("[RequireAuth] Auth resolved. user:", !!user, "| route:", window.location.pathname);
    if (!user) {
      console.log("[RequireAuth] No user — redirecting to /login");
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Show nothing while auth resolves; once resolved with no user, redirect fires above
  if (loading || !user) return null;

  return <>{children}</>;
}
