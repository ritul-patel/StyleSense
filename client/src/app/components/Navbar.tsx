"use client";

import Link from "next/link";
import { Search, Sparkles, Shirt, History } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";

const MOBILE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; fill?: string; strokeWidth?: number }>> = {
  search: Search,
  auto_awesome: Sparkles,
  checkroom: Shirt,
  history: History,
};

type ActivePath = "discover" | "analysis" | "wardrobe" | "history" | "outfit" | "none";

type Props = {
  activePath: ActivePath;
};

export default function Navbar({ activePath }: Props) {
  const navLinks = [
    { href: "/discover", label: "Discover", id: "discover" },
    { href: "/analysis", label: "Analysis", id: "analysis" },
    { href: "/wardrobe", label: "Wardrobe", id: "wardrobe" },
    { href: "/history", label: "History", id: "history" },
  ];

  const mobileLinks = [
    { href: "/discover", label: "Discover", icon: "search", id: "discover" },
    { href: "/analysis", label: "Analysis", icon: "auto_awesome", id: "analysis" },
    { href: "/wardrobe", label: "Wardrobe", icon: "checkroom", id: "wardrobe" },
    { href: "/history", label: "History", icon: "history", id: "history" },
  ];

  return (
    <>
      {/* Desktop Header Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-black/[0.04]" aria-label="Main navigation">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 md:px-12 h-16 md:h-20 max-w-[1440px] mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="StyleSense" className="w-7 h-7 md:w-8 md:h-8 object-contain" fetchPriority="high" />
            <span className="text-lg md:text-xl font-bold tracking-tight text-on-surface font-[family-name:var(--font-headline)]">
              StyleSense
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 mt-1">
            {navLinks.map(({ href, label, id }) => {
              const isActive = activePath === id;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm tracking-tight pb-1 uppercase font-[family-name:var(--font-headline)] transition-colors ${
                    isActive
                      ? "font-bold text-primary border-b-2 border-primary"
                      : "font-semibold text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-4">
            <ProfileDropdown />
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 bg-white/90 backdrop-blur-xl border-t border-black/[0.04] md:hidden z-50"
        aria-label="Mobile navigation"
      >
        {mobileLinks.map(({ href, label, icon, id }) => {
          const isActive = activePath === id;
          const IconComp = MOBILE_ICONS[icon];
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[56px] transition-colors ${
                isActive ? "text-primary" : "text-outline hover:text-on-surface"
              }`}
            >
              {IconComp && <IconComp size={22} fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 0 : 1.5} />}
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
