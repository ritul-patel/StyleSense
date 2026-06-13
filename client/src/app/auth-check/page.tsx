"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AuthCheckPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const hasPending = !!localStorage.getItem("pending_result");
    console.log("[auth-check] Checking auth. user:", !!user, "hasPending:", hasPending);
    if (user) {
      console.log("[auth-check] User logged in → /result");
      router.replace("/result");
    } else {
      console.log("[auth-check] Not logged in → /login");
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Render nothing — this page only exists to route
  return null;
}
