"use client";

import { useEffect, useState } from "react";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";
import { apiFetch } from "@/lib/api";
import { PRODUCTS } from "@/data/products";
import { OUTFITS } from "@/data/outfits";

type Stats = {
  totalAnalyses: number;
  totalProducts: number;
  totalOutfits: number;
};

function DashboardContent() {
  const [stats, setStats] = useState<Stats>({ totalAnalyses: 0, totalProducts: PRODUCTS.filter(p => p.name).length, totalOutfits: OUTFITS.length });

  useEffect(() => {
    // Fetch analysis count from the stats endpoint (uses the user's analyses for now)
    apiFetch("/api/v1/analysis/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.total_analyses) {
          setStats((s) => ({ ...s, totalAnalyses: data.total_analyses }));
        }
      })
      .catch(() => {});
  }, []);

  const cards = [
    { label: "Total Products", value: stats.totalProducts, icon: "inventory_2", color: "#002b92" },
    { label: "Total Outfits", value: stats.totalOutfits, icon: "checkroom", color: "#6d1600" },
    { label: "Analyses Run", value: stats.totalAnalyses, icon: "auto_awesome", color: "#137333" },
    { label: "Active Users", value: "—", icon: "group", color: "#4e5b92", note: "Requires admin API" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview and key metrics.</p>
        </div>

        {/* Stat cards */}
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
              {card.note && <p className="text-[10px] text-gray-400 mt-2 italic">{card.note}</p>}
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Manage Products", href: "/admin/products", icon: "edit" },
              { label: "Manage Outfits", href: "/admin/outfits", icon: "style" },
              { label: "View Users", href: "/admin/users", icon: "people" },
            ].map((action) => (
              <a key={action.href} href={action.href} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-[#002b92]/30 hover:bg-[#002b92]/5 transition-all">
                <span className="material-symbols-outlined text-[#002b92] text-lg">{action.icon}</span>
                <span className="text-sm font-medium text-[#1b1c1b]">{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminDashboardPage() {
  return (<RequireAdmin><DashboardContent /></RequireAdmin>);
}
