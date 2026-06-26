"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/app/components/Navbar";
import RequireAuth from "../components/RequireAuth";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="w-10 h-5 rounded-full relative transition-colors duration-200 flex-shrink-0"
      style={{ background: on ? "#003ec7" : "#e5e2e1" }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200"
        style={{ left: on ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  );
}

function getInitials(name: string, email: string): string {
  if (name.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

type ProfileData = {
  full_name: string;
  avatar_url: string;
  email_notifs: boolean;
  marketing_notifs: boolean;
  analysis_reminders: boolean;
};

function SettingsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [analysisReminders, setAnalysisReminders] = useState(true);
  const [marketingNotifs, setMarketingNotifs] = useState(false);

  const email = user?.email || "";

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/v1/profile")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setName(data.full_name || "");
        setAvatarUrl(data.avatar_url || "");
        setEmailNotifs(data.email_notifs ?? true);
        setAnalysisReminders(data.analysis_reminders ?? true);
        setMarketingNotifs(data.marketing_notifs ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name }),
      });
      if (res.ok) showToast("Profile saved");
      else showToast("Failed to save");
    } catch { showToast("Network error"); }
    finally { setSaving(false); }
  };

  const saveNotifs = async (field: string, value: boolean) => {
    try {
      await apiFetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch { /* silent */ }
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });
    if (error) showToast("Failed to send reset email");
    else showToast("Password reset email sent");
  };

  const handleClearHistory = async () => {
    if (!confirm("Delete all your analysis history? This cannot be undone.")) return;
    const res = await apiFetch("/api/v1/profile/history", { method: "DELETE" });
    if (res.ok) showToast("History cleared");
    else showToast("Failed to clear history");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This will remove all your data.")) return;
    if (!confirm("This action is PERMANENT. Proceed?")) return;
    const res = await apiFetch("/api/v1/profile/delete", { method: "POST" });
    if (res.ok) {
      await supabase.auth.signOut();
      router.push("/");
    } else {
      showToast("Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f8]">
        <Navbar activePath="none" />
        <div className="pt-32 flex items-center justify-center">
          <span className="text-sm text-[#747686]">Loading settings...</span>
        </div>
      </div>
    );
  }

  const initials = getInitials(name, email);

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full bg-[#1b1c1b] text-white text-sm font-bold shadow-xl">
          {toast}
        </div>
      )}

      {/* Shared Navbar */}
      <Navbar activePath="none" />

      <main className="pt-32 pb-20 px-6 md:px-12 max-w-[1400px] mx-auto min-h-screen">
        {/* Page Header */}
        <header className="mb-12">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#dde1ff] text-[#001452] text-[10px] uppercase tracking-widest mb-4 font-bold">
            Account
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>
            Settings
          </h1>
        </header>

        {/* Profile Card */}
        <section className="bg-white rounded-[2rem] p-8 md:p-10 mb-8" style={{ boxShadow: "0 20px 40px -10px rgba(28,27,27,0.06)" }}>
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover ring-2 ring-black/5" />
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-[#843b23] to-[#c27c3e] ring-2 ring-black/5 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>{initials}</span>
                </div>
              )}
            </div>

            {/* Fields */}
            <div className="flex-grow w-full grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#747686] font-bold block mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-[#f6f3f2] rounded-xl px-4 py-3 text-[#1b1c1b] font-medium focus:outline-none focus:ring-2 focus:ring-[#002b92]/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#747686] font-bold block mb-2">Email Address</label>
                <div className="w-full bg-[#f6f3f2] rounded-xl px-4 py-3 text-[#1b1c1b]/60 font-medium">{email}</div>
              </div>
            </div>

            {/* Save button */}
            <div className="flex-shrink-0 self-end md:self-center">
              <button onClick={saveProfile} disabled={saving}
                className="px-7 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, #003ec7, #002b92)", fontFamily: "Manrope, sans-serif" }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </section>

        {/* Preferences Card */}
        <section className="bg-white rounded-[2rem] p-8 md:p-10 mb-8" style={{ boxShadow: "0 20px 40px -10px rgba(28,27,27,0.06)" }}>
          <h3 className="text-xl font-bold tracking-tight mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>Notifications & AI</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Toggles */}
            <div className="space-y-6">
              {[
                { label: "Analysis Reminders", desc: "Get reminded to run new analyses", value: analysisReminders, field: "analysis_reminders", onChange: setAnalysisReminders },
                { label: "Email Notifications", desc: "Style updates sent via email", value: emailNotifs, field: "email_notifs", onChange: setEmailNotifs },
                { label: "Marketing Emails", desc: "Promotions and style newsletters", value: marketingNotifs, field: "marketing_notifs", onChange: setMarketingNotifs },
              ].map(({ label, desc, value, field, onChange }) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3 border-b border-[#f0edec] last:border-0">
                  <div>
                    <h5 className="text-sm font-semibold text-[#1b1c1b]">{label}</h5>
                    <p className="text-[11px] text-[#747686]">{desc}</p>
                  </div>
                  <Toggle on={value} onChange={(v) => { onChange(v); saveNotifs(field, v); }} />
                </div>
              ))}
            </div>

            {/* AI Data */}
            <div className="bg-[#f6f3f2] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#002b92]/10 rounded-lg">
                    <span className="material-symbols-outlined text-[#002b92] text-lg">auto_awesome</span>
                  </div>
                  <h4 className="text-sm font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>Analysis History</h4>
                </div>
                <p className="text-xs text-[#434654] leading-relaxed">
                  Clear all past analysis results to start fresh. This action cannot be undone.
                </p>
              </div>
              <button onClick={handleClearHistory}
                className="mt-6 border-2 border-[#002b92]/20 text-[#002b92] hover:bg-[#002b92]/5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 self-start">
                Clear History
              </button>
            </div>
          </div>
        </section>

        {/* Password Card */}
        <section className="bg-[#3f414e] rounded-[2rem] p-8 md:p-10 mb-8 flex flex-col md:flex-row items-center justify-between gap-6" style={{ boxShadow: "0 20px 40px -10px rgba(28,27,27,0.1)" }}>
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-2xl">lock_reset</span>
            </div>
            <div>
              <h4 className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Password</h4>
              <p className="text-white/50 text-xs mt-0.5">Receive a password reset link via email.</p>
            </div>
          </div>
          <button onClick={handlePasswordReset}
            className="bg-[#003ec7] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#0052ff] transition-colors flex-shrink-0"
            style={{ boxShadow: "0 4px 16px rgba(0,62,199,0.3)", fontFamily: "Manrope, sans-serif" }}>
            Reset Password
          </button>
        </section>

        {/* Danger Zone Card */}
        <section className="bg-white border border-red-100 rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6" style={{ boxShadow: "0 20px 40px -10px rgba(28,27,27,0.04)" }}>
          <div>
            <h4 className="font-bold text-sm text-[#ba1a1a]">Delete Account</h4>
            <p className="text-xs text-slate-500 mt-1">Permanently removes your profile, wardrobe, closet, and analysis history.</p>
          </div>
          <button onClick={handleDeleteAccount}
            className="px-6 py-3 rounded-xl border-2 border-[#ba1a1a] text-[#ba1a1a] font-bold text-sm hover:bg-[#ba1a1a] hover:text-white transition-all flex-shrink-0">
            Delete Account
          </button>
        </section>

        {/* Logout (mobile-friendly, visible at bottom) */}
        <div className="mt-12 flex justify-center md:hidden">
          <button
            className="flex items-center gap-2 px-6 py-3 text-[#ba1a1a] text-sm font-bold hover:bg-red-50 rounded-xl transition-colors"
            onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}>
            <span className="material-symbols-outlined text-lg">logout</span>
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (<RequireAuth><SettingsPageContent /></RequireAuth>);
}
