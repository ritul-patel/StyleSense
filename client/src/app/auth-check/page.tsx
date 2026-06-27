"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AuthCheckPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/result");
    } else {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Render nothing — this page only exists to route
  return null;
}
