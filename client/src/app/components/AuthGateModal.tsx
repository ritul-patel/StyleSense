"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

type AuthGateModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AuthGateModal({ open, onClose }: AuthGateModalProps) {
  const [mode, setMode] = useState<"choice" | "email">("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleGoogleAuth = async () => {
    // Mark pending intent BEFORE redirect (survives OAuth round-trip)
    sessionStorage.setItem("analysis_pending_intent", "true");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth-check/callback` },
    });
    if (error) setError(error.message);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (isSignUp && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setSuccess("Check your email to confirm, then click Analyze again.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        // Login success — onAuthStateChange will fire, analysis will auto-continue
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setMode("choice");
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center overflow-y-auto overscroll-contain"
          onClick={() => { onClose(); resetState(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-gate-title"
          data-lenis-prevent
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-white w-full sm:max-w-[520px] rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl my-auto max-h-[90vh] overflow-y-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
          >
            {/* Close button */}
            <button
              onClick={() => { onClose(); resetState(); }}
              aria-label="Close"
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-[#747686] hover:text-[#1b1c1b] hover:bg-[#f6f3f2] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Header */}
            <div className="text-center mb-6 pr-6">
              <div className="w-14 h-14 rounded-2xl bg-[#dde1ff] flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[#002b92] text-2xl">auto_awesome</span>
              </div>
              <h2 id="auth-gate-title" className="text-2xl font-extrabold tracking-tight text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                ✨ One Last Step
              </h2>
              <p className="mt-2 text-sm text-[#5a6060]">
                Create your free account to start your AI color analysis.
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-[#f6f3f2] rounded-xl p-4 mb-6 space-y-2.5">
              {[
                "Analyze your photo with AI",
                "Save personalized results",
                "Build your digital wardrobe",
                "View analysis history",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#002b92] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-sm text-[#1b1c1b] font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {mode === "choice" ? (
              <>
                {/* Google button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-[#e4e2e1] bg-white text-sm font-semibold text-[#1b1c1b] hover:bg-[#f6f3f2] hover:border-[#c4c5d7] transition-all mb-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 46 47" fill="none">
                    <path d="M46 24.0287C46 22.09 45.8533 20.68 45.5013 19.2112H23.4694V27.9356H36.4069C36.1429 30.1094 34.7347 33.37 31.5957 35.5731L31.5663 35.8669L38.5191 41.2719L38.9885 41.3306C43.4477 37.2181 46 31.1669 46 24.0287Z" fill="#4285F4" />
                    <path d="M23.4694 47C29.8061 47 35.1161 44.9144 39.0179 41.3012L31.625 35.5437C29.6301 36.9244 26.9898 37.8937 23.4987 37.8937C17.2793 37.8937 12.0281 33.7812 10.1505 28.1412L9.88649 28.1706L2.61097 33.7812L2.52296 34.0456C6.36608 41.7125 14.287 47 23.4694 47Z" fill="#34A853" />
                    <path d="M10.1212 28.1413C9.62245 26.6725 9.32908 25.1156 9.32908 23.5C9.32908 21.8844 9.62245 20.3275 10.0918 18.8588V18.5356L2.75765 12.8369L2.52296 12.9544C0.909439 16.1269 0 19.7106 0 23.5C0 27.2894 0.909439 30.8731 2.49362 34.0456L10.1212 28.1413Z" fill="#FBBC05" />
                    <path d="M23.4694 9.07688C27.8699 9.07688 30.8622 10.9863 32.5344 12.5725L39.1645 6.11C35.0867 2.32063 29.8061 0 23.4694 0C14.287 0 6.36607 5.2875 2.49362 12.9544L10.0918 18.8588C11.9987 13.1894 17.25 9.07688 23.4694 9.07688Z" fill="#EB4335" />
                  </svg>
                  Continue with Google
                </button>

                {/* Email button */}
                <button
                  type="button"
                  onClick={() => setMode("email")}
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}
                >
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  Continue with Email
                </button>

                {/* Maybe Later */}
                <button
                  type="button"
                  onClick={() => { onClose(); resetState(); }}
                  className="w-full mt-3 py-2.5 text-sm font-medium text-[#747686] hover:text-[#1b1c1b] transition-colors"
                >
                  Maybe Later
                </button>
              </>
            ) : (
              <>
                {/* Email form */}
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-[#e4e2e1] text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20 focus:border-[#002b92]"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      required
                      placeholder={isSignUp ? "Password (min 8 characters)" : "Password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-[#e4e2e1] text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20 focus:border-[#002b92]"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-600 font-medium">{error}</p>
                  )}
                  {success && (
                    <p className="text-xs text-green-600 font-medium">{success}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-all"
                    style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}
                  >
                    {loading ? "Processing..." : isSignUp ? "Create Account & Analyze" : "Sign In & Analyze"}
                  </button>
                </form>

                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccess(""); }}
                    className="text-xs text-[#002b92] font-medium hover:underline"
                  >
                    {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { setMode("choice"); setError(""); setSuccess(""); }}
                  className="w-full mt-2 py-2 text-sm font-medium text-[#747686] hover:text-[#1b1c1b] transition-colors"
                >
                  ← Back
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
