"use client";

import { useEffect, useState } from "react";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";
import { apiFetch } from "@/lib/api";

type Stats = {
  total_analyses: number;
  total_products: number;
  published_products: number;
  total_users: number;
  total_wardrobe_items: number;
  recent_analyses: { date: string; count: number }[];
  top_skin_tones: { skin_tone: string; count: number }[];
  top_undertones: { undertone: string; count: number }[];
};

function DashboardContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/v1/admin/stats")
      .then((r) => r.ok ? r.json() : Promise.reject("Failed"))
      .then(setStats)
      .catch(() => setError("Failed to load dashboard stats."))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: "Total Users", value: stats.total_users, icon: "group", color: "#4e5b92" },
    { label: "Analyses Run", value: stats.total_analyses, icon: "auto_awesome", color: "#137333" },
    { label: "Products", value: `${stats.published_products}/${stats.total_products}`, icon: "inventory_2", color: "#002b92", sub: "published/total" },
    { label: "Wardrobe Saves", value: stats.total_wardrobe_items, icon: "favorite", color: "#6d1600" },
  ] : [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time platform metrics.</p>
        </div>

        {loading && <div className="text-sm text-gray-400 py-12 text-center">Loading stats...</div>}
        {error && <div className="text-sm text-red-500 py-12 text-center">{error}</div>}

        {stats && (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cards.map((card) => (
                <div key={card.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}10` }}>
                      <span className="material-symbols-outlined" style={{ color: card.color, fontSize: 22 }}>{card.icon}</span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#1b1c1b]">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{card.label}</p>
                  {card.sub && <p className="text-[10px] text-gray-400 mt-1">{card.sub}</p>}
                </div>
              ))}
            </div>

            {/* Analysis Trend + Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent activity (simple bar chart) */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Analyses — Last 30 Days</h3>
                {stats.recent_analyses.length === 0 ? (
                  <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
                ) : (
                  <div className="flex items-end gap-1 h-32">
                    {stats.recent_analyses.slice(-14).map((d) => {
                      const max = Math.max(...stats.recent_analyses.map((x) => x.count), 1);
                      const h = Math.max(4, (d.count / max) * 100);
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t-sm" style={{ height: `${h}%`, background: "#002b92", minHeight: 4 }} title={`${d.date}: ${d.count}`} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top skin tones */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Top Skin Tones</h3>
                {stats.top_skin_tones.length === 0 ? (
                  <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.top_skin_tones.map((t) => (
                      <div key={t.skin_tone} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t.skin_tone}</span>
                        <span className="text-xs text-gray-500 font-bold">{t.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Manage Products", href: "/admin/products", icon: "edit" },
                  { label: "Manage Outfits", href: "/admin/outfits", icon: "style" },
                  { label: "View Users", href: "/admin/users", icon: "people" },
                ].map((a) => (
                  <a key={a.href} href={a.href} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-[#002b92]/30 hover:bg-[#002b92]/5 transition-all">
                    <span className="material-symbols-outlined text-[#002b92] text-lg">{a.icon}</span>
                    <span className="text-sm font-medium">{a.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminDashboardPage() {
  return (<RequireAdmin><DashboardContent /></RequireAdmin>);
}
