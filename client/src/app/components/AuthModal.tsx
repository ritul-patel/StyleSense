"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
};

const BENEFITS = [
  { icon: "auto_awesome", text: "Analyze your outfit with AI" },
  { icon: "bookmark", text: "Save personalized results" },
  { icon: "checkroom", text: "Build your digital wardrobe" },
  { icon: "history", text: "View analysis history" },
];

export default function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"choose" | "email">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If user becomes authenticated while modal is open, trigger callback
  useEffect(() => {
    if (user && open) {
      onAuthenticated();
    }
  }, [user, open, onAuthenticated]);

  const handleGoogleAuth = async () => {
    setError("");
    // Store intent flag so we know to auto-continue after OAuth redirect
    sessionStorage.setItem("analysis_pending_intent", "true");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth-check/callback`,
      },
    });
    if (error) setError(error.message);
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");

    try {
      if (isSignup) {
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          setLoading(false);
          return;
        }
        const { error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        // For email signup, user needs to verify — but sign them in anyway for the flow
        // Supabase auto-signs in on signup if email confirmation is disabled
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      }
      // onAuthenticated will be called by the useEffect above when user state updates
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const reset = useCallback(() => {
    setMode("choose");
    setEmail("");
    setPassword("");
    setError("");
    setIsSignup(false);
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-white w-full sm:max-w-[420px] rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-[#747686] hover:text-[#1b1c1b] hover:bg-[#f6f3f2] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-[#dde1ff] flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[#002b92] text-2xl">auto_awesome</span>
              </div>
              <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                One Last Step
              </h2>
              <p className="mt-2 text-sm text-[#5a6060]">
                Create your free account to start your AI color analysis.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-2.5 mb-6">
              {BENEFITS.map((b) => (
                <div key={b.text} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#002b92] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {b.icon}
                  </span>
                  <span className="text-sm text-[#1b1c1b] font-medium">{b.text}</span>
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2" role="alert">
                <span className="material-symbols-outlined text-red-500 text-lg shrink-0 mt-0.5">error</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {mode === "choose" ? (
              <>
                {/* Google button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-[#1b1c1b] hover:bg-gray-50 hover:border-gray-300 transition-all mb-3"
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
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}
                >
                  <span className="material-symbols-outlined text-lg">mail</span>
                  Continue with Email
                </button>

                {/* Maybe Later */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full mt-4 py-2.5 text-sm font-medium text-[#747686] hover:text-[#1b1c1b] transition-colors text-center"
                >
                  Maybe Later
                </button>
              </>
            ) : (
              <>
                {/* Email form */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#747686] font-bold block mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20 focus:border-[#002b92]/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#747686] font-bold block mb-1.5">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignup ? "Minimum 8 characters" : "••••••••"}
                      autoComplete={isSignup ? "new-password" : "current-password"}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b92]/20 focus:border-[#002b92]/40 transition-all"
                      onKeyDown={(e) => { if (e.key === "Enter") handleEmailAuth(); }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEmailAuth}
                  disabled={loading || !email.trim() || !password.trim()}
                  className="w-full h-12 mt-4 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}
                >
                  {loading ? "Please wait..." : isSignup ? "Create Account & Analyze" : "Sign In & Analyze"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="w-full mt-3 py-2 text-xs font-medium text-[#002b92] hover:underline text-center"
                >
                  {isSignup ? "Already have an account? Sign in" : "Don't have an account? Create one"}
                </button>

                {/* Back to choose */}
                <button
                  type="button"
                  onClick={() => { setMode("choose"); setError(""); }}
                  className="w-full mt-2 py-2 text-xs font-medium text-[#747686] hover:text-[#1b1c1b] transition-colors text-center flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back
                </button>
              </>
            )}

            {/* Footer */}
            <p className="text-[10px] text-[#747686] text-center mt-5 leading-relaxed">
              Free during beta. No credit card required.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
