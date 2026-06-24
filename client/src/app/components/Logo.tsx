import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
      <div 
        className={`relative shrink-0 overflow-hidden rounded-lg ${
          size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-12 h-12"
        }`}
      >
        <Image
          src="/logo.png"
          alt="StyleSense Logo"
          fill
          sizes={size === "sm" ? "24px" : size === "md" ? "32px" : "48px"}
          className="object-cover"
          priority
        />
      </div>
      <span
        className={`${sizeClasses[size]} font-black tracking-tighter text-[#1b1c1b] dark:text-[#fcf9f8] transition-colors`}
        style={{ fontFamily: "Manrope, sans-serif" }}
      >
        StyleSense
      </span>
    </Link>
  );
}
