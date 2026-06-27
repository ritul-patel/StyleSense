"use client";

import Link from "next/link";
import RequireAdmin from "../../components/RequireAdmin";
import AdminLayout from "../../components/AdminLayout";

function MetadataContent() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>AI Metadata Queue</h1>
            <p className="text-sm text-gray-500 mt-1">Generate metadata for products using AI.</p>
          </div>
          <Link href="/admin/products" className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">← Products</Link>
        </div>

        {/* Disabled notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-amber-500 mb-4 block" style={{ fontSize: 48 }}>pause_circle</span>
          <h2 className="text-xl font-bold text-amber-900 mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>
            Temporarily Unavailable
          </h2>
          <p className="text-sm text-amber-800 max-w-md mx-auto leading-relaxed">
            AI Metadata Generation is temporarily unavailable while the AI provider is being finalized.
            This feature will be re-enabled once the provider integration is complete.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <div className="px-4 py-2 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider opacity-50 cursor-not-allowed">
              <span className="material-symbols-outlined text-sm mr-1 align-middle">auto_awesome</span>
              Generate — Disabled
            </div>
            <div className="px-4 py-2 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider opacity-50 cursor-not-allowed">
              <span className="material-symbols-outlined text-sm mr-1 align-middle">queue</span>
              Batch Queue — Disabled
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3">What this will do when re-enabled:</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-gray-400">check</span> Auto-detect product colors from images</li>
            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-gray-400">check</span> Generate seasons, occasions, and style tags</li>
            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-gray-400">check</span> Suggest matching undertones for recommendations</li>
            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-gray-400">check</span> Batch process multiple products at once</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function MetadataQueuePage() {
  return (<RequireAdmin><MetadataContent /></RequireAdmin>);
}
