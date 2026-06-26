"use client";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";
import { OUTFITS } from "@/data/outfits";

function OutfitsContent() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Outfits</h1>
            <p className="text-sm text-gray-500 mt-1">{OUTFITS.length} outfits in catalog</p>
          </div>
          <button className="px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #003ec7, #002b92)" }}>
            + Add Outfit
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {OUTFITS.map((o) => (
            <div key={o.outfit_id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
              <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                <img src={o.imageUrl} alt={o.outfit_id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              </div>
              <div className="p-3">
                <p className="text-xs font-bold text-gray-700">{o.outfit_id}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminOutfitsPage() {
  return (<RequireAdmin><OutfitsContent /></RequireAdmin>);
}
