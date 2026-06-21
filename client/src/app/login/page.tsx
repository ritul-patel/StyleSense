"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

function getLoginErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Something went wrong.";

  if (/failed to fetch|networkerror|network error/i.test(error.message)) {
    return "Authentication service is unreachable. Check the Supabase URL and network connection.";
  }

  return error.message;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/analysis");
    }
  }, [user, authLoading, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      // Supabase persistence is configured in the client; checkbox kept for UI parity.
      if (!rememberMe) {
        sessionStorage.setItem("temporary_login", "true");
      }

      const hasPending = !!localStorage.getItem("pending_result");
      router.push(hasPending ? "/result" : "/analysis");
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 dark:bg-neutral-900">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xs dark:border-neutral-700 dark:bg-neutral-800">
        <div className="p-4 sm:p-7">
          <div className="text-center">
            <h3
              id="hs-modal-signin-label"
              className="block text-2xl font-bold text-gray-800 dark:text-neutral-200"
            >
              Sign in
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300">
              Don&apos;t have an account yet?{" "}
              <a
                className="font-medium text-blue-600 decoration-2 hover:underline focus:outline-hidden focus:underline dark:text-blue-500"
                href="/signup"
              >
                Sign up here
              </a>
            </p>
          </div>

          <div className="mt-5">
                      <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: "https://www.stylesens.in/auth-check/callback",
                },
              });

              if (error) {
                setError(error.message);
              }
            }}
            className="inline-flex w-full items-center justify-center gap-x-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
          >
              <svg className="h-auto w-4" width="46" height="47" viewBox="0 0 46 47" fill="none">
                <path
                  d="M46 24.0287C46 22.09 45.8533 20.68 45.5013 19.2112H23.4694V27.9356H36.4069C36.1429 30.1094 34.7347 33.37 31.5957 35.5731L31.5663 35.8669L38.5191 41.2719L38.9885 41.3306C43.4477 37.2181 46 31.1669 46 24.0287Z"
                  fill="#4285F4"
                />
                <path
                  d="M23.4694 47C29.8061 47 35.1161 44.9144 39.0179 41.3012L31.625 35.5437C29.6301 36.9244 26.9898 37.8937 23.4987 37.8937C17.2793 37.8937 12.0281 33.7812 10.1505 28.1412L9.88649 28.1706L2.61097 33.7812L2.52296 34.0456C6.36608 41.7125 14.287 47 23.4694 47Z"
                  fill="#34A853"
                />
                <path
                  d="M10.1212 28.1413C9.62245 26.6725 9.32908 25.1156 9.32908 23.5C9.32908 21.8844 9.62245 20.3275 10.0918 18.8588V18.5356L2.75765 12.8369L2.52296 12.9544C0.909439 16.1269 0 19.7106 0 23.5C0 27.2894 0.909439 30.8731 2.49362 34.0456L10.1212 28.1413Z"
                  fill="#FBBC05"
                />
                <path
                  d="M23.4694 9.07688C27.8699 9.07688 30.8622 10.9863 32.5344 12.5725L39.1645 6.11C35.0867 2.32063 29.8061 0 23.4694 0C14.287 0 6.36607 5.2875 2.49362 12.9544L10.0918 18.8588C11.9987 13.1894 17.25 9.07688 23.4694 9.07688Z"
                  fill="#EB4335"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="after:ms-6 mt-3 flex items-center py-3 text-xs uppercase text-gray-400 before:me-6 before:flex-1 before:border-t before:border-gray-200 after:flex-1 after:border-t after:border-gray-200 dark:text-neutral-500 dark:before:border-neutral-700 dark:after:border-neutral-700">
              Or
            </div>

            <form onSubmit={handleSubmit}>
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
                      aria-describedby={error ? "login-error" : undefined}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm text-gray-800 dark:text-neutral-200"
                    >
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-800 placeholder:text-gray-500 focus:border-blue-700 focus:ring-blue-700 disabled:pointer-events-none disabled:opacity-50 sm:py-3 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder:text-neutral-400 dark:focus:border-blue-600 dark:focus:ring-blue-600"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={!!error}
                      aria-describedby={error ? "login-error" : undefined}
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
                  <p id="login-error" className="text-xs text-red-600">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-x-2 rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:pointer-events-none disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:bg-blue-600"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
