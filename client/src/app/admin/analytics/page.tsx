"use client";

import { useEffect, useState } from "react";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";
import { apiFetch } from "@/lib/api";import { AppIcon } from "@/components/ui/AppIcon";


type AnalyticsData = {
  total_analyses: number;
  total_users: number;
  total_products: number;
  total_wardrobe_items: number;
  recent_analyses: { date: string; count: number }[];
  top_skin_tones: { skin_tone: string; count: number }[];
  top_undertones: { undertone: string; count: number }[];
};

function AnalyticsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/v1/admin/stats")
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Platform usage insights from real data.</p>
        </div>

        {loading && <div className="text-sm text-gray-400 py-12 text-center">Loading analytics...</div>}

        {data && (
          <>
            {/* Overview metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Analyses", value: data.total_analyses, icon: "auto_awesome" },
                { label: "Users", value: data.total_users, icon: "group" },
                { label: "Products", value: data.total_products, icon: "inventory_2" },
                { label: "Wardrobe Saves", value: data.total_wardrobe_items, icon: "favorite" },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <AppIcon name={m.icon} size={18} className="text-[#002b92]" />
                  <p className="text-xl font-bold mt-2">{m.value}</p>
                  <p className="text-[11px] text-gray-500 font-medium">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Trend chart */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-6">Analysis Activity - Last 30 Days</h3>
              {data.recent_analyses.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No analyses in the last 30 days.</p>
              ) : (
                <div className="flex items-end gap-1 h-40">
                  {data.recent_analyses.map((d) => {
                    const max = Math.max(...data.recent_analyses.map((x) => x.count), 1);
                    const pct = (d.count / max) * 100;
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${d.date}: ${d.count} analyses`}>
                        <span className="text-[9px] text-gray-400 font-mono">{d.count}</span>
                        <div className="w-full rounded-t" style={{ height: `${Math.max(4, pct)}%`, background: "#002b92" }} />
                        <span className="text-[8px] text-gray-400 truncate w-full text-center">{d.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Most Common Skin Tones</h3>
                {data.top_skin_tones.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No data</p>
                ) : (
                  <div className="space-y-3">
                    {data.top_skin_tones.map((t, i) => {
                      const max = data.top_skin_tones[0].count;
                      return (
                        <div key={t.skin_tone} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{t.skin_tone}</span>
                              <span className="text-xs text-gray-500">{t.count}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full">
                              <div className="h-full bg-[#002b92] rounded-full" style={{ width: `${(t.count / max) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Most Common Undertones</h3>
                {data.top_undertones.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No data</p>
                ) : (
                  <div className="space-y-3">
                    {data.top_undertones.map((t, i) => {
                      const max = data.top_undertones[0].count;
                      return (
                        <div key={t.undertone} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium capitalize">{t.undertone}</span>
                              <span className="text-xs text-gray-500">{t.count}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full">
                              <div className="h-full bg-[#6d1600] rounded-full" style={{ width: `${(t.count / max) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminAnalyticsPage() {
  return (<RequireAdmin><AnalyticsContent /></RequireAdmin>);
}
