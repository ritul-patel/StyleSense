"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import SettingsCard from "./SettingsCard";

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { id: number; message: string; type: "success" | "error" };

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-slide-up bg-[#1b1c1b] dark:bg-[#fcf9f8] text-[#fcf9f8] dark:text-[#1b1c1b]"
        >
          <span className="material-symbols-outlined text-sm">
            {t.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest">
            {t.message}
          </span>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

export default function DangerZone() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDelete = async () => {
    if (deleteInput !== "DELETE") return;
    setIsDeleting(true);
    try {
      await apiFetch("/api/v1/profile/delete", { method: "POST" });
      await supabase.auth.signOut();
      showToast("Account deleted successfully.", "success");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      console.warn("[dangerZone] delete account failed:", err);
      showToast("Failed to delete account. Please try again.", "error");
      setIsDeleting(false);
    }
  };

  return (
    <SettingsCard
      title="Account Actions"
      description="Manage your session or permanently delete your account."
    >
      <ToastContainer toasts={toasts} />

      <div className="space-y-4">
        {/* Sign Out */}
        <div className="flex items-center justify-between py-4 border-b border-[#f0edec] dark:border-[#303030]">
          <div>
            <h5 className="text-sm font-bold text-[#1b1c1b] dark:text-[#fcf9f8]">Sign out</h5>
            <p className="text-[11px] text-[#747686] font-medium">Log out of your current session.</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-6 py-2 rounded-xl text-[#002b92] dark:text-[#b7c4ff] border border-[#002b92]/20 dark:border-[#b7c4ff]/20 font-bold text-sm hover:bg-[#002b92]/5 dark:hover:bg-[#b7c4ff]/10 transition-colors"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Sign out
          </button>
        </div>

        {/* Delete Account */}
        <div className="flex items-center justify-between py-4">
          <div>
            <h5 className="text-sm font-bold text-[#ba1a1a]">Delete account</h5>
            <p className="text-[11px] text-[#747686] font-medium">Permanently delete your data.</p>
          </div>
          <button
            onClick={() => {
              setShowConfirm(true);
              setDeleteInput("");
            }}
            className="px-6 py-2 rounded-xl bg-red-50 text-[#ba1a1a] font-bold text-sm hover:bg-red-100 transition-colors"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Delete
          </button>
        </div>

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1b1c1b] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-[#f0edec] dark:border-[#303030]">
              <h3 className="text-2xl font-bold text-[#1b1c1b] dark:text-[#fcf9f8] mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                Delete Account?
              </h3>
              <p className="text-[#434654] dark:text-[#a0a0b8] mb-6">
                Are you sure? This action cannot be undone.
              </p>

              <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#747686] mb-2">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 rounded-xl border border-[#c3c5d9]/30 bg-transparent text-[#1b1c1b] dark:text-[#fcf9f8] focus:outline-none focus:border-[#ba1a1a] transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isDeleting}
                  className="px-6 py-3 rounded-xl font-bold text-[#434654] hover:bg-[#f6f3f2] dark:text-[#a0a0b8] dark:hover:bg-[#303030] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || deleteInput !== "DELETE"}
                  className="px-6 py-3 rounded-xl font-bold bg-[#ba1a1a] text-white hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsCard>
  );
}
