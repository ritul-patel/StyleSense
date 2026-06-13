"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Tab = "General" | "Security" | "Notifications" | "Billing" | "Team";

const TABS: { label: Tab; icon: string }[] = [
  { label: "General", icon: "dashboard" },
  { label: "Security", icon: "security" },
  { label: "Notifications", icon: "notifications" },
  { label: "Billing", icon: "payments" },
  { label: "Team", icon: "group" },
];

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

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("General");

  // Toggle states
  const [usageHistory, setUsageHistory] = useState(true);
  const [publicStyling, setPublicStyling] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Form state (no backend, display only)
  const [name, setName] = useState("Elena Rodriguez");
  const [email, setEmail] = useState("elena.r@fashionai.com");

  return (
    <div
      className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl flex justify-between items-center px-8 py-4 border-b border-[#f0edec]">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tighter text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>
            Fashion AI
          </Link>
          <div className="hidden md:flex gap-6 items-center font-medium">
            {[
              { href: "/", label: "Dashboard" },
              { href: "/wardrobe", label: "Wardrobe" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-slate-500 hover:text-[#1b1c1b] transition-colors">
                {label}
              </Link>
            ))}
            <span className="text-[#002b92] font-bold border-b-2 border-[#002b92]">Settings</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-500 hover:bg-[#f0edec] rounded-full transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#843b23] to-[#c27c3e]" />
        </div>
      </nav>

      <main className="pt-28 pb-20 min-h-screen px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-16">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-28 space-y-1">
            <div className="mb-10 px-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#747686] font-bold">
                Preferences
              </span>
              <h2
                className="text-2xl font-extrabold tracking-tight mt-1"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Settings
              </h2>
            </div>

            <nav className="space-y-2">
              {TABS.map(({ label, icon }) => {
                const isActive = activeTab === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveTab(label)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                    style={
                      isActive
                        ? { color: "#002b92", background: "rgba(0,43,146,0.05)", fontWeight: 600 }
                        : { color: "#6b7280" }
                    }
                  >
                    <span className="material-symbols-outlined">{icon}</span>
                    <span className="text-xs uppercase tracking-wider">{label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-12 pt-8 border-t border-[#f0edec]">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-[#ba1a1a] text-xs uppercase tracking-wider font-bold hover:bg-red-50 rounded-xl transition-colors"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/");
                }}
              >
                <span className="material-symbols-outlined">logout</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main settings content */}
        <div className="flex-grow space-y-24">
          {/* Section: General Information */}
          <section>
            <div className="mb-8">
              <span className="inline-block px-3 py-1 rounded-full bg-[#002b92]/10 text-[#002b92] text-[10px] uppercase tracking-widest font-bold mb-2">
                Personal
              </span>
              <h3
                className="text-3xl font-extrabold tracking-tight"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                General Information
              </h3>
            </div>

            <div className="bg-[#f6f3f2]/40 p-10 rounded-2xl border border-[#f0edec]">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-[#843b23] to-[#c27c3e] ring-4 ring-white shadow-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 64 }}>
                      person
                    </span>
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-2.5 bg-[#002b92] text-white rounded-xl shadow-lg hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 flex-grow w-full">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#747686] font-bold block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent border-b border-[#c3c5d9]/50 focus:border-[#002b92] outline-none transition-colors py-3 px-0 text-[#1b1c1b] font-medium text-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#747686] font-bold block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-b border-[#c3c5d9]/50 focus:border-[#002b92] outline-none transition-colors py-3 px-0 text-[#1b1c1b] font-medium text-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#747686] font-bold block">
                      Current Role
                    </label>
                    <div className="py-3 text-[#1b1c1b] font-medium border-b border-transparent text-lg">
                      Style Enthusiast
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#747686] font-bold block">
                      Member Since
                    </label>
                    <div className="py-3 text-[#1b1c1b] font-medium border-b border-transparent text-lg">
                      2024
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  className="px-8 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all"
                  style={{ background: "linear-gradient(135deg, #003ec7, #002b92)", fontFamily: "Manrope, sans-serif" }}
                  onClick={() => console.log("Save profile:", { name, email })}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </section>

          <hr className="border-t border-[#ebe7e7]/60" />

          {/* Section: System Preferences */}
          <section>
            <div className="mb-10">
              <h3
                className="text-3xl font-extrabold tracking-tight"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                System Preferences
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Customize your AI experience and interface behavior.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
              {/* AI Learning card */}
              <div className="md:col-span-7 bg-[#f6f3f2]/30 p-8 rounded-2xl border border-[#f0edec] flex flex-col justify-between min-h-[280px]">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-2 bg-[#002b92]/10 rounded-lg">
                      <span className="material-symbols-outlined text-[#002b92]">auto_awesome</span>
                    </div>
                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-[#002b92]/10 text-[#002b92] uppercase tracking-wider">
                      AI Learning Profile
                    </span>
                  </div>
                  <h4
                    className="text-xl font-bold mb-3"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    Style Learning Engine
                  </h4>
                  <p className="text-sm text-[#434654] leading-relaxed">
                    The AI currently predicts your wardrobe with 94% accuracy. Custom training is updated weekly based on your selections.
                  </p>
                </div>
                <div className="mt-10">
                  <button
                    className="border-2 border-[#002b92]/20 text-[#002b92] hover:bg-[#002b92]/5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                    onClick={() => console.log("Reset profile data")}
                  >
                    Reset Profile Data
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="md:col-span-5 bg-[#f6f3f2]/60 p-8 rounded-2xl border border-[#ebe7e7]/40 space-y-8 shadow-sm">
                {[
                  { label: "Usage History", desc: "Log all interactions for suggestions", value: usageHistory, onChange: setUsageHistory },
                  { label: "Public Styling", desc: "Allow community to see boards", value: publicStyling, onChange: setPublicStyling },
                  { label: "Interface Theme", desc: "Adaptive system-wide dark mode", value: darkTheme, onChange: setDarkTheme },
                ].map(({ label, desc, value, onChange }) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <div>
                      <h5 className="text-sm font-bold">{label}</h5>
                      <p className="text-[11px] text-[#747686] font-medium">{desc}</p>
                    </div>
                    <Toggle on={value} onChange={onChange} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <hr className="border-t border-[#ebe7e7]/60" />

          {/* Section: Notifications */}
          <section>
            <div className="mb-10">
              <h3
                className="text-3xl font-extrabold tracking-tight"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Notification Preferences
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Control how and when we reach out to you.
              </p>
            </div>
            <div className="bg-[#f6f3f2]/40 p-8 rounded-2xl border border-[#f0edec] space-y-8">
              {[
                { label: "Email Notifications", desc: "Analysis results and style updates via email", value: emailNotifs, onChange: setEmailNotifs },
                { label: "Push Notifications", desc: "In-app alerts for new recommendations", value: pushNotifs, onChange: setPushNotifs },
                { label: "Weekly Style Digest", desc: "Curated weekly lookbook sent every Monday", value: weeklyDigest, onChange: setWeeklyDigest },
              ].map(({ label, desc, value, onChange }) => (
                <div key={label} className="flex items-center justify-between gap-4 pb-6 border-b border-[#f0edec] last:border-0 last:pb-0">
                  <div>
                    <h5 className="text-sm font-bold">{label}</h5>
                    <p className="text-[11px] text-[#747686] font-medium">{desc}</p>
                  </div>
                  <Toggle on={value} onChange={onChange} />
                </div>
              ))}
            </div>
          </section>

          <hr className="border-t border-[#ebe7e7]/60" />

          {/* Security section */}
          <section
            className="rounded-2xl px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-8"
            style={{ background: "#3f414e" }}
          >
            <div className="flex items-center gap-8">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-2xl">lock_reset</span>
              </div>
              <div>
                <h4
                  className="text-xl font-bold tracking-tight text-white"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Account Security
                </h4>
                <p className="text-white/60 text-xs mt-1">
                  Last password change was 3 months ago. Enhance protection.
                </p>
              </div>
            </div>
            <button
              className="bg-[#003ec7] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#0052ff] transition-colors flex-shrink-0 shadow-lg"
              style={{ boxShadow: "0 4px 16px rgba(0,62,199,0.3)", fontFamily: "Manrope, sans-serif" }}
              onClick={() => console.log("Update password")}
            >
              Update Password
            </button>
          </section>
        </div>
      </main>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-[#f0edec] flex justify-around py-4 px-4 z-50">
        {[
          { href: "/", icon: "dashboard", label: "Dash" },
          { href: "/wardrobe", icon: "checkroom", label: "Wardrobe" },
          { href: "/settings", icon: "tune", label: "Settings", active: true },
        ].map(({ href, icon, label, active }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 ${active ? "text-[#002b92]" : "text-slate-400"}`}
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
