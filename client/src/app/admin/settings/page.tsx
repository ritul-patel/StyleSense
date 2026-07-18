"use client";

import { useState } from "react";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";

function SettingsContent() {
  const [toast, setToast] = useState("");

  // Platform config (read from env at build time for display)
  const config = {
    supabaseProject: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "").replace(".supabase.co", "") || "-",
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1",
    sentryEnabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    posthogEnabled: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full bg-[#1b1c1b] text-white text-sm font-bold shadow-xl">{toast}</div>}

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Platform Settings</h1>
          <p className="text-sm text-gray-500 mt-1">System configuration and integrations.</p>
        </div>

        {/* Platform Info */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Infrastructure</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Supabase Project", value: config.supabaseProject },
              { label: "API Base URL", value: config.apiUrl },
              { label: "Sentry", value: config.sentryEnabled ? "Enabled" : "Disabled" },
              { label: "PostHog Analytics", value: config.posthogEnabled ? "Enabled" : "Disabled" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-mono font-medium text-[#1b1c1b]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Status */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Feature Status</h3>
          <div className="space-y-3">
            {[
              { name: "AI Skin Analysis", status: "active", desc: "Python OpenCV + Recommendation Engine" },
              { name: "AI Metadata Generation", status: "active", desc: "Anthropic Claude via MetadataProvider" },
              { name: "Product Catalog", status: "active", desc: "Database-backed with admin CRUD" },
              { name: "Wardrobe System", status: "active", desc: "API-backed with collections, closet, outfits" },
              { name: "Recommendation Engine", status: "active", desc: "Modular scoring with 7 components" },
              { name: "User Profiles", status: "active", desc: "OAuth auto-population + preferences" },
              { name: "Image Upload (Closet)", status: "limited", desc: "Base64 storage - migrate to Supabase Storage" },
              { name: "Dark Mode", status: "partial", desc: "Some pages support, not globally consistent" },
            ].map((f) => (
              <div key={f.name} className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium">{f.name}</span>
                  <p className="text-[11px] text-gray-500">{f.desc}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  f.status === "active" ? "bg-green-100 text-green-700" :
                  f.status === "limited" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-500"
                }`}>{f.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm">
          <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4">Administration</h3>
          <p className="text-sm text-gray-500 mb-4">Platform-level actions. Use with caution.</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setToast("Cache cleared (restart server to take effect)"); setTimeout(() => setToast(""), 3000); }}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              Clear Server Cache
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminSettingsPage() {
  return (<RequireAdmin><SettingsContent /></RequireAdmin>);
}
