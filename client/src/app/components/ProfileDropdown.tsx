"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { fetchProfile, getCachedProfile } from "@/lib/profile-cache";
import { AnimatePresence, motion } from "framer-motion";
import { dropdownVariants } from "@/lib/motion";import { AppIcon } from "@/components/ui/AppIcon";


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
    if (!user) return;
    const cached = getCachedProfile(user.id);
    if (cached) {
      setName(cached.full_name || "");
      setAvatarUrl(cached.avatar_url || "");
      return;
    }
    fetchProfile(user.id).then((data) => {
      if (!data) return;
      setName(data.full_name || "");
      setAvatarUrl(data.avatar_url || "");
    });
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border border-black/5 overflow-hidden z-[100]"
            role="menu"
            aria-label="User menu"
          >
          {/* User info */}
          <div className="px-5 py-4 flex items-center gap-3 border-b border-[#f0edec]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="User avatar" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
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
              <AppIcon name="settings" size={18} className="text-[#747686]" />
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
              <AppIcon name="logout" size={18} />
              Sign Out
            </button>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
