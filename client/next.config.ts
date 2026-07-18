import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "@supabase/supabase-js",
      "lucide-react",
      "posthog-js",
      "react-scroll",
      "lenis",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75],
    minimumCacheTTL: 31536000, // 1 year - images are content-addressed
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "assets.myntassets.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "d2wbq7o4qxi60y.cloudfront.net" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "image.hm.com" },
      { protocol: "https", hostname: "imagescdn.allensolly.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "offduty.in" },
      { protocol: "https", hostname: "uizrytwhgvvwhrdwwyyh.supabase.co" },
    ],
  },
  // Compression handled by Vercel CDN - disable Node.js gzip for faster SSR
  compress: false,
  // TypeScript errors must be fixed - do not suppress in production builds
  typescript: {
    ignoreBuildErrors: false,
  },
  // Cache build artifacts
  cacheMaxMemorySize: 128,
  // Headers for static assets
  async headers() {
    return [
      {
        source: "/logo.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/(.*)\\.(png|jpg|jpeg|webp|avif|ico|svg)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

// Only wrap with Sentry in production builds - it significantly slows dev compilation
const isDev = process.env.NODE_ENV === "development";

let exportedConfig: NextConfig = nextConfig;

if (!isDev) {
  const { withSentryConfig } = require("@sentry/nextjs");
  exportedConfig = withSentryConfig(nextConfig, {
    org: "stylesense-42",
    project: "javascript-nextjs",
    silent: true,

    // Source maps
    widenClientFileUpload: true,
    hideSourceMaps: true,

    // Tunnel to bypass ad blockers
    tunnelRoute: "/monitoring",

    // Performance
    automaticVercelMonitors: true,
    disableLogger: true,
  });
}

export default exportedConfig;
