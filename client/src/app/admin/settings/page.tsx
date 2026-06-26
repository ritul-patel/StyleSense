"use client";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";

function SettingsContent() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Admin Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Platform configuration.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <span className="material-symbols-outlined text-gray-300 mb-4" style={{ fontSize: 48 }}>settings</span>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Platform Settings</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Configuration options (CORS, rate limits, feature flags, AI model settings) will be added in Phase 2.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminSettingsPage() {
  return (<RequireAdmin><SettingsContent /></RequireAdmin>);
}
