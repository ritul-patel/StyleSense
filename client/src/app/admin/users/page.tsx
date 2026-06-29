"use client";

import { useEffect, useState, useCallback } from "react";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";
import { apiFetch } from "@/lib/api";import { AppIcon } from "@/components/ui/AppIcon";


type User = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
  provider: string;
  full_name: string;
  avatar_url: string;
};

function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/v1/admin/users?page=${page}&perPage=20`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch { setError("Failed to load users."); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updateRole = async (userId: string, role: string) => {
    const res = await apiFetch(`/api/v1/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setToast(`Role updated to ${role}`);
      setTimeout(() => setToast(""), 3000);
      fetchUsers();
    }
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full bg-[#1b1c1b] text-white text-sm font-bold shadow-xl">{toast}</div>}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Users</h1>
            <p className="text-sm text-gray-500 mt-1">{total} registered users</p>
          </div>
        </div>

        {loading && <div className="text-sm text-gray-400 py-12 text-center">Loading users...</div>}
        {error && <div className="text-sm text-red-500 py-12 text-center">{error}</div>}

        {!loading && !error && users.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <AppIcon name="group" size={48} className="text-gray-300 mb-4" />
            <p className="text-sm text-gray-500">No users found.</p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">User</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Provider</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Joined</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={`${u.email} avatar`} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#002b92] to-[#003ec7] flex items-center justify-center text-white text-xs font-bold">
                            {(u.full_name || u.email)?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <span className="font-medium text-[#1b1c1b]">{u.full_name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">{u.provider}</span></td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === "admin" ? "bg-[#002b92]/10 text-[#002b92]" : "bg-gray-100 text-gray-500"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      {u.role === "admin" ? (
                        <button onClick={() => updateRole(u.id, "user")} className="text-xs font-bold text-red-500 hover:underline">Revoke Admin</button>
                      ) : (
                        <button onClick={() => updateRole(u.id, "admin")} className="text-xs font-bold text-[#002b92] hover:underline">Make Admin</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 20 && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40">Previous</button>
            <span className="text-sm text-gray-500">Page {page}</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 20 >= total} className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminUsersPage() {
  return (<RequireAdmin><UsersContent /></RequireAdmin>);
}
