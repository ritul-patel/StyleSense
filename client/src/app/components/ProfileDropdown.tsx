"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";

type ProfileCache = { userId: string; name: string; email: string; avatarUrl: string };
let _cache: ProfileCache | null = null;

function getInitials(name: string, email: string): string {
  if (name.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

export default function ProfileDropdown() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const email = user?.email || "";

  // Load profile (cached across navigations)
  useEffect(() => {
    if (!user) { _cache = null; return; }
    if (_cache && _cache.userId === user.id) {
      setName(_cache.name);
      setAvatarUrl(_cache.avatarUrl);
      return;
    }
    apiFetch("/api/v1/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        const n = data.full_name || "";
        const a = data.avatar_url || "";
        setName(n);
        setAvatarUrl(a);
        _cache = { userId: user.id, name: n, email: user.email || "", avatarUrl: a };
      })
      .catch(() => {});
  }, [user?.id]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) return null;

  const initials = getInitials(name, email);

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar trigger */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Profile menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#002b92]/30 transition-transform hover:scale-105"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name || "Avatar"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#843b23] to-[#c27c3e] flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border border-black/5 overflow-hidden z-[100]"
          role="menu"
          aria-label="User menu"
        >
          {/* User info */}
          <div className="px-5 py-4 flex items-center gap-3 border-b border-[#f0edec]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#843b23] to-[#c27c3e] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1b1c1b] truncate">{name || "User"}</p>
              <p className="text-[11px] text-[#747686] truncate">{email}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <button
              onClick={() => { setIsOpen(false); router.push("/settings"); }}
              role="menuitem"
              className="w-full flex items-center gap-3 px-5 py-3 text-sm text-[#1b1c1b] hover:bg-[#f6f3f2] transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px] text-[#747686]">settings</span>
              Settings
            </button>
          </div>

          {/* Sign out */}
          <div className="border-t border-[#f0edec] py-2">
            <button
              onClick={handleLogout}
              role="menuitem"
              className="w-full flex items-center gap-3 px-5 py-3 text-sm text-[#ba1a1a] hover:bg-red-50 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
