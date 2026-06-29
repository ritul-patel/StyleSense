"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";import { AppIcon } from "@/components/ui/AppIcon";


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      // redirectTo resolves to https://stylesense.co.in/reset-password in production.
      // IMPORTANT: This URL must also be added to the Supabase Dashboard:
      //   Authentication → URL Configuration → Redirect URLs
      //   Add: https://stylesense.co.in/reset-password
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : "/reset-password";

      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (authError) throw authError;

      if (rememberMe) {
        localStorage.setItem("remember_me", "true");
      }

      setMessage("Check your email to reset your password.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10 overflow-y-auto" data-lenis-prevent>
      {/* Background decoration */}
      <div className="fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary-fixed/20 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-tertiary-fixed/10 blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-[420px] flex flex-col items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-10">
          <img src="/logo.png" alt="StyleSense" className="w-9 h-9 object-contain" />
          <span className="text-2xl font-extrabold tracking-tight text-on-surface font-[family-name:var(--font-headline)]">
            StyleSense
          </span>
        </Link>

        {/* Card */}
        <div className="w-full bg-surface-container-lowest rounded-3xl border border-black/5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.08)] p-7 sm:p-9">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-on-surface font-[family-name:var(--font-headline)]">
              Reset your password
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          {/* Success message */}
          {message && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-50 border border-green-200 mb-5" role="status">
              <AppIcon name="check_circle" size={18} className="text-green-600 mt-0.5" />
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error || undefined}
            />

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-on-surface-variant">Remember me</span>
            </label>

            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              className="w-full mt-2"
            >
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-sm text-on-surface-variant text-center">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
