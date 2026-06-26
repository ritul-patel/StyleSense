"use client";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";

function UsersContent() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage platform users.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <span className="material-symbols-outlined text-gray-300 mb-4" style={{ fontSize: 48 }}>group</span>
          <h3 className="text-lg font-bold text-gray-700 mb-2">User Management</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            User listing requires a dedicated admin API endpoint. This will be implemented in Phase 2.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminUsersPage() {
  return (<RequireAdmin><UsersContent /></RequireAdmin>);
}
