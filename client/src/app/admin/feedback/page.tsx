"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import RequireAdmin from "../components/RequireAdmin";
import AdminLayout from "../components/AdminLayout";

type FeedbackItem = {
  id: string;
  user_id: string | null;
  type: string;
  rating: number | null;
  message: string;
  page: string;
  browser: string;
  device: string;
  app_version: string;
  screenshot_url: string;
  sentry_event_id: string;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "reviewing", "planned", "fixed", "closed"];
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  planned: "bg-purple-100 text-purple-800",
  fixed: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

const TYPE_ICONS: Record<string, string> = {
  bug: "bug_report",
  feature: "lightbulb",
  general: "chat",
};

export default function AdminFeedbackPage() {
  return (<RequireAdmin><FeedbackContent /></RequireAdmin>);
}

function FeedbackContent() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("type", filterType);
      if (search) params.set("search", search);

      const res = await apiFetch(`/api/v1/feedback/admin?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.feedback || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("[admin/feedback] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType, search]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await apiFetch(`/api/v1/feedback/admin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((item) => item.id === id ? { ...item, status } : item));
        setToast("Status updated");
        setTimeout(() => setToast(""), 2000);
      }
    } catch (err) {
      console.error("[admin/feedback] Update error:", err);
    }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return d; }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1b1c1b] text-white text-sm font-bold shadow-lg">
            {toast}
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total submissions</p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>

          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
          >
            <option value="">All Types</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="general">General</option>
          </select>

          <input
            type="text"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm flex-1 min-w-[200px]"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="material-symbols-outlined text-4xl mb-2 block">inbox</span>
            <p>No feedback yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-base text-gray-400">{TYPE_ICONS[item.type] || "chat"}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{item.type}</span>
                      {item.rating && (
                        <span className="text-xs text-amber-600 font-semibold">
                          {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status] || STATUS_COLORS.new}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 line-clamp-2 mb-2">{item.message}</p>
                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-400 uppercase tracking-wider">
                      <span>{formatDate(item.created_at)}</span>
                      {item.page && <span>Page: {item.page}</span>}
                      {item.browser && <span>{item.browser}</span>}
                      {item.device && <span>{item.device}</span>}
                      {item.user_id && <span>User: {item.user_id.slice(0, 8)}...</span>}
                      {item.sentry_event_id && (
                        <a
                          href={`https://stylesense-42.sentry.io/issues/?query=${item.sentry_event_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Sentry: {item.sentry_event_id.slice(0, 8)}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Status dropdown */}
                  <select
                    value={item.status}
                    onChange={(e) => updateStatus(item.id, e.target.value)}
                    className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-500">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
