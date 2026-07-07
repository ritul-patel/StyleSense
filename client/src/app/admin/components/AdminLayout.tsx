"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { AppIcon } from "@/components/ui/AppIcon";


const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/blog", label: "Blog", icon: "mail" },
  { href: "/admin/products", label: "Products", icon: "inventory_2" },
  { href: "/admin/products/import", label: "Import CSV", icon: "upload_file", indent: true },
  { href: "/admin/products/images", label: "Upload Images", icon: "add_photo_alternate", indent: true },
  { href: "/admin/products/metadata", label: "AI Queue", icon: "auto_awesome", indent: true },
  { href: "/admin/images/migration", label: "Image Migration", icon: "cloud_sync", indent: true },
  { href: "/admin/outfits", label: "Outfits", icon: "checkroom" },
  { href: "/admin/users", label: "Users", icon: "group" },
  { href: "/admin/feedback", label: "Feedback", icon: "inbox" },
  { href: "/admin/analytics", label: "Analytics", icon: "analytics" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [{ label: "Admin", href: "/admin/dashboard" }];
  if (parts.length > 1) {
    const page = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    crumbs.push({ label: page });
  }
  return crumbs;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const breadcrumbs = getBreadcrumbs(pathname);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa]" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-64 bg-[#1b1c1b] text-white flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/10">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#002b92] flex items-center justify-center">
              <AppIcon name="shield_person" size={14} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>Admin</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon, indent }: any) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 ${indent ? "pl-10" : "px-4"} py-2.5 rounded-xl text-sm transition-all ${isActive ? "bg-white/10 text-white font-semibold" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                <AppIcon name={icon} size={18} filled={isActive} />
                <span className={indent ? "text-xs" : ""}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
            <AppIcon name="arrow_back" size={20} />
            Back to Site
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all mt-1">
            <AppIcon name="logout" size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-gray-300">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="text-gray-500 hover:text-[#002b92] transition-colors">{crumb.label}</Link>
                ) : (
                  <span className="text-[#1b1c1b] font-semibold">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{user?.email}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#002b92] to-[#003ec7] flex items-center justify-center text-white text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8" data-lenis-prevent>
          {children}
        </main>
      </div>
    </div>
  );
}
