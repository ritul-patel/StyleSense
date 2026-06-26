"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { getProfile } from "@/lib/api";
import { LogOut, User } from "lucide-react";

// Module-level cache so we don't re-fetch profile on every page navigation
let _profileCache: { userId: string; data: ReturnType<typeof getProfile> extends Promise<infer T> ? T : never } | null = null;

export default function ProfileDropdown() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) {
      _profileCache = null;
      return;
    }
    // Use cached profile if available for same user
    if (_profileCache && _profileCache.userId === user.id) {
      setProfile(_profileCache.data);
      return;
    }
    getProfile()
      .then((p) => {
        if (p) {
          _profileCache = { userId: user.id, data: p };
          setProfile(p);
        }
      })
      .catch((err) => {
        console.warn("Failed to load profile in dropdown:", err);
      });
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const menuItems = [
    { label: "Analysis", href: "/analysis" },
    { label: "History", href: "/history" },
    { label: "Wardrobe", href: "/wardrobe" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-[#843b23] to-[#c27c3e] ring-2 ring-white/50 shadow-sm flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none overflow-hidden"
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
        ) : profile?.full_name?.trim() ? (
          <span className="text-white font-bold text-sm tracking-tighter">
            {profile.full_name.trim().charAt(0).toUpperCase()}
          </span>
        ) : (
          <span className="text-white text-[20px]" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-56 sm:w-64 bg-white dark:bg-[#1b1c1b] rounded-2xl shadow-[0_20px_40px_-10px_rgba(28,27,27,0.12)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] border border-[#f0edec] dark:border-[#303030] overflow-hidden z-50"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {/* Header */}
            <div className="p-5 border-b border-[#f0edec] dark:border-[#303030] bg-[#fcf9f8] dark:bg-[#1b1c1b]">
              <h4 className="text-lg font-extrabold text-[#1b1c1b] dark:text-[#fcf9f8]" style={{ fontFamily: "Manrope, sans-serif" }}>
                StyleSense
              </h4>
              <p className="text-xs text-[#747686] font-medium truncate mt-0.5">
                {user?.email || "user@email.com"}
              </p>
            </div>

            {/* Links */}
            <div className="p-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-colors text-sm font-medium"
                    style={
                      isActive
                        ? { background: "rgba(0,43,146,0.08)", color: "#002b92" }
                        : { color: "inherit" }
                    }
                  >
                    <span className={isActive ? "font-bold text-[#002b92] dark:text-[#b7c4ff]" : "text-[#434654] dark:text-[#dcd9d8] hover:text-[#1b1c1b] dark:hover:text-[#ffffff]"}>
                      {item.label}
                    </span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#002b92] dark:bg-[#b7c4ff]" />}
                  </Link>
                );
              })}
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-[#f0edec] dark:border-[#303030]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[#ba1a1a] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-sm font-bold"
              >
                <LogOut className="text-[20px]" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
