"use client";

import Link from "next/link";
import ProfileDropdown from "./ProfileDropdown";

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

  return (
    <>
      {/* Desktop Header Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex justify-between items-center w-full px-6 md:px-12 h-20 max-w-[1440px] mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="StyleSense" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-black" style={{ fontFamily: "Manrope, sans-serif" }}>StyleSense</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 mt-1">
            {navLinks.map(({ href, label, id }) => {
              const isActive = activePath === id;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm tracking-tight pb-1 uppercase ${
                    isActive
                      ? "font-bold text-blue-700 border-b-2 border-blue-700"
                      : "font-semibold text-gray-500 hover:text-black transition-colors"
                  }`}
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-5">
            <ProfileDropdown />
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-6 pb-8 pt-4 bg-white/90 backdrop-blur-2xl border-t border-gray-100 md:hidden z-50">
        <Link 
          href="/discover"
          className={`flex flex-col items-center gap-1 transition-colors ${activePath === 'discover' ? 'text-blue-700' : 'text-gray-400 hover:text-gray-900'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activePath === 'discover' ? "'FILL' 1" : "'FILL' 0" }}>search</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Discover</span>
        </Link>
        <Link 
          href="/wardrobe"
          className={`flex flex-col items-center gap-1 transition-colors ${activePath === 'wardrobe' ? 'text-blue-700' : 'text-gray-400 hover:text-gray-900'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activePath === 'wardrobe' ? "'FILL' 1" : "'FILL' 0" }}>checkroom</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Wardrobe</span>
        </Link>
        <Link 
          href="/analysis"
          className={`flex flex-col items-center gap-1 transition-colors ${activePath === 'analysis' ? 'text-blue-700' : 'text-gray-400 hover:text-gray-900'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activePath === 'analysis' ? "'FILL' 1" : "'FILL' 0" }}>auto_awesome</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Analysis</span>
        </Link>
      </nav>
    </>
  );
}
