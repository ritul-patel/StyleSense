"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState("");

  // Listen for the PASSWORD_RECOVERY event which fires when Supabase
  // processes the recovery token from the URL hash/code parameter
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Session is established with recovery token — user can now set a new password
        setSessionReady(true);
      } else if (event === "SIGNED_IN" && session) {
        // Some flows fire SIGNED_IN instead of PASSWORD_RECOVERY
        // Check if we're on this page with a valid session
        setSessionReady(true);
      }
    });

    // Also check if there's already a session (page reload after token exchange)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    // Handle the case where the URL has a code parameter (PKCE flow)
    // Supabase JS client auto-detects hash fragments, but for code-based flow
    // we need to check the URL
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setSessionError("This reset link has expired or is invalid. Please request a new one.");
        } else {
          setSessionReady(true);
        }
      });
    }

    // Give Supabase a moment to process hash fragments if no code param
    const timeout = setTimeout(() => {
      if (!sessionReady) {
        // Check one more time
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setSessionReady(true);
          } else if (!code) {
            setSessionError("This reset link has expired or is invalid. Please request a new one.");
          }
        });
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
        <div className="fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary-fixed/20 blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-tertiary-fixed/10 blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-[420px] flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <img src="/logo.png" alt="StyleSense" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-extrabold tracking-tight text-on-surface font-[family-name:var(--font-headline)]">
              StyleSense
            </span>
          </Link>

          <div className="w-full bg-surface-container-lowest rounded-3xl border border-black/5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.08)] p-7 sm:p-9">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-green-600 text-[32px]">check_circle</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-on-surface font-[family-name:var(--font-headline)] mb-2">
                Password updated
              </h1>
              <p className="text-sm text-on-surface-variant mb-8">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Session error state (expired/invalid link)
  if (sessionError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
        <div className="fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary-fixed/20 blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-tertiary-fixed/10 blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-[420px] flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <img src="/logo.png" alt="StyleSense" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-extrabold tracking-tight text-on-surface font-[family-name:var(--font-headline)]">
              StyleSense
            </span>
          </Link>

          <div className="w-full bg-surface-container-lowest rounded-3xl border border-black/5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.08)] p-7 sm:p-9">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-error text-[32px]">error</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-on-surface font-[family-name:var(--font-headline)] mb-2">
                Link expired
              </h1>
              <p className="text-sm text-on-surface-variant mb-8">
                {sessionError}
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push("/forgot-password")}
              >
                Request new link
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state (waiting for session)
  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
        <div className="fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary-fixed/20 blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-tertiary-fixed/10 blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-[420px] flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2.5 mb-10">
            <img src="/logo.png" alt="StyleSense" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-extrabold tracking-tight text-on-surface font-[family-name:var(--font-headline)]">
              StyleSense
            </span>
          </Link>

          <div className="w-full bg-surface-container-lowest rounded-3xl border border-black/5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.08)] p-7 sm:p-9">
            <div className="flex flex-col items-center text-center py-4">
              <span className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-5" />
              <p className="text-sm text-on-surface-variant">Verifying your reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form state
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
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
              Set new password
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Choose a strong password for your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helper="Must be at least 8 characters"
            />

            <Input
              label="Confirm password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {/* Error display */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-error-container/30 border border-error/10" role="alert">
                <span className="material-symbols-outlined text-error text-lg shrink-0 mt-0.5">error</span>
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              className="w-full mt-2"
            >
              {loading ? "Updating..." : "Update password"}
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
