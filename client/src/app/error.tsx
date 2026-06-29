"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";import { AppIcon } from "@/components/ui/AppIcon";


export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center px-6" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Logo */}
      <Link href="/" className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2.5">
        <img src="/logo.png" alt="StyleSense" className="w-8 h-8 object-contain" />
        <span className="text-xl font-bold tracking-tight text-[#1b1c1b]" style={{ fontFamily: "Manrope, sans-serif" }}>StyleSense</span>
      </Link>

      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-8">
          <AppIcon name="error_outline" size={40} className="text-red-500" />
        </div>

        {/* Status */}
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#747686] block mb-3">500</span>

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1b1c1b] mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
          Something went wrong
        </h1>

        {/* Description */}
        <p className="text-[#5a6060] text-base leading-relaxed mb-10">
          We encountered an unexpected error. Please try again in a moment. Our team has been notified.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-7 py-3.5 rounded-full text-white font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer"
            style={{ background: "linear-gradient(135deg, #002b92, #003ec7)" }}
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-7 py-3.5 rounded-full border-2 border-[#002b92] text-[#002b92] font-bold text-sm hover:bg-[#002b92]/5 transition-colors text-center"
          >
            Go Home
          </Link>
        </div>

        {/* Error digest for support */}
        {error.digest && (
          <p className="mt-8 text-[10px] text-[#747686] font-mono">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
