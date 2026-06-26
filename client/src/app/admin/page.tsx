"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect /admin to /admin/dashboard
export default function AdminIndexPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/dashboard"); }, [router]);
  return null;
}
