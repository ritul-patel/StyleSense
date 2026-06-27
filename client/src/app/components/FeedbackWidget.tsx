"use client";

import { useState, useCallback } from "react";
import posthog from "posthog-js";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug Report", icon: "bug_report" },
  { value: "feature", label: "Feature Request", icon: "lightbulb" },
  { value: "general", label: "General Feedback", icon: "chat" },
] as const;

const APP_VERSION = "1.0.0-beta";

function getDeviceInfo() {
  if (typeof window === "undefined") return { browser: "", device: "" };
  const ua = navigator.userAgent;
  let browser = "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";

  const isMobile = /Mobi|Android/i.test(ua);
  const device = isMobile ? "Mobile" : "Desktop";
  return { browser, device };
}

export default function FeedbackWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"bug" | "feature" | "general">("general");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = useCallback(() => {
    setType("general");
    setRating(0);
    setMessage("");
    setSubmitted(false);
  }, []);

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    setSubmitting(true);

    const { browser, device } = getDeviceInfo();
    // Get Sentry event ID if available (last captured error)
    let sentryEventId = "";
    try {
      const Sentry = await import("@sentry/nextjs");
      sentryEventId = Sentry.lastEventId() || "";
    } catch { /* Sentry not available */ }

    try {
      const res = await apiFetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          rating: rating || null,
          message: message.trim(),
          page: window.location.pathname,
          browser,
          device,
          app_version: APP_VERSION,
          sentry_event_id: sentryEventId,
        }),
      });

      if (res.ok) {
        posthog.capture("feedback_submitted", {
          type,
          rating: rating || undefined,
          page: window.location.pathname,
          logged_in: !!user,
        });
        setSubmitted(true);
      }
    } catch (err) {
      console.error("[feedback] Submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(true); reset(); }}
        aria-label="Send feedback"
        className="fixed bottom-6 right-6 z-[90] w-12 h-12 rounded-full bg-[#002b92] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center md:w-auto md:h-auto md:px-4 md:py-2.5 md:rounded-xl md:gap-2"
      >
        <span className="material-symbols-outlined text-xl">feedback</span>
        <span className="hidden md:inline text-sm font-semibold">Feedback</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-[#1b1c1b] w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-[#747686] hover:text-[#1b1c1b] dark:hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>

            {submitted ? (
              /* Success state */
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>Thank you!</h3>
                <p className="text-sm text-[#747686] mb-6">Your feedback helps us improve StyleSense.</p>
                <button
                  onClick={() => setOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#002b92] text-white text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Form */
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>Send Feedback</h3>
                  <p className="text-sm text-[#747686] mt-1">Help us improve your experience</p>
                </div>

                {/* Type selector */}
                <div className="flex gap-2">
                  {FEEDBACK_TYPES.map((ft) => (
                    <button
                      key={ft.value}
                      onClick={() => setType(ft.value)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-center ${
                        type === ft.value
                          ? "border-[#002b92] bg-[#002b92]/5 text-[#002b92]"
                          : "border-[#e4e2e1] dark:border-[#333] text-[#747686] hover:border-[#002b92]/30"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{ft.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{ft.label}</span>
                    </button>
                  ))}
                </div>

                {/* Rating */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#747686] font-bold block mb-2">Rating (optional)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star === rating ? 0 : star)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f6f3f2] dark:hover:bg-[#2a2a2a] transition-colors"
                      >
                        <span
                          className="material-symbols-outlined text-2xl transition-colors"
                          style={{
                            fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0",
                            color: star <= rating ? "#f59e0b" : "#c4c5d7",
                          }}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#747686] font-bold block mb-2">
                    {type === "bug" ? "What went wrong?" : type === "feature" ? "What would you like?" : "Your feedback"}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      type === "bug" ? "Describe the issue you encountered..."
                        : type === "feature" ? "Describe the feature you'd like to see..."
                        : "Tell us what you think..."
                    }
                    rows={4}
                    maxLength={5000}
                    className="w-full px-4 py-3 rounded-xl border border-[#e4e2e1] dark:border-[#333] bg-transparent text-sm resize-none focus:outline-none focus:border-[#002b92] transition-colors"
                  />
                  <p className="text-[10px] text-[#747686] mt-1 text-right">{message.length}/5000</p>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || submitting}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}
                >
                  {submitting ? "Sending..." : "Submit Feedback"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
