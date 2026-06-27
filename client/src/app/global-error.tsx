"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <head>
        <title>Error | StyleSense</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", background: "#fcf9f8", color: "#1b1c1b" }}>
        {/* Logo */}
        <a href="/" style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo.png" alt="StyleSense" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#1b1c1b", fontFamily: "Manrope, sans-serif" }}>StyleSense</span>
        </a>

        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          {/* Icon */}
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#ef4444" }}>warning</span>
          </div>

          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#747686", marginBottom: 12 }}>Critical Error</p>

          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16, fontFamily: "Manrope, sans-serif" }}>
            Something went wrong
          </h1>

          <p style={{ color: "#5a6060", fontSize: 15, lineHeight: 1.6, marginBottom: 40 }}>
            The application encountered a critical error. Please try again. Our team has been automatically notified.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{ padding: "14px 28px", borderRadius: 9999, background: "linear-gradient(135deg, #002b92, #003ec7)", color: "white", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{ padding: "14px 28px", borderRadius: 9999, border: "2px solid #002b92", color: "#002b92", fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              Go Home
            </a>
          </div>

          {error.digest && (
            <p style={{ marginTop: 32, fontSize: 10, color: "#747686", fontFamily: "monospace" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
