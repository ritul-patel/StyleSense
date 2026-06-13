"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 dark:bg-neutral-900">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xs dark:border-neutral-700 dark:bg-neutral-800">
        <div className="p-4 sm:p-7">
          <div className="text-center">
            <h3
              id="hs-modal-signin-label"
              className="block text-2xl font-bold text-gray-800 dark:text-neutral-200"
            >
              Forgot password?
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300">
              Remember your password?{" "}
              <a
                className="font-medium text-blue-600 decoration-2 hover:underline focus:outline-hidden focus:underline dark:text-blue-500"
                href="/login"
              >
                Sign in here
              </a>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5">
            <div className="grid gap-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm text-gray-800 dark:text-neutral-200">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-800 placeholder:text-gray-500 focus:border-blue-700 focus:ring-blue-700 disabled:pointer-events-none disabled:opacity-50 sm:py-3 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder:text-neutral-400 dark:focus:border-blue-600 dark:focus:ring-blue-600"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? "forgot-password-error" : undefined}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex">
                  <input
                    id="checkbox"
                    name="checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 shrink-0 rounded-sm border-gray-300 bg-transparent text-blue-600 shadow-2xs focus:ring-0 focus:ring-offset-0 checked:border-blue-600 checked:bg-blue-600 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-600 dark:text-blue-500 dark:checked:border-blue-500 dark:checked:bg-blue-500"
                  />
                </div>
                <div className="ms-3">
                  <label htmlFor="checkbox" className="text-sm text-gray-800 dark:text-neutral-200">
                    Remember me
                  </label>
                </div>
              </div>

              {error ? (
                <p id="forgot-password-error" className="text-xs text-red-600">
                  {error}
                </p>
              ) : null}

              {message ? <p className="text-xs text-green-600 dark:text-green-400">{message}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-x-2 rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:pointer-events-none disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:bg-blue-600"
              >
                {loading ? "Sending..." : "Reset password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
