import Link from "next/link";
import type { Metadata } from "next";import { AppIcon } from "@/components/ui/AppIcon";


export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center px-6" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Logo */}
      <Link href="/" className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2.5">
        <img src="/logo.png" alt="StyleSense" className="w-8 h-8 object-contain" />
        <span className="text-xl font-bold tracking-tight text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>StyleSense</span>
      </Link>

      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-[#dde1ff] flex items-center justify-center mx-auto mb-8">
          <AppIcon name="explore_off" size={40} className="text-[#002b92]" />
        </div>

        {/* Status */}
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#747686] block mb-3">404</span>

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1b1c1b] mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-[#5a6060] text-base leading-relaxed mb-10">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-7 py-3.5 rounded-full text-white font-bold text-sm hover:scale-[1.02] transition-transform"
            style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}
          >
            Go Home
          </Link>
          <Link
            href="/analysis"
            className="px-7 py-3.5 rounded-full border-2 border-[#002b92] text-[#002b92] font-bold text-sm hover:bg-[#002b92]/5 transition-colors"
          >
            Start Analysis
          </Link>
        </div>
      </div>
    </div>
  );
}
