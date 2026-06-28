"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";
import posthog from "posthog-js";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const trackedAcceptRef = useRef(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/analysis");
    }
  }, [user, authLoading, router]);

  const handleTermsChange = (checked: boolean) => {
    setAcceptedTerms(checked);
    setTermsError("");
    if (checked && !trackedAcceptRef.current) {
      trackedAcceptRef.current = true;
      posthog.capture("terms_accepted");
    }
  };

  const validateTerms = (): boolean => {
    if (!acceptedTerms) {
      setTermsError("Please accept the Privacy Policy and Terms & Conditions to continue.");
      return false;
    }
    setTermsError("");
    return true;
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!validateTerms()) return;

    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      setSuccessMessage("Account created! Check your email to confirm your account.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAcceptedTerms(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSignUp = async () => {
    if (!validateTerms()) return;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth-check/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  if (authLoading) return null;

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
              Create your account
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Start discovering your perfect colors
            </p>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm font-semibold text-on-surface hover:bg-surface-container-low hover:border-outline transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <svg className="w-5 h-5" viewBox="0 0 46 47" fill="none">
              <path d="M46 24.0287C46 22.09 45.8533 20.68 45.5013 19.2112H23.4694V27.9356H36.4069C36.1429 30.1094 34.7347 33.37 31.5957 35.5731L31.5663 35.8669L38.5191 41.2719L38.9885 41.3306C43.4477 37.2181 46 31.1669 46 24.0287Z" fill="#4285F4" />
              <path d="M23.4694 47C29.8061 47 35.1161 44.9144 39.0179 41.3012L31.625 35.5437C29.6301 36.9244 26.9898 37.8937 23.4987 37.8937C17.2793 37.8937 12.0281 33.7812 10.1505 28.1412L9.88649 28.1706L2.61097 33.7812L2.52296 34.0456C6.36608 41.7125 14.287 47 23.4694 47Z" fill="#34A853" />
              <path d="M10.1212 28.1413C9.62245 26.6725 9.32908 25.1156 9.32908 23.5C9.32908 21.8844 9.62245 20.3275 10.0918 18.8588V18.5356L2.75765 12.8369L2.52296 12.9544C0.909439 16.1269 0 19.7106 0 23.5C0 27.2894 0.909439 30.8731 2.49362 34.0456L10.1212 28.1413Z" fill="#FBBC05" />
              <path d="M23.4694 9.07688C27.8699 9.07688 30.8622 10.9863 32.5344 12.5725L39.1645 6.11C35.0867 2.32063 29.8061 0 23.4694 0C14.287 0 6.36607 5.2875 2.49362 12.9544L10.0918 18.8588C11.9987 13.1894 17.25 9.07688 23.4694 9.07688Z" fill="#EB4335" />
            </svg>
            Continue with Google
          </button>

          <Divider label="or" className="my-6" />

          {/* Success message */}
          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-50 border border-green-200 mb-4" role="status">
              <span className="material-symbols-outlined text-green-600 text-lg shrink-0 mt-0.5">check_circle</span>
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helper="Must be at least 8 characters"
            />

            <Input
              label="Confirm Password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {/* Terms */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => handleTermsChange(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-outline-variant text-primary focus:ring-primary/20 shrink-0"
                  aria-describedby={termsError ? "terms-error" : undefined}
                />
                <span className="text-sm text-on-surface-variant leading-snug">
                  I agree to the{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    Privacy Policy
                  </a>{" "}and{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    Terms & Conditions
                  </a>
                </span>
              </label>
              {termsError && (
                <p id="terms-error" className="mt-1.5 text-xs text-error font-medium" role="alert">
                  {termsError}
                </p>
              )}
            </div>

            {/* Error */}
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
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-sm text-on-surface-variant text-center">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
